# EP-06 · App Functions & SW-Function Signatures

Language: TypeScript. Files under `core/src/features/management/`. All read-models
read the ledger (E4 `AF-404`) with the `management` projection (no user id, NG-13).

---

## AF-601: computeExposureConcentration
**Feature:** FT-6.1 | **Entry:** `management/exposure/index.ts`

**I/O Contract**
- Input: `{ from: string, to: string }`
- Output: `AreaExposure[] = { area, mode, touches, trend, series }[]`
- Side effects: reads ledger (management projection).

**Business Rules**
1. Aggregated across the team; **no user dimension** (NG-13). 2. Trend classified
per area (rising/steady/falling) with a per-week series. 3. Ordered by concentration.

```ts
// SF-6011  exposure/aggregateTouchesByArea.ts
export function aggregateTouchesByArea(entries: LedgerEntry[]): Map<string, number[]>
// 1. GIVEN request entries THEN per-area weekly touch counts
// 2. GIVEN a clean request THEN counted as no touch
// 3. GIVEN any entry THEN no userId read (NG-13)

// SF-6012  exposure/computeAreaTrend.ts
export function computeAreaTrend(series: number[]): 'rising'|'steady'|'falling'
// 1. GIVEN increasing weeks THEN 'rising' ("steigend seit KW 34")
// 2. GIVEN flat THEN 'steady' ("gleichmäßig")
// 3. GIVEN decreasing THEN 'falling' ("fallend seit KW 35")

// SF-6013  exposure/orderByConcentration.ts
export function orderByConcentration(areas: AreaExposure[]): AreaExposure[]
// 1. GIVEN counts THEN sorted desc by touches
// 2. GIVEN a tie THEN stable order by area label
// 3. GIVEN block areas with FP reports THEN annotation preserved
```

---

## AF-602: composeWeeklyBriefing
**Feature:** FT-6.2 | **Entry:** `management/briefing/index.ts`
**BRIDGE:** consumes E7 `AF-706` findings + E4 stats. Prose is generated; inputs are deterministic (FR-13, regenerable).

```ts
// SF-6021  briefing/gatherBriefingInputs.ts
export async function gatherBriefingInputs(from:string, to:string): Promise<BriefingInputs>
// deps: E4 AF-404, E7 AF-706 [BRIDGE]
// 1. GIVEN a week THEN ledger stats + E7 recurring-work findings gathered
// 2. GIVEN too little traffic THEN inputs flagged 'insufficient' (quiet-week state)
// 3. GIVEN a window spanning a key rotation THEN coverage caveat attached (R5)

// SF-6022  briefing/synthesizeThemes.ts
export async function synthesizeThemes(inp: BriefingInputs): Promise<Theme[]>
// 1. GIVEN E7 clusters THEN 3–4 named recurring themes with a one-line signal
// 2. GIVEN a cluster of duplicated supplier-doc reads THEN theme names the artefact
// 3. GIVEN deterministic inputs THEN prose regenerable (same inputs → same themes structurally)

// SF-6023  briefing/synthesizeFriction.ts
export async function synthesizeFriction(inp: BriefingInputs): Promise<string>
// 1. GIVEN repeated near-verbatim asks THEN 2-sentence friction read
// 2. GIVEN a solved pattern (cessation) THEN noted ("seit Mittwoch keine Anfrage — vermutlich gelöst")
// 3. GIVEN thin data THEN returns the insufficient-traffic message

// SF-6024  briefing/assessPolicyFit.ts
export function assessPolicyFit(inp: BriefingInputs): PolicyFitNote
// 1. GIVEN an over-blocking rule (FP cluster) THEN policy-fit flags it + current false-block rate
// 2. GIVEN a well-matched policy THEN "weitgehend ja"
// 3. GIVEN a pending narrowing THEN references it ("wartet auf Ihre Kenntnisnahme")

// SF-6025  briefing/buildBriefingFootnote.ts
export function buildBriefingFootnote(inp: BriefingInputs): FootnoteStats
// 1. GIVEN a week THEN {requests, redactedForwarded, blocked, rulesOnlyDuration}
// 2. GIVEN the design THEN numbers are footnote, not headline
// 3. GIVEN zero blocked THEN shows 0 (never hidden)

// SF-6026  briefing/renderBriefingMarkdown.ts
export function renderBriefingMarkdown(themes:Theme[], friction:string, fit:PolicyFitNote, foot:FootnoteStats): string
// 1. GIVEN parts THEN a short letter (KW, people, requests header)
// 2. GIVEN a PDF request THEN same content exports (FR-13)
// 3. GIVEN quiet week THEN the "Betriebsruhe" variant
```

---

## AF-603: buildActivityLog
**Feature:** FT-6.3 | **Entry:** `management/activity/index.ts`

```ts
// SF-6031  activity/aggregateActivityRows.ts
export function aggregateActivityRows(entries: LedgerEntry[]): ActivityRow[]
// 1. GIVEN entries THEN rows by date + area + verdict, counts aggregated
// 2. GIVEN a sample/seed flag THEN preserved for the demo
// 3. GIVEN no entries THEN empty

// SF-6032  activity/applyAggregationGuard.ts
export function applyAggregationGuard(rows: ActivityRow[]): ActivityRow[]
// 1. GIVEN rows THEN asserts no userId field present (NG-13)
// 2. GIVEN a violating row THEN throws AggregationLeakError
// 3. GIVEN clean rows THEN returned unchanged
```

---

## AF-604: manageFalsePositiveQueue
**Feature:** FT-6.4 | **Entry:** `management/fp-queue/index.ts`
**BRIDGE:** resolutions write governance events (E4 `AF-403`) and notify the reporter (feeds E5 quiet-line).

**Business Rules**
1. Reports grouped by trigger (rule/area), sorted by repeat frequency. 2. Resolution
actions: narrow rule / exclude term / change area mode / dismiss-with-reason. 3. Every
resolution is a governance event (NG-12) and notifies the reporter. 4. Rule-narrowing
shows a 30-day impact preview before applying.

```ts
// SF-6041  fp-queue/groupReportsByTrigger.ts
export function groupReportsByTrigger(reports: FpReport[]): TriggerGroup[]
// 1. GIVEN reports THEN grouped by (rule|llm, area)
// 2. GIVEN the % rule reported 11× THEN one group, count 11, distinct reporters counted
// 3. GIVEN singletons THEN their own groups

// SF-6042  fp-queue/sortByRepeatFrequency.ts
export function sortByRepeatFrequency(groups: TriggerGroup[]): TriggerGroup[]
// 1. GIVEN groups THEN sorted desc by count ("Wiederholungstäter oben")
// 2. GIVEN ties THEN by most-recent report
// 3. GIVEN a resolved group THEN sorted below open ones

// SF-6043  fp-queue/previewRuleNarrowing.ts
export function previewRuleNarrowing(rule: RuleId, narrowing: Narrowing, window: LedgerEntry[]): NarrowPreview
// 1. GIVEN "% only with a price term" THEN "41 → 12 Treffer / 30 T., 4 of 11 reports gone"
// 2. GIVEN a narrowing THEN residual risk stated ("% without price term no longer blocked")
// 3. GIVEN no matches THEN preview shows 0 impact

// SF-6044  fp-queue/applyResolution.ts
export async function applyResolution(action: FpResolution, actor: string): Promise<string>
// deps: E4 AF-403 [BRIDGE]
// 1. GIVEN a narrow THEN rule config updated + governance event written (before/after + preview)
// 2. GIVEN a dismiss THEN reason mandatory, event written, reporter notified
// 3. GIVEN a mode-change THEN area mode updated as a governance event

// SF-6045  fp-queue/notifyReporter.ts
export function notifyReporter(report: FpReport, outcome: FpOutcome): ReporterNotice
// 1. GIVEN an implemented report THEN "your report FA-118 was implemented" quiet line
// 2. GIVEN a dismissal THEN the reason is returned to the reporter ("a no comes back")
// 3. GIVEN a notice THEN it targets the originating conversation, not a notification centre
```

---

## AF-605: requestEvidenceExport
**Feature:** FT-6.5 | **Entry:** `management/export-view/index.ts`
**BRIDGE:** delegates E4 `AF-405`.

```ts
// SF-6051  export-view/validateExportRequest.ts
export function validateExportRequest(req: ExportRequest): { valid: boolean; issues: string[] }
// 1. GIVEN a range + reason THEN valid
// 2. GIVEN a missing reason (Anlass) THEN invalid (an export must state its purpose)
// 3. GIVEN an inverted range THEN invalid

// SF-6052  export-view/invokeExport.ts
export async function invokeExport(req: ExportRequest, actor: string): Promise<ExportBundle>
// deps: E4 AF-405 [BRIDGE]
// 1. GIVEN a valid request THEN a bundle (CSV+JSONL+checksum) is produced
// 2. GIVEN the export THEN a governance event is logged with the Anlass
// 3. GIVEN the bundle THEN it contains user ids (audit) though the view does not (NG-13)
```

---

## AF-606: buildContextChrome
**Feature:** FT-6.6 | **Entry:** `management/context/index.ts`

```ts
// SF-6061  context/resolveViewContext.ts
export function resolveViewContext(view: 'workspace'|'management'): ViewContextModel
// 1. GIVEN 'management' THEN document context (one column, hairlines, Fraunces)
// 2. GIVEN 'workspace' THEN tool context (dense, cards, teal)
// 3. GIVEN either THEN unmistakable at a glance (FR-19)

// SF-6062  context/buildThresholdModel.ts
export function buildThresholdModel(week: string, people: number): ThresholdModel
// 1. GIVEN entry into management THEN named, dated "Schwelle" ("Sie verlassen Ihre Arbeitsfläche")
// 2. GIVEN the threshold THEN states structural aggregation ("keine Namen ... strukturell so gebaut")
// 3. GIVEN return THEN the way back is a word in the header, not a tab
```
