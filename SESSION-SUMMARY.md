# NorthGuard — Build Session Summary (Part B)

**Run:** continuous build from the amended specs, Sprints 1 → … → 9 (visual fidelity) → 10 (reachability) → 11 (using-the-system findings + journey harness).
**Outcome:** **Sprints 1–11 COMPLETE.** Sprint 10 made every tested component reachable; Sprint 11 acted on six findings from using the running system, wired the FP report to its real destinations, and added an evidence-producing journey click script. **350 core vitest + 88 web vitest + 59 pytest green, tsc strict clean across core + web.** See `TESTING.md` (repo root) for how to run everything. Commits through the Sprint-11 commits on `main`.

## Sprint 11 — findings from using the system + journey harness (this run)
- **F1 · Markdown in the reply.** `renderMarkdown` (SF-5037) renders headings/bold/lists/code as React elements (no `dangerouslySetInnerHTML`), display-only; ⟨…⟩ chips and rehydrated values stay visually distinct.
- **F2 · No raw rule constant in the view.** ReportPanel resolves via `ruleDisplayName`; SF-5102 gate fails if any `RULE-` reaches rendered text (the shape fix).
- **F3 · No fabricated documents.** The forwarding prompt refuses to invent content for a document/contract/email/file it wasn't given — say it's missing, ask for it.
- **F4 · FP report wired to real destinations.** Submit writes a governance ledger entry (govKind `fp-report`, NG-12/FR-18); GET /api/fp-queue reads them back grouped by trigger (NG-13) into the management FP tab; the management entry shows a "Fehlalarme · N" badge (`fpOpen` on /api/health).
- **F5 · NG-25 — model gaps vs masked values.** The model marks its own blanks with ⟨…⟩ (not `[…]`); the app no longer strips them; the reply labels **maskiert** (offer the session value) vs **vom Modell offen gelassen** (no homework), counts stated separately. New invariant NG-25.
- **F6 · Attachment signposted, not built.** A disabled composer control + tooltip; deferred in DECISION-REGISTER §11.
- **Journey + policy header.** The header shows the active **Schutzprofil v1.0 · <hash>** at all times; `web/scripts/journey.mjs` drives the six-step journey and writes `evidence/` (report.json + per-step PNGs, blockers.md on any block) — this run all six PASS; a `?mock=` run shows a red **MOCK** label in the status bar.
- **Review screenshot:** `prototype/screenshots/reply-placeholders.png` — the reply with all three run classes; this is the one that shows F5 landed.

## Sprint 10 — Reachability (act on AUDIT-component-bypass.md) (this run)
Principle applied: **a tested component that nothing renders is not done** — either the app mounts it or it is deleted. Findings F1–F6 from `AUDIT-component-bypass.md`, in demo-priority order:
- **F5 (highest)** — wired `ReplyMessage` with `buildReplyView/buildCopyModel/buildRestoreSuggestion`. The app now surfaces the **partial** and **not-rendered** reply states, the open-placeholder (NG-9) chips with an explicit insert/leave choice, "Was der Anbieter sah", and copy-with-warning. This is what a live demo hits, since a weak model regularly fails to reproduce a placeholder verbatim.
- **F2** — converged the management room on **one** surface (`ManagementView`/`ThresholdGate`) consuming `buildBriefingView`/`buildThresholdModel`; deleted `BriefingDocument`/`ThresholdCard`. The gateway returns structured `BriefingInputs`; the app renders the **document** (not raw markdown); the harness feeds a `BriefingInputs` fixture through the same view-model, so the **screenshots render what the app renders**.
- **F3/F4** — render the tested `ViewToggle` (deleted the inline toggle + `ProviderView`); use `selectFootnote` (the inline version was wrong for the provider view).
- **F1** — wired the false-positive **report flow** (`ReportPanel` + AF-507 view-models): the "Fehlalarm melden" links now open the form in the mirror slot, submit hands a payload to the sink (context withheld unless opted in), and a quiet in-conversation notice appears.
- **F6 + helper** — area-menu label now comes from `deriveComposerView` (deleted two duplicate derivations); extracted `mappingFrom` → tested `buildClientMapping` (SF-5036).
- **The structural gate (the deliverable):** `orphanComponents.test.ts` fails if any `src/**/*.tsx` is imported only by tests (proven to bite on a probe); `App.integration.test.tsx` mounts the real App and asserts the report flow, view toggle, reply footer, and management document are reachable.
- **Per-area block-echo decision (DECISION-REGISTER §10):** `Area.echoBlockedSpans` (default true; false for credential-class). Echo-true renders the literal §3 `block.body {spans}` with the user's own value (client-side only); echo-false (Zugangsdaten) renders the scoped `block.body_area` — names the area, never the value.
- **Forwarding model:** gateway `FORWARD_MODEL` defaults to **qwen2.5:7b-instruct** (backstop stays small) — the ~7B minimum the Sprint 9 A/B established for reliable placeholder handling.

## Sprint 9 — Visual fidelity to the Handoff + placeholder correctness
The problem: Sprint 6 built the behaviour beneath the surface correctly but left the surface an unstyled shell, and `App.tsx` bypassed the tested component library entirely (hardcoding "Maskiert senden" on every state, raw `#fff`, no Nordic Clarity fonts). It shipped because every Sprint-6 test verified behaviour, not appearance — a view-model returning `state:'clean'` passed whether the composer rendered as designed or as a browser default.

- **P0 — visual fidelity.** Rewrote the composer, submission mirror, block panel, area-menu button and the two management surfaces (briefing document + threshold) to §4 tokens (colour/font/radius/gradient all token-sourced), §1.1 state chrome (sweep line, reserved-space mirror rule 14, tone-driven send button, degraded strip) and §2 timings. Loaded Fraunces / Inter Tight / JetBrains Mono. `App.tsx` now drives the **real** `Composer` through the §1.1 state machine and renders the two rooms (workspace = tool with sidebar/bubbles; management = 720px Fraunces document, no sidebar, no person column).
- **The gate that would have caught it (the deliverable, as much as the fix).** Added a deterministic state harness rendering every §1.1 state + management surface, and two CI gates over it: **token-fidelity** (every rendered element's colour/font/radius/gradient resolves to a §4 token — fails on a raw hex or browser default) and **string-fidelity** (every UI string equals the §3 catalogue per language; no stray/leaked text; the clean composer must read "Senden", the touched composer "Maskiert senden"). Plus an App-level regression (`SF-5017`) encoding the exact shipped bug, and **seven committed screenshots** in `prototype/screenshots/`.
- **P1 — placeholder contamination.** Root cause: the gateway's forwarding prompt always told the model to preserve "Platzhalter … wie ⟨Preis⟩ oder ⟨Kundenname⟩" — handing a 4B model the exact tokens it then invented on clean prompts. Fix: `buildForwardMessages` preserves placeholders **without** seeding examples, and omits the instruction entirely on a clean wire; `stripUnmappedPlaceholders` removes invented ⟨…⟩ from the **displayed** reply only (never the wire, never the ledger — NG-1/NG-9). **A/B finding** (`scripts/p1_contamination_experiment.py`): gemma3:4b old prompt = 14 invented (8 on clean); new prompt = **0 on clean**; qwen2.5:7b-instruct = **0 under either design** → contamination is model weakness amplified by prompt design. Recommend a ≥7B instruct model for forwarding; keep the strip as defense-in-depth. Verified end-to-end against the running gateway (clean wire → 0 invented).
- **P2 — ambiguous placeholder name.** `classifyEntityType` maps `RULE-EMAIL` to **"E-Mail-Adresse"**, not the ambiguous "E-Mail" (the model had used ⟨E-Mail⟩ to mean "message": "ich hoffe, diese ⟨E-Mail⟩ findet Sie gut"). Full placeholder-set audit recorded in the source; the remaining names each denote one referent.
- **New SW-Functions:** SF-5065 radii, SF-5066 global tokens CSS, SF-5067 UI style tokens, SF-5054 `<Msg>`/`<Content>`, SF-5016 area-menu button, SF-5025 block panel, SF-5026 rule display name, SF-5035 strip-unmapped, SF-5041 forward messages, SF-5091–97 harness + gates + management surfaces + screenshots.
- **Review follow-ups (post-screenshot):** (1) a clean result under **degraded** coverage now names the reduced basis in the footer ("· nur Regeln") instead of claiming a full check (NG-2/NG-24); (2) the touched attribution shows the **human rule label** (`ruleDisplayName`, e.g. "Regel „E-Mail-Adresse“") rather than the `RULE-EMAIL` code constant; (3) the block body was reworded to name the **area** ("Im Bereich {area} wurde etwas erkannt, das nicht übermittelt wird.") instead of echoing the placeholder — it says what it means without echoing the credential value (a deliberate deviation from the literal §3 `block.body {spans}` string, since we do not echo blocked values). Screenshots regenerated.

## Sprint 8 — Integration (this run): a running system + one real-service leak found and fixed
- **Config + health + services:** one `.env` surface (`ng_config.py`), a health-check that names the down service (no silent fallback), the E3 backstop wired to the local model, the kg-gen sidecar on the local model (chunked, clustering off for weak local models), the pinned e5 embedder fetched (recorded commit `d128…`), the B4 bridge (Python E7 → TS briefing), and the **governed web UI served** (gateway + Vite, LAN-reachable, one-command `run_all.py`).
- **Real tenant onboarded** on a published GDD AI-policy → baseline v1.0 (21 extracted concepts as provenance; 6 enforceable canonical areas).
- **NG-1 leak found by the smoke test, then fixed:** the LLM backstop was skipped when rules already hit, so a prompt mixing an email (rule) with a customer/person name (model-only) shipped the name to the provider while reporting `coverage: full`. Fix: backstop runs on every model-relevant policy; **NG-24** added (coverage `full` only when every layer ran); value-based backstop findings + anchor-by-substring; regression matrix (rule-only/model-only/both/short/long/backstop-down). Smoke test now passes end-to-end.
- **Also fixed:** an NG-1 placeholder-label false-positive (`⟨Marge⟩` vs the word "Marge"); kg-gen clustering retry-storm on the weak local model.
- **Measured (gemma3:4b, Core Ultra 7 155H / 31 GB):** inspection p95 409 ms (short) to ~1170 ms (generative) vs 800 ms budget — over budget on the local model, recorded not blocked; extraction stability SI=1.0 across all 3 corpus policies (temp-0 determinism); E7 clustering over-clusters short German prompts at cosine 0.85 (follow-up).
- **Follow-ups recorded** (need their own stories/validation data): mapGraphToAreas→canonical reconciliation; E7 cosine threshold / length-aware similarity; a faster backstop model or constrained decoding for latency. All privacy invariants (NG-1/10/19/21/24) held throughout, including where model *quality* was weak.

## Sprint 7 — Amendment B build (this run)
- **F1** — `guardActivation(areas, stability, requireStability=true)`: the initial baseline requires convergence; a later Änderungsantrag baseline passes `requireStability=false` (no stability check, the measurement is kept). US-042.
- **F2** — NG-6 reworded to "one convergence run per policy version" (multiple onboarding passes; a baselined version is never re-extracted). US-014a.
- **F3** — `previewRuleNarrowing` computes a **real** before/after over the stored NG-23 structural features when the narrowing is feature-expressible (`measured:true`); otherwise `measured:false` with a stated reason. The figure is never fabricated. US-022a.
- **F4** — the Schutzprofil is a **baseline-versioned** configuration item (AF-209): version/date/approver/basis/checksum, previous baseline stays readable (NG-22). US-042.
- **Onboarding** — multi-pass convergence (AF-207, US-040) + clarifying questions that cite the policy (AF-208, US-041).
- **Review cycle** (AF-609, US-043) — reads the business-event records + baseline, proposes changes with numeric evidence, **applies nothing**; cadence decays with baseline age; proposing nothing is valid.
- **Änderungsantrag** (AF-610, US-044) — the only path to a new baseline. **Decision encoded:** same person as requester and approver is allowed by default and recorded ("beantragt und freigegeben von derselben Person"); a self-approval may not occur in the **same session** as the request (explicit test); four-eyes is a per-tenant setting.
- **E7 one store** (US-025a) — the Python loader reads NG-23 features + workTopic off the ledger; a non-scalar feature value raises `PrivacyViolation`; no person dimension (NG-21).
- **E5 strings** (US-036a) — Einrichtung / Schutzprofil / Review-Vorschlag / Änderungsantrag catalogue namespaces, DE+EN parity, incl. the self-approval + separated-in-time + four-eyes copy.

*(Historical note: the tables below track the core build through Sprint 5; Sprint 6 (E5) and Amendment B are summarised in this header and in SESSION-LOG.)* One stop condition was hit early (NG-18 corpus contradiction, US-010), reported, resolved by the owner (dropped the bare "Nordwerk" form from ENT-004), and the run resumed. Full per-story trace in `SESSION-LOG.md`.

**31 stories, 301 vitest + 55 pytest green, `tsc` strict clean.**
- **Sprint 3** added US-016/017/031/019/021/023 (E4 query/export/unmask + E6 read-models; **NG-20** dual-key unmask).
- **Sprint 4** added US-022 FP-queue, US-024 context, US-025 E7 features + US-026 E7 MinHash (Python), US-020 briefing (partial).
- **Sprint 5** added US-027 semantic clustering (AF-703, **pinned intfloat/multilingual-e5-base**, recorded per NG-15), US-028 pseudonym resolution (AF-704), US-029 temporal patterns (AF-705), US-030 hours-saved synthesis (AF-706, **NG-21** `assert_non_attributable` gate). E7 is complete end-to-end. Commits through `6cfd157`.

## Stories completed (15) — all committed, TDD red→green, `tsc` strict clean
| Story | AF | What | Invariants |
|-------|----|------|-----------|
| US-013 | AF-401 | Append-only hash-chained ledger writer + actor-pseudonym guard | NG-5, **NG-19** |
| US-015 | AF-403 | Governance-event writer | NG-12, NG-19 |
| US-018 | AF-407 (+AF-406) | Durability & backup + chain recompute | NG-17, NFR-06 |
| US-001 | AF-201 | Policy ingest (text/PDF → normalized + hash) | — |
| US-002 | AF-202 | Extract protected concepts (sidecar, cached) | NG-6 |
| US-003 | AF-203 | Stability gate (0.80) | NG-3, NFR-07 |
| US-004 | AF-204 | Confirm & edit areas | NG-3 |
| US-005 | AF-205/206 | Area modes + guarded, logged activation | NG-3, NG-12 |
| US-006 | AF-301 | Rules layer (DE+EN, validated German identifiers) | NG-7, NG-16, **NFR-01** |
| US-007 | AF-302 | LLM backstop + graceful degradation | NG-4 |
| US-008 | AF-303 | Verdict decision core **+ full `assembleVerdict` (SF-3035)** | NG-8, **NG-5**, **NG-1** |
| US-009 | AF-304 | Semantic indexed placeholders | NG-11, NG-14 |
| US-010 | AF-305 | Keyed pseudonyms + corpus-validated German normalisation | **NG-10, NG-18** |
| US-011 | AF-306 | Wire transcript + two-transcript isolation | **NG-1** (§8 10-turn) |
| US-012 | AF-307 | Rehydration — declension-tolerant, never guess | **NG-9**, NG-14, NG-1 |
| US-014 | AF-402 | Request-entry writer (**pulled forward** from Sprint 3) | NG-2, NG-5, NG-10, NG-19 |

**214 tests green, `tsc` strict clean.** Scaffolds: `core/` (TS strict + Vitest, Node 24), `recurring/` (pytest). Commits `6b33fec`…`ca709d6`.

## Measured figures
- **Rules-layer p95 = 0.302 ms** over 2274 chars of German (NFR-01 budget < 50 ms) — ~165× margin, no optimisation needed.
- **§8 wire-transcript isolation: PASS** — a 10-turn conversation (20 outbound messages, 20 originals) leaks zero originals (`assertWireIsolation`), and `assembleVerdict` re-asserts it on every turn before anything could forward.
- **NG-18 corpus: 19/19** after the ENT-004 fix.
- **Policy stability index on a real 3-page German policy: NOT MEASURED** — needs a running kg-gen sidecar + LLM, not configured here. The stability *code* meets its unit spec; the real-policy measurement is a pending integration step, not a threshold breach (nothing was tuned).

## Invariants verified by automated test
NG-1 (wire isolation, §8 10-turn + per-turn), NG-2/NG-10 (pseudonyms + no raw text in ledger), NG-3 (activation guard), NG-4 (degrade, never fail open), NG-5 (ledger before reply), NG-6 (extract once per version), NG-7 (rules no-network, p95), NG-8 (span attribution), NG-9 (never guess rehydration), NG-11 (semantic placeholders), NG-12 (governance actor+reason), NG-14 (pure transcript engine), NG-16 (DE/EN parity), NG-17 (no key material in backup), NG-18 (corpus 19/19), NG-19 (no plaintext actor in any entry). NFR-01, NFR-06, NFR-07 exercised.

## The one stop condition (resolved)
`de-entity-variants.yml` group **ENT-004** required bare "Nordwerk" ≡ "Nordwerk Systemtechnik" while keeping "Nordwerk Systemtechnik" ≠ "Nordwerk Immobilien" — unsatisfiable by a deterministic normaliser (proof: first-token unifies ENT-004 but collapses all four distinct pairs). Halted per stop conditions #3/#4; the invariant was **not** weakened. Owner chose to drop the bare "Nordwerk" form (with an in-corpus note that bare short-forms need a customer alias table, out of E3 scope). US-010 then went green with **no code change** to the normaliser.

## Key decisions (full list in SESSION-LOG)
- Shared pseudonym HMAC primitive in `core/lib/pseudonym.ts` (E4 actor + E3 entity).
- `assertNoPlaintextActor` (NG-19) landed in US-013, before any writer.
- AF-406 `recomputeChain` pulled into US-018; AF-402 (US-014) pulled into Sprint 2 to complete `assembleVerdict` + NG-5.
- `assembleVerdict(req, policy, ctx)` takes an `InspectionContext {key,userId,provider}` beyond the E1 request (which carries neither key nor raw user id).
- `computeSpans` emits `DetectedSpan`; AF-304/305 enrich → `RedactionSpan`. `buildWireText` also returns the enriched spans.
- `extractPdfText` is a minimal deterministic extractor; production should swap a pinned PDF lib behind the same signature.
- Area ids are canonical lexicon slugs; E2 `mapGraphToAreas` should assign these at integration (currently sidecar node ids).
- Governance-write signatures gained a `key` param (NG-19 postdates the pre-amendment spec).

## What is next
- **Sprints 1–7 — DONE.** Core (E2/E3/E4/E6/E7) + E5 governed chat surface + Amendment B (baselined Schutzprofil, review cycle, Änderungsantrag) all implemented and green. Flags F1–F4 resolved; self-approval decision encoded + tested.
- **Integration sprint (next) — STOPPED HERE at the sprint boundary.** It needs local services running first (kg-gen sidecar, the pinned embedder, the localhost bridge), which are not configured in this workspace. Do not start it until those are up.
- **E1 browser extension** — decompose now that E5 has shipped (block-and-warn coverage surface, DECISION-REGISTER §8 A1).
- **Integration / deployment (E8-class, flagged not blocking):**
  - **Bridge B4** (Python E7 → TS briefing): wire `synthesize_recurring_work` output into `composeWeeklyBriefing` over the localhost JSON interface, to populate real briefing themes.
  - **Pinned embedding model:** fetch `intfloat/multilingual-e5-base` on the backstop host so E7 semantic clustering runs on real data (the pipeline + tests are proven with a deterministic fake).
  - **Measured figures out-of-band:** real kg-gen stability on a 3-page German policy (E2); the FP-narrowing after-count (US-022); dual-key unmask secret store + role binding (E8).
  - Assign canonical area slugs in E2 `mapGraphToAreas`; swap a pinned PDF lib into `extractPdfText`.
- **Before GA** — escalate the E7 AI Act Annex III exposure to counsel (open legal risk, DECISION-REGISTER §8 A5).
- **Sprint 6** — E5 governed chat surface (React SPA over this core).
- **Integration** — assign canonical area slugs in E2 `mapGraphToAreas`; wire a real kg-gen sidecar to measure stability on a real policy; swap a pinned PDF lib into `extractPdfText`.
- **Before GA** — escalate the E7 AI Act Annex III exposure to counsel (open legal risk, DECISION-REGISTER §8 A5).
