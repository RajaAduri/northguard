# EP-05 · App Functions & SW-Function Signatures

Language: **TypeScript (React SPA, Vite), strict; Vitest.** Files under `web/src/`.
The view-model SW functions (the bulk below) are **pure and Vitest-testable**;
`.tsx` files are thin components over those models. Shared contract types come from
`core/lib/types.ts` (E1 contract: `InspectionVerdict`, `WireMessage`,
`RedactionSpan`, `DisplayPlaceholder`, …). E5 **imports** E3's pure rehydration
module (`AF-307`) — it never reimplements detection, redaction, or rehydration.

**Authoritative spec:** `prototype/NorthGuard Handoff.md`. State inventory (§1),
timings (§2), DE/EN strings (§3), spacing/type (§4). Where the Handoff and the
prototype HTML disagree: **Handoff wins for behaviour, HTML for pacing** (§8 A6).

**E5 view types (`web/src/types.ts`):**
```ts
export type ComposerState =
  | 'idle' | 'typing' | 'inspecting' | 'clean' | 'touched'
  | 'blocked' | 'report' | 'report-done' | 'degraded' | 'locked'

export interface ComposerView {          // what the composer renders (derived, never stored)
  state: ComposerState
  statusKey: string                       // i18n key, e.g. 'composer.status_clean'
  sendLabelKey: string                    // 'composer.send' | 'composer.send_redacted'
  sendTone: 'teal' | 'amber' | 'disabled'
  borderTone: 'muted' | 'amber' | 'red'
  mirrorOpen: boolean
  areaMenuLabelKey: string                // 'header.areas_protected' | 'header.areas_touched' | 'header.rules_only'
}
```

> Every `ComposerView` field is **derived** from `(ComposerState, InspectionVerdict?,
> Coverage)`; the composer stores state + the last verdict, never the presentation.

---

## AF-501: composerStateMachine  *(FT-5.1 — the interaction spine)*
**Entry:** `web/src/composer/index.ts` (+ `Composer.tsx`)
**Reads:** `InspectionVerdict` (E3, via the adapter's `submitForInspection`), E2 activation status.

**Business Rules (Handoff §1.1, §2)**
1. A clean prompt shows only a mono status line — no inspection UI while typing (a
   clean prompt must not feel observed). 2. Inspection begins after a **600 ms**
   typing pause or on Send/Enter; any keystroke during `inspecting` aborts →
   `typing`. 3. Inspection line runs ≥ **400 ms** even if the verdict is faster (so
   it is legible). 4. Send during `typing` **auto-sends on `clean`** but **stops on
   `touched`/`blocked`** (never auto-send a finding). 5. `locked` until E2 areas are
   confirmed — no prompt is forwarded (NG-3). 6. `degraded` overlays all states when
   the backstop is unreachable (NG-4) and is never hidden (Handoff rule 3).

```ts
// SF-5011  composer/composerReducer.ts
export function composerReducer(state: ComposerState, ev: ComposerEvent): ComposerState
// 1. GIVEN 'typing' + Edit event THEN stays 'typing'; + PauseElapsed(600ms)|Submit THEN 'inspecting'
// 2. GIVEN 'inspecting' + Edit THEN aborts to 'typing'; + Verdict('clean'|'redact'|'block') THEN 'clean'|'touched'|'blocked'
// 3. GIVEN any state + BackstopDown THEN 'degraded' overlay; + BackstopUp THEN prior state restored
// 4. GIVEN unconfirmed policy THEN 'locked' regardless of input (NG-3); + AreasConfirmed THEN 'idle'
// 5. GIVEN the full §1.1 transition table THEN every documented edge is covered (exhaustive test)

// SF-5012  composer/deriveComposerView.ts
export function deriveComposerView(state: ComposerState, v: InspectionVerdict | null): ComposerView
// 1. GIVEN 'clean' THEN statusKey 'composer.status_clean', sendTone 'teal', mirrorOpen false, areaMenu 'areas_protected'
// 2. GIVEN 'touched' THEN sendLabelKey 'composer.send_redacted', sendTone 'amber', borderTone 'amber', mirrorOpen true, areaMenu 'areas_touched'(_one)
// 3. GIVEN 'blocked' THEN sendTone 'disabled', borderTone 'red', mirrorOpen true
// 4. GIVEN 'degraded' THEN areaMenu 'rules_only' (amber); the degraded strip is shown alongside
// deps: SF-5051 (i18n keys)

// SF-5013  composer/inspectionDebounce.ts
export function inspectionDebounce(onInspect: () => void, ms: number): { onKeystroke(): void; onSubmit(): void; cancel(): void }
// 1. GIVEN keystrokes THEN the 600 ms timer resets on each; fires once after the pause
// 2. GIVEN onSubmit THEN fires immediately (no wait)
// 3. GIVEN cancel THEN no pending fire (abort on further input)
// deps: SF-5061 (motion tokens — the 600 ms value)

// SF-5014  composer/resolvePendingSend.ts
export function resolvePendingSend(pending: boolean, verdict: Verdict): 'auto-send' | 'stop'
// 1. GIVEN Send pressed during typing AND verdict 'clean' THEN 'auto-send'
// 2. GIVEN verdict 'redact' or 'block' THEN 'stop' (no auto-send on a finding — Handoff §1.1)
// 3. GIVEN no pending send THEN 'stop'

// SF-5015  composer/Composer.tsx   (component)
// Wires the reducer + debounce to the adapter's submitForInspection; renders the
// composer strip, inspection sweep (AF-506), and the mirror slot (AF-502) in the
// reserved grid row (grid-template-rows 0fr↔1fr, so the layout never jumps — rule 14).
```
**Chain order:** composerReducer → deriveComposerView → inspectionDebounce → resolvePendingSend → Composer.tsx. **CHAIN LOGIC: event-driven state machine.**

---

## AF-502: submissionMirror  *(FT-5.2 — "what the provider receives")*
**Entry:** `web/src/mirror/index.ts` (+ `SubmissionMirror.tsx`)
**Reads:** `InspectionVerdict.redactedPrompt`, `spans[]`, `touchedAreas[]`.

**Business Rules (Handoff §1.1 touched/blocked, §Spiegel)**
1. The mirror is a **read-only mirror of exactly `redactedPrompt`** (FR-08) — no
   re-derivation. 2. Header: "Das erhält der Anbieter · N Stellen · Bereich(e) ·
   Maskieren". 3. Per-span attribution row: placeholder · layer (rule name / KI-Prüfung)
   · area · "Fehlalarm melden". 4. Blocked variant: no submission, detected spans in
   quotes, ledger note, path forward (remove span / report FP).

```ts
// SF-5021  mirror/buildMirrorModel.ts
export function buildMirrorModel(v: InspectionVerdict): MirrorModel
// 1. GIVEN verdict 'redact' THEN { headerKey:'mirror.title', summary:'mirror.summary'(_one), wireText:v.redactedPrompt, chips, rows }
// 2. GIVEN wireText THEN it is v.redactedPrompt verbatim — asserted byte-identical (FR-08, no re-derivation)
// 3. GIVEN spans THEN one attribution row per span (span-level, NG-8)

// SF-5022  mirror/buildBlockModel.ts
export function buildBlockModel(v: InspectionVerdict): BlockModel
// 1. GIVEN verdict 'block' THEN { headerKey:'block.title', summaryKey:'block.summary', detected: quoted spans, ledgerNoteKey:'block.ledger_note' }
// 2. GIVEN the model THEN path-forward actions are 'block.remove' + 'block.report'; NO send variant (Handoff §1.1 blocked)
// 3. GIVEN the model THEN it carries 'block.no_approval' (there is no per-prompt approval — Handoff rule 7)

// SF-5023  mirror/buildAttributionRow.ts
export function buildAttributionRow(span: RedactionSpan): AttributionRow
// 1. GIVEN layer 'rule' THEN label 'mirror.layer_rule' with the rule name; 'llm' THEN 'mirror.layer_ai'
// 2. GIVEN the row THEN it carries the placeholder, the area, and a 'mirror.report' action targeting this span
// 3. GIVEN a block-area span THEN quoted (Handoff §1.1 blocked), not chipped

// SF-5024  mirror/SubmissionMirror.tsx   (component)
// Opens in the reserved grid row (240 ms ease-out, grid-template-rows 0fr→1fr — §2);
// placeholder chips (JetBrains Mono), attribution bar; amber(27%)/red(33%) border via AF-506.
```

---

## AF-503: replyRehydrationView  *(FT-5.3 — the reply that proves work continues)*
**Entry:** `web/src/reply/index.ts` (+ `ReplyMessage.tsx`)
**Reads:** E3 `AF-307` output `{ restoredText, restoredSpans, unresolved }` (rehydration runs client-side, mapping injected — NG-9/NG-14).

**Business Rules (Handoff §1.2, §3a)**
1. Restored values marked (dotted underline, 180 ms fade); balance line "N Werte
   lokal eingesetzt". 2. **Partial:** unresolved placeholders stay visible as amber
   chips with a suggestion card ("Wert einsetzen"/"So lassen") — **never guessed**
   (NG-9). 3. **Not rendered:** provider paraphrased the placeholder → "0 von N
   eingesetzt", no action. 4. Copy warns the clipboard holds real customer data +
   offers "maskiert kopieren" (3 s line, no toast — rule 13). 5. Restored content is
   **display-only and never re-enters the wire** (NG-1).

```ts
// SF-5031  reply/buildReplyView.ts
export function buildReplyView(r: RehydrateResult): ReplyView
// 1. GIVEN all placeholders resolved THEN mode 'full', footerKey 'reply.restored_full'(_one)
// 2. GIVEN some unresolved THEN mode 'partial', footer 'reply.restored_partial' + 'reply.open_placeholder' (NG-9)
// 3. GIVEN a placeholder the provider did not reproduce THEN mode 'not-rendered', footer 'reply.not_rendered', no action
// deps: E3 AF-307 (imported)

// SF-5032  reply/buildCopyModel.ts
export function buildCopyModel(restoredSpans: RestoredSpan[]): CopyModel
// 1. GIVEN restored values THEN a 3 s line 'reply.copied' + 'reply.copied_warning' + 'reply.copy_redacted'
// 2. GIVEN 'copy redacted instead' THEN copies the wire text (placeholders), not originals
// 3. GIVEN the line THEN it appears at the reply foot, not as a toast (rule 13)

// SF-5033  reply/buildRestoreSuggestion.ts
export function buildRestoreSuggestion(unresolved: string, mapping: PlaceholderMapping): RestoreSuggestion
// 1. GIVEN an inflected placeholder THEN a suggestion card 'restore.suggestion' with apply/keep actions
// 2. GIVEN apply THEN the value is inserted only on explicit action (never auto — NG-9)
// 3. GIVEN keep THEN the placeholder stays visible; nothing is guessed

// SF-5034  reply/ReplyMessage.tsx   (component)
// Placeholder chips visible ≤ 400 ms then restore (§2); restored spans dotted-underlined;
// in Anbietersicht the placeholder state stays permanent with the wire footer (§1.2). Restored
// content is display-only — it is never passed to forwardToProvider (NG-1).
```

---

## AF-504: providerViewToggle  *(FT-5.4 — the second transcript, made visible)*
**Entry:** `web/src/provider-view/index.ts` (+ `ViewToggle.tsx`)
**Reads:** `WireMessage[]` (the wire transcript — the only thing transmitted, NG-1).

**Business Rules (Handoff §1.3, §1.4)**
1. Toggle "Ihre Sicht / Anbietersicht" appears **only from the first sent message**.
2. The provider view shows **exactly the wire transcript** — placeholders, including
   as history (NG-1). 3. Footnote copy is state-dependent (default / after first
   restore / provider-view) per §1.4.

```ts
// SF-5041  provider-view/buildWireTranscriptView.ts
export function buildWireTranscriptView(wire: WireMessage[]): WireView
// 1. GIVEN wire messages THEN a placeholder-chip rendering of each (JetBrains Mono, §4)
// 2. GIVEN the view THEN it contains no original value — it is literally what left the building (NG-1)
// 3. GIVEN a reply turn THEN its wire footer 'reply.wire_footer' ("values were restored only in your browser")

// SF-5042  provider-view/selectFootnote.ts
export function selectFootnote(ctx: { view: 'own'|'provider'; hasRestored: boolean }): string
// 1. GIVEN own view, no restore yet THEN 'footnote.default'
// 2. GIVEN own view after first restore THEN 'footnote.restored'
// 3. GIVEN provider view THEN 'footnote.provider_view'

// SF-5043  provider-view/ViewToggle.tsx   (component)
// Tab background 160 ms; content swaps hard (§2). Toggle hidden until first sent message (§1.3).
```

---

## AF-505: i18nCatalogue  *(FT-5.5 — three-level language)*
**Entry:** `web/src/i18n/index.ts`
**Reads:** DE/EN string catalogues (Handoff §3 keys).

**Business Rules (Handoff §3, rule 11; NG-16)**
1. **Three language levels:** UI copy follows the **person** (per-user); area/rule
   names follow the **policy document** (original + muted translation); wire
   placeholders and the evidence export follow the **tenant** (fixed at setup,
   logged, not per-export). 2. German is the default; DE/EN key parity is required.
3. Pluralised keys (`*_one` vs plural) are resolved by count.

```ts
// SF-5051  i18n/loadStringCatalogue.ts
export function loadStringCatalogue(): { de: Catalogue; en: Catalogue }
// 1. GIVEN the catalogues THEN every key in Handoff §3 exists in both DE and EN (parity — NG-16)
// 2. GIVEN a missing key in one language THEN throws at load (fail fast, no silent fallback)
// 3. GIVEN DE THEN it is the default locale

// SF-5052  i18n/resolveUiLocale.ts
export function resolveUiLocale(userPref: Locale | null): Locale
// 1. GIVEN a user preference THEN it wins (per-user, rule 11)
// 2. GIVEN none THEN 'de' (default case)
// 3. GIVEN a change THEN it affects UI copy only — NOT area names (those follow the policy)

// SF-5053  i18n/formatMessage.ts
export function formatMessage(key: string, locale: Locale, params?: Record<string, string|number>): string
// 1. GIVEN 'briefing.meta' + params THEN {kw},{range},{p},{r} interpolated
// 2. GIVEN a count param THEN the _one vs plural key variant is selected (e.g. areas_touched_one)
// 3. GIVEN a missing param THEN throws in dev (no half-formatted string shipped)

// SF-5054  i18n/languageLevels.ts
export function resolveLanguageLevel(kind: 'ui'|'policy-name'|'wire-placeholder'|'evidence'): LanguageSource
// 1. GIVEN 'ui' THEN source 'user'
// 2. GIVEN 'policy-name' THEN source 'policy' (original + muted translation alongside)
// 3. GIVEN 'wire-placeholder' or 'evidence' THEN source 'tenant' (fixed at setup, logged — rule 11)
```

---

## AF-506: motionAndDesignTokens  *(FT-5.6 — the prototype timings ARE the spec)*
**Entry:** `web/src/design/index.ts`

**Business Rules (Handoff §2, §4)**
1. The timing table §2 is the specification, not decoration — encode it as typed
   tokens and drive every animation from them. 2. No motion beyond §2 (no springs,
   bounces, or scaling). 3. Colours per §4: teal (action/connection), amber
   (touched/redact/report), red (blocked/outage); **no green, no gradients except
   the inspection line.** 4. Type rule: everything the **system says** is Mono;
   everything **humans read** is Inter Tight; Fraunces for titles + management view.

```ts
// SF-5061  design/motionTokens.ts
export const motion: MotionTokens
// 1. GIVEN the tokens THEN debounce=600ms, inspectionSweep target=800ms/min=400ms, mirror=240ms(ease-out), border=200ms, sendLabel=160ms, restore=+400ms/180ms, threshold=320ms(ease-in-out), copyHint=3000ms
// 2. GIVEN a component THEN it reads durations/curves from here, never hardcodes them
// 3. GIVEN a value THEN it matches Handoff §2 exactly (fidelity test against the table)

// SF-5062  design/colorTokens.ts
export const color: ColorTokens
// 1. GIVEN the tokens THEN bg.canvas #070b14, bg.surface #0B1220, teal #3FBFB0, amber #F5A623, red #e5657a, muted #8a97ab (+ tints per §4)
// 2. GIVEN the palette THEN there is NO green token and no gradient except the inspection sweep (assertable)
// 3. GIVEN a tint THEN amber-chip bg #F5A62322, touched border #F5A62344, blocked border #e5657a55

// SF-5063  design/typeScale.ts
export const type: TypeScale
// 1. GIVEN a system string (status/count/ledger/wire) THEN JetBrains Mono
// 2. GIVEN human-read text (prompt/reply/explanation) THEN Inter Tight
// 3. GIVEN a title or the management view THEN Fraunces (sizes/tracking per §4)

// SF-5064  design/inspectionSweep.ts
export function inspectionSweepParams(inspectionMs: number): SweepParams
// 1. GIVEN an inspection duration THEN a 2px teal sweep, period = duration, min 400 ms so it is legible (§2)
// 2. GIVEN a transparent→teal→transparent gradient THEN this is the ONLY gradient in the product (§4)
// 3. GIVEN real latency THEN the line loops until the verdict arrives
```

---

## AF-507: falsePositiveReportFlow  *(FT-5.7 — report, from a span; bridges E6)*
**Entry:** `web/src/report/index.ts` (+ `ReportPanel.tsx`)
**BRIDGE:** submits to E6 `AF-604` (the FP queue). **Consumes** the span from AF-502.

**Business Rules (Handoff §1.1 report/report-done, §Meldung, rules 7/8)**
1. The report form **replaces the mirror content in the same space** (not a modal).
2. It carries span · detected-by · area · context, with an explicit **"Kontext
   freigeben"** choice (the rest of the prompt is only shared on opt-in). 3. On
   submit: "Gemeldet · FA-nnn", **the rule stays active**, a week count, and a path
   forward. 4. **There is no per-prompt approval** — the way out is rephrase or
   report (rule 7); this sentence is shown. 5. Every report gets a reply, even a
   "no", as a **quiet line in the originating conversation** — no toast, no
   notification centre (rule 8/13).

```ts
// SF-5071  report/buildReportForm.ts
export function buildReportForm(span: RedactionSpan, conv: ConversationRef): ReportForm
// 1. GIVEN a span THEN form fields span/detected-by/area/context prefilled from the span + conversation
// 2. GIVEN the form THEN 'report.share_context' defaults OFF (only the marked span + rule are shared otherwise — 'report.privacy')
// 3. GIVEN cancel THEN the mirror content is restored in place (same space)

// SF-5072  report/submitReport.ts
export async function submitReport(form: ReportForm): Promise<{ faId: string }>
// 1. GIVEN a submitted form THEN it is handed to E6 AF-604 [BRIDGE]; E5 writes no ledger/state itself
// 2. GIVEN success THEN a false-positive id (FA-nnn) is returned
// 3. GIVEN 'share context' off THEN only the span + rule + area cross the bridge (privacy)
// deps: E6 AF-604 [BRIDGE]

// SF-5073  report/buildReportDone.ts
export function buildReportDone(faId: string, weekCount: number, mode: 'block'|'redact'): ReportDone
// 1. GIVEN a report THEN 'report.done'(id) + 'report.rule_stays' + week count ('report.week_count'|'report.week_first')
// 2. GIVEN mode 'block' THEN path forward 'report.rephrase'; mode 'redact' THEN 'report.continue_redacted'
// 3. GIVEN the panel THEN it states there is no per-prompt approval ('block.no_approval' spirit — rule 7)

// SF-5074  report/buildReporterNotice.ts
export function buildReporterNotice(state: 'pending'|'applied'|'declined', payload: NoticePayload): ReporterNotice
// 1. GIVEN 'pending' THEN 'notice.pending' + 'notice.pending_sub' as a quiet in-conversation line (rule 8)
// 2. GIVEN 'applied' THEN 'notice.applied'(change) + 'notice.would_pass' + a retry action
// 3. GIVEN 'declined' THEN 'notice.declined' WITH the quality lead's reasoning (a no still gets an answer)

// SF-5075  report/ReportPanel.tsx   (component)
// Form/opacity 140–160 ms (§2); replaces the mirror slot; report-done + notice render inline in the conversation.
```

---

## AF-508: twoRoomsThreshold  *(FT-5.8 — workspace ↔ management document)*
**Entry:** `web/src/rooms/index.ts` (+ `ThresholdGate.tsx`, `ManagementView.tsx`)
**Reads:** E6 read-models (`AF-601` exposure, `AF-602` briefing, `AF-603` activity, `AF-604` FP queue, `AF-605` export view).

**Business Rules (Handoff §threshold, rule 15/9/12; NG-13)**
1. **Two rooms:** the workspace is a tool (sidebar, cards, teal actions); the
   management view is a **document** (one 720 px column, Fraunces, hairlines, almost
   no colour, no sidebar). The threshold between them is one named, dated click
   (320 ms fade, no slide). 2. The management surface has **no person column** and no
   per-request attribution — structural, not hidden (NG-13, rule 9). 3. Estimates
   carry their formula: ranges with "≈", the rule stated beneath (rule 12).

```ts
// SF-5081  rooms/buildThresholdModel.ts
export function buildThresholdModel(weekMeta: WeekMeta): ThresholdModel
// 1. GIVEN a week THEN 'threshold.kicker'(kw) + 'threshold.headline' + 'threshold.body'(n people)
// 2. GIVEN the body THEN it says aggregation is structural, not hidden (rule 9 / 'threshold.body')
// 3. GIVEN entry THEN a single named action 'threshold.enter'; return is one word in the header

// SF-5082  rooms/buildManagementShell.ts
export function buildManagementShell(active: MgmtTab): MgmtShell
// 1. GIVEN the shell THEN nav = briefing/density/false-positives/log/evidence ('mgmt.nav.*')
// 2. GIVEN the shell THEN it is a 720 px document column (Fraunces, hairlines) — visually unmistakable from the workspace (FR-19)
// 3. GIVEN any tab THEN there is no person column anywhere (NG-13, asserted)

// SF-5083  rooms/buildBriefingView.ts
export function buildBriefingView(b: BriefingModel): BriefingView
// 1. GIVEN a duplicate-work row THEN observation/scope/artefact columns; estimate as a range with '≈' + the formula note ('briefing.estimate_note', rule 12)
// 2. GIVEN the view THEN it names pseudonymised clusters + areas, never a person or an original entity (C1, NG-13, NG-21)
// 3. GIVEN a narrowed rule THEN 'briefing.rule_narrowed_notice' (informational, no confirmation needed)
// deps: E6 AF-602 [BRIDGE]

// SF-5084  rooms/ThresholdGate.tsx / ManagementView.tsx   (components)
// Threshold 320 ms ease-in-out fade (platter→brief), no slide/scale (§2); ManagementView renders the tabs over E6 models.
```

**Chain order (E5 overall):** AF-506 (tokens) + AF-505 (i18n) underpin all; AF-501
composer → AF-502 mirror / AF-507 report on a finding → send → AF-503 reply
rehydration; AF-504 provider view spans the conversation; AF-508 is the separate
management room. **All behaviour-bearing data originates in the E3 core; E5 renders it.**

## Bridges E5 introduces
```
BRIDGE B6: E1 adapter ↔ E5 (render the InspectionVerdict / drive submitForInspection)
  Contract: InspectionVerdict, WireMessage[], DisplayPlaceholder[] (core/lib/types.ts)
  Risk:     E5 forwarding draftPrompt or a restored span instead of the wire (NG-1)
  Test:     the wire-isolation conformance suite (E5 is an InterceptionAdapter implementer)

BRIDGE B7: E5 AF-503 ↔ E3 AF-307 (client-side rehydration)
  Contract: RehydrateResult; the mapping is client-held, injected (NG-14)
  Risk:     a restored value re-entering the wire (NG-1); a guessed substitution (NG-9)
  Test:     restored-never-in-wire; never-guess (delegated to AF-307)

BRIDGE B8: E5 AF-507 ↔ E6 AF-604 (false-positive report)
  Contract: FalsePositiveReport → faId
  Risk:     context leaked without the 'share context' opt-in (Handoff 'report.privacy')
  Test:     off-by-default context sharing; only span+rule+area cross without opt-in
```
