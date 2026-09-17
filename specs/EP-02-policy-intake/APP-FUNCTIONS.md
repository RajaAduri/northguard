# EP-02 · App Functions & SW-Function Signatures

Language: TypeScript (core). Files under `core/src/features/policy/`. Each SW
Function = one file + one `.test.ts`. Sidecar calls are the only network I/O and
happen here, never in the inspection hot path.

---

## AF-201: ingestPolicyDocument
**Feature:** FT-2.1 | **Entry:** `core/src/features/policy/ingest/index.ts`

**I/O Contract**
- Input: `{ raw: string | Uint8Array, kind: 'text' | 'pdf' }`
- Output: `{ normalized: string, policyHash: string }`
- Side effects: none (pure; hashing only)

**Business Rules**
1. PDF text extraction that yields empty text is an error, never a silent empty policy.
2. `policyHash = sha256(normalized.trim())`, first 16 hex chars — matches sidecar `policy_key`.
3. Normalisation is deterministic (idempotent hash).

**Error Scenarios**
| Scenario | Behaviour |
|----------|-----------|
| PDF has no extractable text | throw `EmptyPolicyError` |
| Input exceeds size cap | throw `PolicyTooLargeError` |

**SW Functions**
| ID | Name | File | Responsibility |
|----|------|------|----------------|
| SF-2011 | acceptPolicyInput | `ingest/acceptPolicyInput.ts` | Validate + branch on kind |
| SF-2012 | extractPdfText | `ingest/extractPdfText.ts` | PDF → text |
| SF-2013 | normalizePolicyText | `ingest/normalizePolicyText.ts` | Whitespace/encoding normalise |
| SF-2014 | computePolicyHash | `ingest/computePolicyHash.ts` | sha256 first-16 hex |

```ts
// SF-2011  ingest/acceptPolicyInput.ts
export function acceptPolicyInput(raw: string | Uint8Array, kind: 'text'|'pdf'): { text: string }
// 1. GIVEN kind 'text' WHEN string given THEN returns it unchanged
// 2. GIVEN kind 'pdf' WHEN Uint8Array given THEN delegates to SF-2012
// 3. GIVEN input over size cap THEN throws PolicyTooLargeError
// deps: SF-2012

// SF-2012  ingest/extractPdfText.ts
export function extractPdfText(bytes: Uint8Array): string
// 1. GIVEN a text PDF THEN returns concatenated text
// 2. GIVEN an image-only PDF THEN throws EmptyPolicyError (no OCR in v1)
// 3. GIVEN corrupt bytes THEN throws EmptyPolicyError
// deps: pdf text lib (pinned)

// SF-2013  ingest/normalizePolicyText.ts
export function normalizePolicyText(text: string): string
// 1. GIVEN CRLF and mixed spaces THEN returns LF, collapsed runs
// 2. GIVEN same content twice THEN returns byte-identical output (idempotent)
// 3. GIVEN German umlauts THEN preserved (NFC)

// SF-2014  ingest/computePolicyHash.ts
export function computePolicyHash(normalized: string): string
// 1. GIVEN normalized text THEN returns 16-hex sha256 prefix
// 2. GIVEN whitespace-only diff THEN same hash as trimmed original
// 3. matches kg_sidecar.policy_key() for the same input
```

**Sequence:** SF-2011 → (SF-2012 if pdf) → SF-2013 → SF-2014.

---

## AF-202: extractProtectedConcepts
**Feature:** FT-2.2 | **Entry:** `core/src/features/policy/extract/index.ts`

**I/O Contract**
- Input: `{ normalized: string, policyHash: string, force?: boolean }`
- Output: `ExtractedGraph = { key, areas: Area[], stabilityIndex: number|null, stable: boolean|null, model: string, cached: boolean }`
- Side effects: HTTP to sidecar (localhost); reads/writes the policy-version cache record (metadata only, never per request — NG-6).

**Business Rules**
1. Extraction is keyed by `policyHash`; a known hash serves the cached graph (FR-03, NG-6).
2. The sidecar node/edge graph is mapped into user-facing `Area[]` (label + kind + provenance).
3. Never called from the inspection path.

**Error Scenarios**
| Scenario | Behaviour |
|----------|-----------|
| Sidecar unreachable | throw `SidecarUnavailableError` (intake fails loudly; nothing activates) |
| Sidecar returns error body | surface message; do not cache |

**SW Functions**
| ID | Name | File | Responsibility |
|----|------|------|----------------|
| SF-2021 | requestConceptGraph | `extract/requestConceptGraph.ts` | POST /graph |
| SF-2022 | mapGraphToAreas | `extract/mapGraphToAreas.ts` | nodes/edges → Area[] |
| SF-2023 | readCachedGraph | `extract/readCachedGraph.ts` | serve by hash if present |

```ts
// SF-2021  extract/requestConceptGraph.ts
export async function requestConceptGraph(policy: string, opts?: {force?: boolean}): Promise<SidecarGraph>
// 1. GIVEN reachable sidecar THEN returns {graph, stability_index, stable, model}
// 2. GIVEN connection refused THEN throws SidecarUnavailableError
// 3. GIVEN force=true THEN sends force flag (bypasses sidecar cache)
// deps: fetch → 127.0.0.1:8077/graph

// SF-2022  extract/mapGraphToAreas.ts
export function mapGraphToAreas(g: SidecarGraph): Area[]
// 1. GIVEN nodes with labels THEN one Area per top-level protected concept
// 2. GIVEN edges THEN provenance/relationships attached to areas
// 3. GIVEN empty graph THEN returns [] (caller treats as extraction failure)

// SF-2023  extract/readCachedGraph.ts
export function readCachedGraph(policyHash: string): ExtractedGraph | null
// 1. GIVEN a cached hash THEN returns the graph with cached=true
// 2. GIVEN an unknown hash THEN returns null
// 3. GIVEN a corrupt cache record THEN returns null (forces re-extract)
```

---

## AF-203: evaluateStability
**Feature:** FT-2.3 | **Entry:** `core/src/features/policy/stability/index.ts`

**I/O Contract**
- Input: `ExtractedGraph`
- Output: `StabilityReport = { index: number, threshold: number, stable: boolean, blockingReason?: string }`
- Side effects: none.

**Business Rules**
1. Threshold is 0.80 (NFR-07). Core re-enforces even if the sidecar said `stable`.
2. `index === null` (stability not run) is treated as **not stable**.

```ts
// SF-2031  stability/readStabilityIndex.ts
export function readStabilityIndex(g: ExtractedGraph): number | null
// 1. GIVEN a graph with SI THEN returns it
// 2. GIVEN SI null THEN returns null
// 3. GIVEN SI out of [0,1] THEN throws (sidecar contract violation)

// SF-2032  stability/enforceStabilityThreshold.ts
export function enforceStabilityThreshold(index: number|null, threshold = 0.80): boolean
// 1. GIVEN 0.83 THEN true
// 2. GIVEN 0.79 THEN false
// 3. GIVEN null THEN false (never treat unknown as stable)

// SF-2033  stability/buildStabilityReport.ts
export function buildStabilityReport(index: number|null): StabilityReport
// 1. GIVEN 0.9 THEN {stable:true}
// 2. GIVEN 0.5 THEN {stable:false, blockingReason:'below-threshold'}
// 3. GIVEN null THEN {stable:false, blockingReason:'not-measured'}
// deps: SF-2031, SF-2032
```

---

## AF-204: presentAreasForConfirmation
**Feature:** FT-2.4 | **Entry:** `core/src/features/policy/confirm/index.ts`

**I/O Contract**
- Input: `{ areas: Area[], edits?: AreaEdit[] }`
- Output: `ConfirmationModel = { areas: Area[], valid: boolean, issues: string[] }`
- Side effects: none (pure model; UI applies it).

**Business Rules**
1. Manual edits: rename, merge, split, remove. 2. Validation: non-empty set, unique labels.
3. Editing never activates (NG-3).

```ts
// SF-2041  confirm/buildAreaConfirmationModel.ts
export function buildAreaConfirmationModel(areas: Area[]): ConfirmationModel
// 1. GIVEN suggested areas THEN each is editable and unconfirmed
// 2. GIVEN provenance THEN shown per area ("from policy vom 12.08.")
// 3. GIVEN empty areas THEN valid=false, issue 'empty-area-set'

// SF-2042  confirm/applyManualEdits.ts
export function applyManualEdits(areas: Area[], edits: AreaEdit[]): Area[]
// 1. GIVEN a rename THEN label changes, id stable
// 2. GIVEN a merge of two THEN one area with combined provenance
// 3. GIVEN a split THEN two areas from one
// 4. GIVEN a remove THEN area dropped

// SF-2043  confirm/validateAreaSet.ts
export function validateAreaSet(areas: Area[]): { valid: boolean; issues: string[] }
// 1. GIVEN duplicate labels THEN issue 'duplicate-label'
// 2. GIVEN empty set THEN issue 'empty-area-set'
// 3. GIVEN a valid set THEN valid=true, issues=[]
```

---

## AF-205: assignAreaModes
**Feature:** FT-2.5 | **Entry:** `core/src/features/policy/modes/index.ts`

```ts
// SF-2051  modes/setAreaMode.ts
export function setAreaMode(areas: Area[], areaId: string, mode: AreaMode): Area[]
// 1. GIVEN an area THEN mode set to 'block' | 'redact'
// 2. GIVEN unknown areaId THEN throws
// 3. GIVEN no explicit mode set THEN default 'redact' (conservative-but-usable)

// SF-2052  modes/validateModeConfig.ts
export function validateModeConfig(areas: Area[]): { valid: boolean; issues: string[] }
// 1. GIVEN every area has a mode THEN valid
// 2. GIVEN a missing mode THEN issue 'unassigned-mode'
// 3. GIVEN all 'block' THEN valid (allowed, warns nothing)
```

---

## AF-206: activatePolicyVersion
**Feature:** FT-2.5 | **Entry:** `core/src/features/policy/activate/index.ts`
**BRIDGE:** writes a governance event to E4 (`AF-403`).

**I/O Contract**
- Input: `{ areas: Area[], stability: StabilityReport, actor: string }`
- Output: `ActivePolicy = { policyVersion: string, areas: Area[], activatedAt, activatedBy }`
- Side effects: publishes the active policy; writes governance event to ledger.

**Business Rules (the guard)**
1. Activation requires `stability.stable === true` AND a validated, confirmed area set (NG-3).
2. Activation writes a governance event (actor, timestamp, policyVersion, area modes) — NG-12.
3. Publishing the active policy is what unlocks inspection/forwarding.

```ts
// SF-2061  activate/guardActivation.ts
export function guardActivation(areas: Area[], stability: StabilityReport): void
// 1. GIVEN unstable THEN throws ActivationBlockedError('unstable')
// 2. GIVEN invalid area set THEN throws ActivationBlockedError('invalid-areas')
// 3. GIVEN unassigned modes THEN throws ActivationBlockedError('unassigned-mode')
// deps: SF-2043, SF-2052, AF-203

// SF-2062  activate/writeActivationGovernanceEvent.ts
export async function writeActivationGovernanceEvent(p: ActivePolicy, actor: string): Promise<string>
// 1. GIVEN activation THEN a governance entry id is returned
// 2. GIVEN the entry THEN it records policyVersion, area modes, actor, timestamp
// 3. entry written before ActivePolicy is published
// deps: E4 AF-403  [BRIDGE]

// SF-2063  activate/publishActivePolicy.ts
export function publishActivePolicy(p: ActivePolicy): void
// 1. GIVEN a guarded, logged activation THEN active policy is readable by inspection
// 2. GIVEN a superseding activation THEN the prior version is retired
// 3. GIVEN no active policy THEN inspection refuses to forward (fresh-install lock)
```

**Chain order:** guardActivation → writeActivationGovernanceEvent → publishActivePolicy.
