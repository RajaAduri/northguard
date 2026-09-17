# EP-03 · App Functions & SW-Function Signatures

Language: TypeScript. Files under `core/src/features/inspection/`. Shared types
from `core/lib/types.ts` (E1 contract). The transcript-engine AFs (304–307) are
**pure**: no fs, no db, no network imports (enforced by lint rule + NG-14 test).

> **Build order (§8 A4, R12).** The model is the detector; rules are a latency/
> determinism strategy. Build **lexicons (SF-3011/3013) + backstop-model integration
> (AF-302) before regex breadth (SF-3012).** SF-3012 covers *validated* German
> identifiers (IBAN MOD-97, Steuernummer per-Bundesland, Handelsregisternummer) and a
> small high-precision family — not an ever-widening pattern zoo that would spend the
> sprint chasing a small fraction of recall.

---

## AF-301: runRulesLayer
**Feature:** FT-3.1 | **Entry:** `inspection/rules/index.ts`

**I/O Contract**
- Input: `{ prompt: string, policy: ActivePolicy, locale: Locale }`
- Output: `RuleHit[] = { area, ruleId, offset, length, value }[]`
- Side effects: **none. No network (NG-7).**

**Business Rules**
1. Runs first, always. 2. Deterministic; lexicon + regex only. 3. DE+EN both loaded (NG-16).
4. Maps every hit to a protected area of the active policy.

**Error Scenarios**
| Scenario | Behaviour |
|----------|-----------|
| Lexicon file missing | throw at startup, not per request (fail fast) |
| Catastrophic regex input | bounded via linear-time patterns; no backtracking bombs |

**SW Functions**
| ID | Name | File | Responsibility |
|----|------|------|----------------|
| SF-3011 | loadLexicons | `rules/loadLexicons.ts` | Load + validate DE/EN YAML once |
| SF-3012 | matchRulePatterns | `rules/matchRulePatterns.ts` | Regex families (email, contract, %, repo) |
| SF-3013 | matchLexiconTerms | `rules/matchLexiconTerms.ts` | Lexicon term/longest-match |
| SF-3014 | mapHitsToAreas | `rules/mapHitsToAreas.ts` | Hits → active-policy areas |

```ts
// SF-3011  rules/loadLexicons.ts
export function loadLexicons(dir: string): Lexicons   // called once at boot
// 1. GIVEN valid DE+EN yml THEN returns merged, indexed lexicons
// 2. GIVEN a missing language file THEN throws LexiconLoadError at boot
// 3. GIVEN duplicate entry ids THEN throws (versioned, stable ids required)

// SF-3012  rules/matchRulePatterns.ts   (validated German identifiers + high-precision families; §8 A4)
export function matchRulePatterns(text: string): RawHit[]
// 1. GIVEN "anna.berger@nordwerk.de" THEN email rule hit
// 2. GIVEN "CN-48213" THEN contract-number rule hit
// 3. GIVEN "Zielmarge von 34 %" THEN percentage-in-price-context hit
// 4. GIVEN "shiftnorth-core" THEN internal-repository-name hit
// 5. GIVEN a 100k-char adversarial string THEN completes < 50 ms (linear patterns)
// 6. GIVEN "DE89 3704 0044 0532 0130 00" THEN IBAN hit ONLY if the MOD-97 checksum is valid; an invalid check digit does not hit (validation, not just shape)
// 7. GIVEN a Steuernummer in a Bundesland-specific format THEN hit (format table per Bundesland, not one regex)
// 8. GIVEN "HRB 12345" / "HRA 12345" THEN Handelsregisternummer hit in the standard form
// NOTE (A4): rules are precision-first; contextual recall is the model's job (AF-302), so this stays a bounded, validated set — not an open-ended pattern zoo.

// SF-3013  rules/matchLexiconTerms.ts
export function matchLexiconTerms(text: string, lex: Lexicons, locale: Locale): RawHit[]
// 1. GIVEN a DE compound in the lexicon THEN longest-match wins
// 2. GIVEN the EN synonym THEN also matches (bilingual)
// 3. GIVEN overlapping terms THEN longest match kept, residual retained
// deps: SF-3011

// SF-3014  rules/mapHitsToAreas.ts
export function mapHitsToAreas(hits: RawHit[], policy: ActivePolicy): RuleHit[]
// 1. GIVEN a % hit AND area 'Preise & Margen' active THEN mapped to it
// 2. GIVEN a hit whose area is not in the active policy THEN dropped
// 3. GIVEN two hits same area THEN both retained (span-level, NG-8)
```

**Sequence:** loadLexicons(boot) → matchRulePatterns ∥ matchLexiconTerms → mapHitsToAreas. **CHAIN LOGIC: parallel-then-converge.**

---

## AF-302: runBackstop
**Feature:** FT-3.2 | **Entry:** `inspection/backstop/index.ts`

**I/O Contract**
- Input: `{ prompt: string, ruleHits: RuleHit[], policy: ActivePolicy }`
- Output: `BackstopResult = { findings: LlmFinding[], coverage: Coverage }`
- Side effects: one LLM call (local/backstop host) **only when rules inconclusive**.

**Business Rules**
1. "Inconclusive" = rules found nothing but the prompt is non-trivial, OR rules
   partially matched an area needing semantic confirmation. 2. Backstop unreachable
   → return `coverage:'rules-only'`, empty findings; caller records it (NG-4).
3. Findings carry `layer:'llm'`.

```ts
// SF-3021  backstop/backstopAvailabilityGuard.ts
export async function backstopAvailabilityGuard(): Promise<boolean>
// 1. GIVEN backstop healthy THEN true
// 2. GIVEN backstop down THEN false (no throw — degrade path)
// 3. GIVEN timeout THEN false within a bounded wait

// SF-3022  backstop/shouldInvokeBackstop.ts
export function shouldInvokeBackstop(prompt: string, ruleHits: RuleHit[]): boolean
// 1. GIVEN conclusive rule hits in block area THEN false (already decided)
// 2. GIVEN no hits but substantive prompt THEN true
// 3. GIVEN trivial clean prompt THEN false (latency budget)

// SF-3023  backstop/buildBackstopPrompt.ts
export function buildBackstopPrompt(prompt: string, policy: ActivePolicy): BackstopMessages
// 1. GIVEN active areas THEN system prompt lists them (like demo inspect())
// 2. GIVEN the prompt THEN wrapped as user content
// 3. asks for touched areas + spans + one-sentence reason, JSON only

// SF-3024  backstop/callBackstopModel.ts
export async function callBackstopModel(m: BackstopMessages): Promise<string>
// 1. GIVEN reachable model THEN returns raw completion
// 2. GIVEN failure THEN throws BackstopUnavailableError (caught by guard path)
// 3. deterministic decoding (temperature 0) for repeatability

// SF-3025  backstop/parseBackstopFindings.ts
export function parseBackstopFindings(raw: string): LlmFinding[]
// 1. GIVEN fenced/plain JSON THEN parsed (strip fences)
// 2. GIVEN malformed JSON THEN throws → treated as inconclusive, coverage flagged
// 3. GIVEN findings THEN each carries layer:'llm'
```

**CHAIN LOGIC: branching** — `backstopAvailabilityGuard` and `shouldInvokeBackstop` gate the call; failure branches to rules-only.

---

## AF-303: assembleVerdict  *(inspection entry point called by the E1 adapter)*
**Feature:** FT-3.3 | **Entry:** `inspection/verdict/index.ts`
**BRIDGE:** writes the ledger entry (E4 `AF-402`) **before returning** (NG-5).

**I/O Contract**
- Input: `InspectionRequest` (from adapter) + `ActivePolicy`
- Output: `InspectionVerdict` (types.ts)
- Side effects: composes AF-301/302/304/305/306; writes E4 request entry.

**Business Rules**
1. Orchestration order: rules → (maybe) backstop → merge → mode decision → placeholders → pseudonyms → wire → **ledger write** → return.
2. Any area touched in a `block`-mode area ⇒ `verdict:'block'`, no redacted variant.
3. Only `redact`-area touches ⇒ `verdict:'redact'`. No touches ⇒ `clean`.
4. `coverage` propagates from AF-302. `caughtBy` derived from layers present.

```ts
// SF-3031  verdict/resolveTouchedAreas.ts
export function resolveTouchedAreas(rule: RuleHit[], llm: LlmFinding[]): AreaAttribution[]
// 1. GIVEN rule+llm hits same area THEN one attribution, layers:['rule','llm']
// 2. GIVEN only rule hits THEN layers:['rule']
// 3. GIVEN none THEN []

// SF-3032  verdict/computeSpans.ts
export function computeSpans(rule: RuleHit[], llm: LlmFinding[]): RedactionSpan[]
// 1. GIVEN overlapping rule+llm spans THEN merged, layer reflects both
// 2. GIVEN each span THEN carries {area, layer, ruleId?} (NG-8)
// 3. GIVEN adjacent distinct entities THEN kept separate (for indexing)

// SF-3033  verdict/decideVerdictMode.ts
export function decideVerdictMode(areas: AreaAttribution[], policy: ActivePolicy): Verdict
// 1. GIVEN a touch in a block area THEN 'block'
// 2. GIVEN touches only in redact areas THEN 'redact'
// 3. GIVEN no touches THEN 'clean'

// SF-3034  verdict/computeConfidence.ts
export function computeConfidence(rule: RuleHit[], llm: LlmFinding[]): number
// 1. GIVEN a deterministic rule hit THEN high confidence
// 2. GIVEN llm-only THEN model-reported confidence
// 3. GIVEN none THEN 1.0 (confident clean) — note clean != "safe" in UI copy

// SF-3035  verdict/assembleVerdict.ts   (composition + ledger bridge)
export async function assembleVerdict(req: InspectionRequest, policy: ActivePolicy): Promise<InspectionVerdict>
// 1. GIVEN a clean prompt THEN verdict 'clean', ledger entry written, entryId set
// 2. GIVEN a block-area touch THEN verdict 'block', no redactedPrompt content beyond placeholders, ledger written
// 3. GIVEN backstop down THEN coverage 'rules-only' in verdict AND ledger (NG-4)
// 4. GIVEN return value THEN ledgerEntryId is non-empty (written BEFORE return, NG-5)
// deps: AF-301, AF-302, SF-3031..34, AF-304, AF-305, AF-306, E4 AF-402 [BRIDGE]
```

**Chain order:** resolveTouchedAreas → computeSpans → decideVerdictMode → computeConfidence → (AF-304 placeholders, AF-305 pseudonyms) → AF-306 wire → E4 write → return.

---

## AF-304: generatePlaceholders  *(pure)*
**Feature:** FT-3.4 | **Entry:** `inspection/transcript/placeholders/index.ts`

**I/O Contract**
- Input: `{ prompt: string, spans: RedactionSpan[] }`
- Output: `{ wireText: string, displayPlaceholders: DisplayPlaceholder[] }`
- Side effects: **none**.

**Business Rules**
1. Semantic, area-derived labels; never opaque tokens (NG-11). 2. Same entity →
same placeholder; distinct same-type entities → indexed `⟨Lieferant 1|2⟩` (FR-08f).
3. `wireText` is `prompt` with spans replaced by placeholders.

```ts
// SF-3041  placeholders/classifyEntityType.ts
export function classifyEntityType(span: RedactionSpan): string
// 1. GIVEN area 'Lieferanten & Konditionen' THEN type 'Lieferant'
// 2. GIVEN a contract-number rule THEN type 'Vertragsnummer'
// 3. GIVEN unknown THEN falls back to area label (never [REDACTED])

// SF-3042  placeholders/assignSemanticPlaceholder.ts
export function assignSemanticPlaceholder(type: string, index: number): string
// 1. GIVEN type 'Lieferant', index 0 THEN '⟨Lieferant⟩'
// 2. GIVEN a colliding second THEN '⟨Lieferant 2⟩' (index applied, FR-08f)
// 3. GIVEN forbidden opaque request THEN throws (NG-11 guard)

// SF-3043  placeholders/indexCollidingEntities.ts
export function indexCollidingEntities(spans: RedactionSpan[]): Map<string, number>
// 1. GIVEN two distinct suppliers THEN indices 1 and 2 by first appearance
// 2. GIVEN the same supplier twice THEN one index (dedupe by pseudonym)
// 3. GIVEN mixed types THEN indexed within type only

// SF-3044  placeholders/buildWireText.ts
export function buildWireText(prompt: string, spans: RedactionSpan[], ph: Map<number,string>): { wireText: string; displayPlaceholders: DisplayPlaceholder[] }
// 1. GIVEN spans THEN replaced right-to-left (offsets preserved)
// 2. GIVEN output THEN contains no original span text
// 3. GIVEN displayPlaceholders THEN each has {placeholder, area, layer, index} and NO original value (NG-14)
```

---

## AF-305: derivePseudonyms  *(pure; key injected)*
**Feature:** FT-3.5 | **Entry:** `inspection/transcript/pseudonym/index.ts`

**I/O Contract**
- Input: `{ prompt: string, spans: RedactionSpan[], key: KeyMaterial }`  (key passed in — module owns nothing, NG-14)
- Output: `RedactionSpan[]` with `pseudonym` + `keyEpoch` populated
- Side effects: **none**.

**Business Rules**
1. `pseudonym = HMAC(key, normalize(value))` (NG-10). 2. Normalisation folds
inflection/case so the same entity resolves across conversations. 3. Output carries
`keyEpoch`; original value never appears in output. 4. **Normalisation is where E7
succeeds or fails (NG-18).** German makes it hard, and the failure is silent —
under-clustering looks identical to "no duplicated work this week". `normalizeEntityValue`
MUST be validated against the maintained corpus `lexicons/de-entity-variants.yml`
as part of E7 acceptance (FR-24), not treated as an implementation detail.

**German normalisation rules (explicit — SF-3051):**
- **Legal-form stripping:** remove trailing legal forms so casual reference matches
  formal — `GmbH`, `AG`, `KG`, `mbH`, `e.K.`, `GbR`, `OHG`, `SE`, and the compound
  `GmbH & Co. KG` / `GmbH & Co KG`. "Brechtmann GmbH & Co. KG" → "brechtmann".
- **Umlaut/transliteration folding:** `ä↔ae`, `ö↔oe`, `ü↔ue`, `ß↔ss` — "Müller" and
  "Mueller" fold to one form.
- **Case + whitespace + punctuation:** lowercase, collapse whitespace, trim.
- **Balance:** too aggressive conflates distinct entities; too loose never fires the
  headline finding. Legal-form stripping + umlaut folding + case is the calibrated
  default; extend only against corpus evidence.

```ts
// SF-3051  pseudonym/normalizeEntityValue.ts
export function normalizeEntityValue(value: string, type: string): string
// 1. GIVEN "Brechtmann GmbH", "Brechtmann", "Brechtmann GmbH & Co. KG", "brechtmann gmbh" THEN one normalized form (legal-form + case fold)
// 2. GIVEN "Müller" and "Mueller" THEN same normalized form (umlaut/transliteration)
// 3. GIVEN "Brechtmann GmbHs" (declension) THEN same form as "Brechtmann GmbH"
// 4. GIVEN two genuinely distinct suppliers THEN distinct normalized forms (no over-collapse)
// 5. GIVEN an email THEN normalized to lowercased address
// 6. CORPUS: every group in lexicons/de-entity-variants.yml collapses to one form; no cross-group collision (FR-24, NG-18)

// SF-3052  pseudonym/computePseudonymHmac.ts
export function computePseudonymHmac(normalized: string, key: KeyMaterial): { pseudonym: string; keyEpoch: number }
// 1. GIVEN same input+key THEN same pseudonym (stable)
// 2. GIVEN different key epoch THEN different pseudonym, keyEpoch reflects it
// 3. GIVEN output THEN never contains the original value
// deps: KeyProvider (interface; stub in dev)

// SF-3053  pseudonym/attachPseudonymToSpan.ts
export function attachPseudonymToSpan(spans: RedactionSpan[], prompt: string, key: KeyMaterial): RedactionSpan[]
// 1. GIVEN spans THEN each gets pseudonym + keyEpoch
// 2. GIVEN two spans same entity THEN identical pseudonym
// 3. GIVEN a block-area span THEN still pseudonymised (ledger needs the token)
// deps: SF-3051, SF-3052
```

---

## AF-306: buildWireTranscript  *(pure — the NG-1 guarantee)*
**Feature:** FT-3.6 | **Entry:** `inspection/transcript/wire/index.ts`

**I/O Contract**
- Input: `{ history: WireMessage[], wireText: string }`
- Output: `WireMessage[]` (history + this turn's wire message)
- Side effects: **none**.

**Business Rules**
1. Output is the ONLY thing the adapter transmits (NG-1). 2. `assertNoOriginalInWire`
is a hard invariant check used in tests and (cheaply) at runtime.

```ts
// SF-3061  wire/composeWireMessage.ts
export function composeWireMessage(history: WireMessage[], wireText: string): WireMessage[]
// 1. GIVEN prior wire history THEN appends {role:'user', content: wireText}
// 2. GIVEN history THEN prior turns are already redacted (never re-hydrated)
// 3. GIVEN output THEN is a fresh array (no mutation of history)

// SF-3062  wire/assertWireIsolation.ts
export function assertWireIsolation(wire: WireMessage[], originals: string[]): void
// 1. GIVEN a wire transcript containing an original value THEN throws WireLeakError
// 2. GIVEN a clean wire transcript THEN returns void
// 3. GIVEN 10 turns with redactions THEN no original present (the §8 acceptance test)
```

---

## AF-307: rehydrateReply  *(pure, client-side; mapping injected — NG-9, NG-14)*
**Feature:** FT-3.7 | **Entry:** `inspection/transcript/rehydrate/index.ts`

**I/O Contract**
- Input: `{ providerText: string, mapping: PlaceholderMapping, locale: Locale }`  (mapping is client-held, passed in)
- Output: `{ restoredText: string, restoredSpans: RestoredSpan[], unresolved: string[] }`
- Side effects: **none. Does not own or persist the mapping (NG-14).**

**Business Rules**
1. Substitute placeholders → originals from the injected mapping. 2. Tolerate German
declension on placeholder tokens. 3. **Never guess**: a placeholder that can't be
matched with confidence stays visible and is reported in `unresolved` (NG-9).
4. Restored spans are marked so the engineer distinguishes restored from wire (FR-08h).

```ts
// SF-3071  rehydrate/buildRehydrationIndex.ts
export function buildRehydrationIndex(mapping: PlaceholderMapping): RehydrationIndex
// 1. GIVEN a mapping THEN an index keyed by placeholder + declension variants
// 2. GIVEN indexed placeholders THEN '⟨Lieferant 1⟩' resolves distinctly from '⟨Lieferant 2⟩'
// 3. GIVEN empty mapping THEN empty index (all placeholders become unresolved)

// SF-3072  rehydrate/matchPlaceholderTokens.ts
export function matchPlaceholderTokens(text: string, idx: RehydrationIndex, locale: Locale): MatchResult
// 1. GIVEN exact '⟨Lieferant⟩' THEN matched
// 2. GIVEN inflected 'Lieferants' with a confident stem match THEN matched (declension)
// 3. GIVEN an ambiguous/paraphrased placeholder THEN NOT matched → unresolved (NG-9)

// SF-3073  rehydrate/markRestoredSpans.ts
export function markRestoredSpans(text: string, matches: MatchResult): { restoredText: string; restoredSpans: RestoredSpan[] }
// 1. GIVEN matches THEN originals substituted and each span flagged restored (FR-08h)
// 2. GIVEN a balance THEN "N values inserted locally" is derivable from restoredSpans
// 3. GIVEN output THEN restored content is display-only (never re-enters wire — NG-1)

// SF-3074  rehydrate/collectUnresolved.ts
export function collectUnresolved(text: string, matches: MatchResult): string[]
// 1. GIVEN an unmatched placeholder THEN listed in unresolved
// 2. GIVEN all matched THEN []
// 3. GIVEN unresolved THEN placeholder remains visible in restoredText (no silent drop)
```

**Chain order:** buildRehydrationIndex → matchPlaceholderTokens → markRestoredSpans ∥ collectUnresolved.
