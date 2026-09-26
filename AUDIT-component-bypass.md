# Audit — the App.tsx bypass pattern across `web/`

**Date:** 2026-09-26 · **Scope:** `inputs/northGuard/web/src` · **Status:** report only, nothing fixed.

**The pattern:** a shell (chiefly `App.tsx`) reimplements logic or markup that a *tested*
component or view-model already provides, instead of rendering it. The symptom is a tested
component that is imported **only by its own test file** — green in isolation, never mounted —
while the running app hand-rolls a lesser version. This is the same failure that shipped the
unstyled composer in Sprint 6.

## Method
Traced the import graph of every component/view-model reachable from `main.tsx → App.tsx` and
compared it to what has tests. A component imported only from a `*.test.tsx` is orphaned.

**Orphaned (imported only by their own tests — never rendered by the app):**
`ReplyMessage`, `ViewToggle`, `ReportPanel` (+ `ThresholdGate`/`ManagementView`).

**Correctly wired (the counter-example of what "good" looks like):** `Composer`,
`AreaMenuButton`, `SubmissionMirror`, `BlockPanel` — all mounted by `App`/`Composer`, and they
consume their tested view-models (`deriveComposerView`, `buildMirrorModel`, `buildBlockModel`).

## Findings (ranked)

### F1 — High · the entire false-positive report flow is unreachable
`AF-507 / US-038` is fully built and tested — `ReportPanel` + `buildReportForm`,
`submitReport`, `buildReportDone`, `buildReporterNotice` — and `composerReducer` has the
`report` / `report-done` states. But **nothing renders `ReportPanel` and nothing dispatches
`report`**. The "Fehlalarm melden" links in `SubmissionMirror.tsx` and `BlockPanel.tsx` are
buttons with no `onClick`. A whole tested user story cannot be reached in the running app.
- Evidence: `report/ReportPanel.tsx` imported only by `report/ReportPanel.test.tsx`;
  `mirror/SubmissionMirror.tsx` report button (no handler); `mirror/BlockPanel.tsx` likewise.

### F2 — High · the management room has three parallel implementations; the tested view-models feed none
- **Tested & orphaned:** `ManagementView` + `ThresholdGate` (`rooms/ManagementView.tsx`) and the
  view-models `buildManagementShell`, `buildThresholdModel`, `buildBriefingView`
  (`SF-5081/5083/5084`).
- **The running app:** `App.tsx:226 ManagementRoom` reimplements the threshold inline and renders
  the briefing as **raw markdown in a `<pre>`** — the least faithful of the three; it consumes
  none of the view-models.
- **Sprint 9 (mine):** `BriefingDocument` / `ThresholdCard` (`rooms/`) are styled and used by the
  harness + screenshots, but they take **hand-made fixtures** and do **not** consume
  `buildBriefingView` / `buildThresholdModel`.
- Net: `buildBriefingView`, `buildThresholdModel`, `ManagementView`, `ThresholdGate` are rendered
  by nothing, and **the committed management screenshots show a component the app does not
  render.** (Disclosure: my Sprint 9 work reduced the visual gap but reproduced the pattern here
  — a fourth surface that skips the tested view-models rather than converging on them.)

### F3 — Medium · the provider-view toggle is reimplemented inline
`ViewToggle` (`SF-5043`) is tested, including the "hidden until the first sent message" rule and
the wire-only provider transcript. `App` reimplements all of it: the show-after-first-send guard
(`App.tsx:140`), the two toggle buttons (`App.tsx:~155`), and a local `ProviderView`
(`App.tsx:212`). `ViewToggle` is never rendered.

### F4 — Medium · footnote selection is reimplemented and diverges from the tested rule
`selectFootnote` (`SF-5042`) is the tested view-model: `provider → footnote.provider_view`,
else `restored ? footnote.restored : footnote.default`. `App.tsx:162` inlines only the
restored-vs-default half and **ignores the provider case** — when "Anbietersicht" is active the
composer footnote still shows restored/default instead of `footnote.provider_view`. The tested
rule and the app behaviour disagree.

### F5 — Medium · reply rendering is reimplemented; `ReplyMessage` + its view-models are dropped
`ReplyMessage` (`SF-5034`) with `buildReplyView` / `buildCopyModel` / `buildRestoreSuggestion`
is tested. `App`'s `TurnView` renders `turn.restored` in a plain `<div>` and drops: the reply
footer (restored count, `reply.open_placeholder`), the **partial** and **not-rendered** modes,
"Was der Anbieter sah", and copy-with-warning. Consequence: an unresolved placeholder from
partial rehydration (NG-9) is **not surfaced anywhere in the running app** — the exact
"a masked prompt still gets a useful, honest answer" moment the product is built around.

### F6 — Low · area-menu label logic is duplicated
`deriveComposerView` already returns `areaMenuLabelKey` (tested). `App.tsx:124` recomputes the
same label/count with its own `if/else`, and `harness/StatesHarness.tsx areaMenuFor` does it a
third time. One tested derivation, three copies.

### Not a bypass, but noted
`App.tsx:32 mappingFrom` (placeholder→original from spans) has no tested counterpart — untested
app logic worth extracting into a tested helper, not a reimplementation.

## Why the fidelity gates did not catch this
The Sprint 9 string/token gates run against the **harness**, which imports the components
directly. They prove the components are correct; they do not assert the **app mounts them**. An
orphaned tested component passes every existing gate.

## Recommended remediation (decide per finding — not applied here)
1. **Wire or delete, per finding.** Either render the real component (`ReplyMessage`,
   `ViewToggle`, `ReportPanel`, and one management implementation) or delete the orphan if it is
   deliberately out of scope — but do not leave a tested component that nothing renders.
2. **Converge the management room** on a single surface that consumes `buildBriefingView` /
   `buildThresholdModel` (fold the Sprint 9 styling into `ManagementView`/`ThresholdGate`, or
   have `BriefingDocument`/`ThresholdCard` take the view-models). Then point the app **and** the
   screenshots at that one surface.
3. **A CI orphan-detector:** fail if any `src/**/*.tsx` component is imported only by
   `*.test.*`. This is the structural check that would have caught both this and the original
   Sprint 6 bypass.
4. **An App-integration test** asserting the report flow opens, the view toggle appears after the
   first send, the reply footer renders, and the management document (not raw markdown) renders.
