# NorthGuard — Function Chains
Runtime execution flow through the App Functions. Static traceability lives in the
spec tree and `manifests/traceability-matrix.md`; this document is the *behaviour*.

Notation: `[1]→[2]` sequential, `[1] [2]` parallel, `[*]` convergence, `[2a]/[2b]`
branches. Bridges (cross-epic runtime seams) are marked `═══` and reference a
shared type in `core/lib/types.ts`.

---

## AF-206: activatePolicyVersion  *(intake → live)*
```
PURPOSE: A confirmed, stable policy version becomes the live enforcement path.
ENTRY:   core/src/features/policy/activate/index.ts
FLOW:
 ├─[1]→ SF-2061 guardActivation
 │        reads: confirmed areas, StabilityReport
 │        returns: void | throws ActivationBlockedError
 │        failure mode: unstable/invalid/unassigned → throw, nothing activates (NG-3)
 ├─[2]→ SF-2062 writeActivationGovernanceEvent            ═══ BRIDGE → E4 AF-403
 │        reads: ActivePolicy, actor
 │        returns: governance entryId
 │        failure mode: ledger write fails → activation aborts (no silent activation)
 └─[3]→ SF-2063 publishActivePolicy
          reads: guarded, logged ActivePolicy
          returns: void (inspection may now forward)
CHAIN LOGIC: sequential
UPSTREAM:    AF-204 (confirm), AF-205 (modes), AF-203 (stability)
DOWNSTREAM:  AF-303 (inspection reads the active policy)
BLAST RADIUS: SF-2061 broken → unstable policies could activate (control integrity). SF-2062 broken → activations unaudited.
```

## AF-303: assembleVerdict  *(the inspection turn — primary chain)*
```
PURPOSE: Decide clean/redact/block for one prompt and record it, before any reply.
ENTRY:   core/src/features/inspection/verdict/index.ts   (called by the E1 adapter)
FLOW:
 ├─[1]→ AF-301 runRulesLayer                (rules/index.ts)
 │        reads: draftPrompt, ActivePolicy, locale
 │        returns: RuleHit[]
 │        depends: lexicons (loaded at boot) — NO network (NG-7)
 │        failure mode: lexicon missing → fail fast at boot, not here
 ├─[2]→ AF-302 runBackstop                  (backstop/index.ts)   [branch]
 │        reads: draftPrompt, RuleHit[], ActivePolicy
 │        returns: {findings, coverage}
 │        depends: local backstop model
 │        failure mode: unreachable → coverage:'rules-only', empty findings (NG-4)
 │        [2a] shouldInvokeBackstop=false → skip (latency budget / already decided)
 │        [2b] invoke → parse findings
 ├─[3]→ SF-3031 resolveTouchedAreas   reads: [1]+[2]   returns: AreaAttribution[]
 ├─[4]→ SF-3032 computeSpans          reads: [1]+[2]   returns: RedactionSpan[] (span attribution, NG-8)
 ├─[5]→ SF-3033 decideVerdictMode     reads: [3], policy → 'clean'|'redact'|'block'
 ├─[6]→ AF-304 generatePlaceholders   reads: prompt, spans → wireText + displayPlaceholders (NG-11)
 ├─[7]→ AF-305 derivePseudonyms       reads: prompt, spans, key → spans w/ pseudonym+keyEpoch (NG-10)
 ├─[8]→ AF-306 buildWireTranscript    reads: history, wireText → WireMessage[]; assertWireIsolation (NG-1)
 ├─[9]→ AF-402 writeRequestEntry       ═══ BRIDGE → E4     reads: verdict, meta+pseudonyms
 │        returns: ledgerEntryId   (written BEFORE the verdict returns — NG-5)
 │        failure mode: ledger write fails → inspection throws; adapter must not forward
 └─[10]→ return InspectionVerdict (to adapter; adapter forwards wire, then rehydrates via AF-307)
CHAIN LOGIC: sequential with a branch at [2]; [6] and [7] are independent (may parallelise)
UPSTREAM:    E1 adapter / E5 (submitForInspection); AF-206 (active policy)
DOWNSTREAM:  adapter/E5 forwardToProvider; AF-307 rehydrate; E4 ledger (actorPseudonym derived at AF-402, NG-19); E7 reads the entry later
NOTE (§8 A4): the backstop (AF-302) is the detector; the rules layer is the latency/determinism path. rules-only coverage means materially reduced recall — surfaced plainly by E5's degraded banner (NG-4).
BLAST RADIUS: AF-306 broken → wire-isolation risk (highest severity). AF-402 broken → unaudited request (NG-5). AF-301 slow → NFR-01 miss.
```

## AF-307: rehydrateReply  *(post-provider, client-side)*
```
PURPOSE: Restore originals into the engineer's view without ever guessing.
ENTRY:   core/src/features/inspection/transcript/rehydrate/index.ts   (runs client-side)
FLOW:
 ├─[1]→ SF-3071 buildRehydrationIndex   reads: client-held mapping (injected — NG-14) → index (+declension variants)
 ├─[2]→ SF-3072 matchPlaceholderTokens  reads: providerText, index, locale → MatchResult
 │        failure mode: ambiguous match → NOT matched (never guess, NG-9)
 ├─[3]→ SF-3073 markRestoredSpans       reads: [2] → restoredText + restoredSpans (display-only, FR-08h)
 └─[3']→ SF-3074 collectUnresolved      reads: [2] → unresolved[] (placeholders stay visible)
CHAIN LOGIC: sequential to [2], then [3] ∥ [3']
UPSTREAM:    E1 adapter / E5 (provider reply stream)
DOWNSTREAM:  E5 AF-503 replyRehydrationView (governed surface) ═══ B7 — restored content NEVER re-enters the wire (NG-1)
BLAST RADIUS: SF-3072 broken → wrong substitution (privacy/quality). Guarded by never-guess: failure degrades to visible placeholder, not a leak.
```

## AF-602: composeWeeklyBriefing  *(management, weekly)*
```
PURPOSE: Turn a week of ledger + recurring-work findings into a short letter.
ENTRY:   core/src/features/management/briefing/index.ts
FLOW:
 ├─[1]→ SF-6021 gatherBriefingInputs
 │        reads: E4 AF-404 stats  ═══ BRIDGE → E4
 │               E7 AF-706 findings ═══ BRIDGE → E7 (localhost)
 │        returns: BriefingInputs (+ rotation coverage caveat if window spans an epoch, R5)
 ├─[2]→ SF-6022 synthesizeThemes    (LLM prose over deterministic inputs; regenerable, FR-13)
 ├─[3]→ SF-6023 synthesizeFriction
 ├─[4]→ SF-6024 assessPolicyFit     reads: FP clusters + current false-block rate
 ├─[5]→ SF-6025 buildBriefingFootnote
 └─[6]→ SF-6026 renderBriefingMarkdown  → briefing (PDF export = same content)
CHAIN LOGIC: [1] then [2][3][4][5] parallel then [6] converge
UPSTREAM:    E4 ledger, E7 recurring-work
DOWNSTREAM:  E5 AF-508 management shell (buildBriefingView) / PDF export
BLAST RADIUS: [1] broken → briefing has no inputs. E7 down → themes degrade to ledger-only (recorded).
```

## AF-604: manageFalsePositiveQueue  *(management, closes the false-block loop)*
```
PURPOSE: Bring the false-block rate under 1/user/week via auditable tuning.
ENTRY:   core/src/features/management/fp-queue/index.ts
FLOW:
 ├─[1]→ SF-6041 groupReportsByTrigger   reads: FP reports → TriggerGroup[]
 ├─[2]→ SF-6042 sortByRepeatFrequency    → repeat offenders on top
 ├─[3]→ SF-6043 previewRuleNarrowing     reads: 30-day ledger window → NarrowPreview
 ├─[4]→ SF-6044 applyResolution           ═══ BRIDGE → E4 AF-403 (governance event, NG-12)
 └─[5]→ SF-6045 notifyReporter            → quiet line in the originating conversation
CHAIN LOGIC: sequential; [4] and [5] follow the human decision
UPSTREAM:    E5 AF-507 report action (span → FP report) ═══ B8; E4 ledger (for preview)
DOWNSTREAM:  E4 governance ledger; E5 reporter notice; AF-602 policy-fit note
BLAST RADIUS: SF-6044 broken → tuning unaudited (NG-12 violation). SF-6043 wrong → bad narrowing decisions.
```

## AF-408: unmaskActor  *(dual-key de-anonymisation — NG-20, E4)*
```
PURPOSE: Recover a person from an actorPseudonym — only under the Vier-Augen-Prinzip.
ENTRY:   core/src/features/ledger/unmask/index.ts
FLOW:
 ├─[1]→ SF-4081 buildUnmaskRequest   reads: target pseudonym + reason → UnmaskRequest (empty reason → throw)
 ├─[2]→ SF-4082 verifyDualAuthorisation  reads: two Authorisations, RoleBinding
 │        failure mode: single authoriser OR same-role pair → throw DualAuthorisationError (NG-20)
 ├─[3]→ SF-4084 writeUnmaskGovernanceEvent   ═══ BRIDGE → E4 AF-403   (BEFORE the identity is resolved)
 │        returns: govKind:'unmask' entryId (both parties + reason + target; NO identity, NO plaintext id)
 ├─[4]→ SF-4083 resolveActorIdentity  reads: target, key, DirectoryProvider (E8-provided interface)
 │        failure mode: no directory match → UnresolvedActorError (never guesses)
 └─[5]→ SF-4085 unmaskActor  → { identity, ledgerEntryId }  (identity returned ONLY after the entry is written)
CHAIN LOGIC: sequential; the ledger entry precedes the identity (an unmask off the record is impossible)
UPSTREAM:    an E6/E8 admin surface with two authenticated authorisers (role binding + secret store = E8, deferred)
DOWNSTREAM:  the two authorised callers only; the identity is never written to the ledger or an export
BLAST RADIUS: SF-4082 broken → single-party unmask (co-determination breach, NG-20). SF-4084 skipped → off-ledger unmask.
```

## AF-706: synthesizeRecurringWork  *(the deep chain — Python)*
```
PURPOSE: Find duplicated effort and name the artefact that removes it, in hours saved.
ENTRY:   recurring/synthesis/__init__.py
FLOW:
 ├─[1]→ AF-701 extractContentFeatures   reads: E4 window (redacted+pseudonyms) ═══ BRIDGE → E4 (NG-10)
 ├─[2]→ AF-702 blockNearDuplicates       (MinHash-LSH)  → candidate pairs   [Stage 1]
 ├─[3]→ AF-703 clusterSemantic           (pinned embeddings, cached, fixed threshold) → Cluster[]  [Stage 2]
 │        depends: local embedding model on backstop host; records model_version+threshold (NG-15)
 ├─[4]→ AF-704 resolveEntities           (pseudonym-keyed; guard_key_epoch — never cross epoch, R5)
 ├─[5]→ AF-705 detectTemporalPatterns    → trend / cadence / cessation
 └─[6]→ AF-706 synthesizeRecurringWork    → RecurringWorkFinding[] (hours saved + artefact, ranked)
CHAIN LOGIC: sequential pipeline; [2] blocks for [3] (Stage 1 reduces embedding volume)
UPSTREAM:    E4 ledger
DOWNSTREAM:  E6 AF-602 briefing
BLAST RADIUS: [1] reading originals → privacy breach (NG-10) — guarded by PrivacyViolation. [3] non-determinism → NG-15 violation. [4] cross-epoch → false linking (R5).
```

---

## Cross-Module Bridges (the fragile seams)

```
BRIDGE B1: E1 adapter ↔ E3 AF-303 (assembleVerdict)
  Mechanism: function call (submitForInspection)
  Contract:  InspectionRequest → InspectionVerdict  (core/lib/types.ts)
  Risk:      if the adapter transmits draftPrompt instead of redactedPrompt → wire leak (NG-1)
  Test:      wire-isolation conformance suite (any adapter must pass)

BRIDGE B2: E3 AF-303 ↔ E4 AF-402 (writeRequestEntry)
  Mechanism: function call, synchronous, BEFORE verdict returns
  Contract:  InspectionVerdict + RequestMeta → ledgerEntryId
  Risk:      reply returned without a ledger entry (NG-5) if ordering inverted
  Test:      ledger-before-reply integration test

BRIDGE B3: E3 AF-305 ↔ E4/E7 (pseudonyms)
  Mechanism: RedactionSpan.pseudonym carried into the ledger, read by E7
  Contract:  pseudonym = HMAC(key, normalize(value)) + keyEpoch (types.ts)
  Risk:      an original value reaching the ledger (NG-10); epoch mismatch mis-clustering (R5)
  Test:      no-originals-in-ledger test; cross-epoch guard test

BRIDGE B4: E7 AF-706 ↔ E6 AF-602 (recurring-work → briefing)
  Mechanism: localhost interface (Python → TS), JSON
  Contract:  RecurringWorkFinding[]  (mirror types in types.ts + recurring/types.py)
  Risk:      the two type definitions drift; a finding naming an original value
  Test:      contract test on the JSON shape; privacy assertion on findings

BRIDGE B5: E2 AF-206 / E6 AF-604 / AF-405 / E4 AF-408 ↔ E4 AF-403 (governance events)
  Mechanism: function call
  Contract:  (GovKind, actorId, reason, payload, key) → entryId  (actor stored as pseudonym, NG-19)
  Risk:      a tuning/activation/export/unmask edit made off-ledger (NG-12); a plaintext actor stored (NG-19)
  Test:      every mutation path writes a governance event; no plaintext user id in any entry

BRIDGE B6: E1 adapter / E5 ↔ E3 AF-303 (submitForInspection) + forwardToProvider
  Mechanism: function call (both surfaces implement InterceptionAdapter)
  Contract:  InspectionRequest → InspectionVerdict; WireMessage[] out (core/lib/types.ts)
  Risk:      E5 forwarding draftPrompt or a restored span instead of the wire (NG-1)
  Test:      the wire-isolation conformance suite (E5 passes it now; the E1 extension later)

BRIDGE B7: E5 AF-503 ↔ E3 AF-307 (client-side rehydration)
  Mechanism: function call; the placeholder→original mapping is client-held, injected (NG-14)
  Contract:  RehydrateResult { restoredText, restoredSpans, unresolved }
  Risk:      a restored value re-entering the wire (NG-1); a guessed substitution (NG-9)
  Test:      restored-never-in-wire; never-guess (delegated to AF-307)

BRIDGE B8: E5 AF-507 ↔ E6 AF-604 (false-positive report)
  Mechanism: function call
  Contract:  FalsePositiveReport → faId
  Risk:      the rest of the prompt shared without the explicit 'Kontext freigeben' opt-in
  Test:      off-by-default context sharing; only span+rule+area cross without opt-in
```

All bridge types live once in `core/lib/types.ts` (TS) with a mirror in
`recurring/types.py` (Python) for B4; neither is duplicated within its language.

---

## End-to-End Flow — the engineer's turn (primary journey)

```
ENGINEER types a prompt (original)
        │
        ▼
  E1 ADAPTER.submitForInspection(InspectionRequest{ draftPrompt=original, history=WIRE })
        │  ═══ B1
        ▼
  E3 AF-303 assembleVerdict
        ├─ AF-301 rules (DE+EN, <50ms, no network)
        ├─ AF-302 backstop  ──(down)──► coverage: rules-only  (NG-4)
        ├─ decide clean / redact / block
        ├─ AF-304 placeholders  ⟨Lieferant 1⟩ …
        ├─ AF-305 pseudonyms   HMAC(key, …)          ═══ B3
        ├─ AF-306 wire transcript + assertWireIsolation (NG-1)
        └─ AF-402 write ledger entry (BEFORE return)  ═══ B2  (NG-5)
        │
        ▼  InspectionVerdict
  ┌─────────────┴───────────────┐
  ▼ (clean/redact)              ▼ (block)
  E1 ADAPTER.forwardToProvider(WIRE only)     no forward; path forward: remove span / report FP → AF-604 ═══ B5
        │ provider reply (placeholders preserved)
        ▼
  E3 AF-307 rehydrateReply(providerText, CLIENT-HELD mapping)   (never guess, NG-9; display-only, NG-1)
        │
        ▼
  ENGINEER sees a useful, locally-restored answer.  Wire transcript is all the provider ever saw.

  ── later, asynchronously ──
  E7 AF-706 reads the redacted+pseudonymised ledger window  ═══ B3
        └─► clusters, resolves, dates → findings ═══ B4 ─► E6 AF-602 Monday briefing
```

---

## Amendment B (§9) — baselined Schutzprofil (spec only, not built)

```
ONBOARDING (E2):
  AF-207 convergeExtraction  (multi-pass until hasConverged; working set INERT)
        → AF-208 generateClarifyingQuestions (5–8, from real ambiguities; answers = provenance)
        → AF-204 confirm → AF-205 modes
        → AF-209 baselineProfile  ═══ BRIDGE → E4 AF-403 (govKind:'baseline')  [supersedes publishActivePolicy — F4]
  NG-22: the active baseline is immutable; only an approved Änderungsantrag makes a new one.

REVIEW CYCLE (E6, cadence fortnightly→monthly→quarterly):
  AF-609 composeReviewProposal  (reads the business-event record; may propose NOTHING)
        → (human approves) → AF-610 openChangeRequest ═══ BRIDGE → E4 (govKind:'change-request')
        → approveChangeRequest ═══ BRIDGE → E2 AF-209 (next baseline)

BUSINESS-EVENT RECORD (E4, NG-23): the request entry carries features + workTopic +
baselineVersion — one store read by BOTH E6 previewRuleNarrowing (real before/after, F3)
AND E7 AF-701. Never two parallel stores.

FLAGS to reconcile at the build: F1 (guardActivation stability → onboarding baseline only),
F2 (NG-6 "once" → "one convergence run per version"), F3 (previewRuleNarrowing real count),
F4 (AF-209 supersedes publishActivePolicy).
```
