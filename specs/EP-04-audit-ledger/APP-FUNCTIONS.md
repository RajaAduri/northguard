# EP-04 · App Functions & SW-Function Signatures

Language: TypeScript. Files under `core/src/features/ledger/`. The ledger is a
JSONL file on customer infra; each line is one entry carrying `prevHash`.

**Entry shape (types.ts):**
```ts
export interface LedgerEntry {
  id: string
  ts: string                        // ISO
  kind: 'request' | 'governance' | 'ops'
  prevHash: string
  hash: string                      // sha256 over canonical(entry-without-hash)
  // request entries:
  user?: string
  promptHash?: string
  touchedAreas?: string[]
  verdict?: Verdict
  mode?: AreaMode | null
  caughtBy?: string | null
  provider?: string
  latencyMs?: number
  coverage?: Coverage
  spanPseudonyms?: { area: string; layer: Layer; pseudonym: string; keyEpoch: number }[]  // NG-10
  // governance entries:
  govKind?: 'activation'|'rule-narrow'|'term-exclude'|'mode-change'|'dismiss'|'export'|'key-rotate'
  actor?: string
  reason?: string
  payload?: unknown
  // NEVER: raw prompt/response text (unless full-text opt-in, never default)
}
```

---

## AF-401: appendLedgerEntry
**Feature:** FT-4.1 | **Entry:** `ledger/append/index.ts`

**I/O Contract**
- Input: `Omit<LedgerEntry,'prevHash'|'hash'|'id'>`
- Output: `{ id: string; hash: string }`
- Side effects: atomic append to the JSONL file (fsync); restart-safe.

**Business Rules**
1. `prevHash` = hash of the current chain tail. 2. `hash` = sha256 over the
canonical entry sans `hash`. 3. Append is atomic and durable (NFR-06, NG-5).

```ts
// SF-4011  append/loadChainTail.ts
export function loadChainTail(path: string): { lastHash: string; count: number }
// 1. GIVEN an existing ledger THEN returns last entry hash + count
// 2. GIVEN no ledger THEN returns genesis hash + 0
// 3. GIVEN a truncated last line (crash mid-write) THEN ignores it, returns prior tail

// SF-4012  append/computeEntryHash.ts
export function computeEntryHash(entry: object, prevHash: string): string
// 1. GIVEN entry+prevHash THEN deterministic sha256 over canonical JSON
// 2. GIVEN reordered keys THEN same hash (canonicalised)
// 3. GIVEN any field change THEN different hash

// SF-4013  append/appendAtomic.ts
export async function appendAtomic(path: string, line: string): Promise<void>
// 1. GIVEN a line THEN appended + fsync'd before resolve
// 2. GIVEN a crash after fsync THEN entry present on restart (no gap)
// 3. GIVEN concurrent appends THEN serialised (single-writer lock)

// SF-4014  append/appendLedgerEntry.ts
export async function appendLedgerEntry(e: Partial<LedgerEntry>): Promise<{id:string;hash:string}>
// 1. GIVEN an entry THEN prevHash chained, id + hash returned
// 2. GIVEN two entries THEN second.prevHash === first.hash
// 3. GIVEN write failure THEN throws (caller must not proceed to reply — NG-5)
// deps: SF-4011, SF-4012, SF-4013
```

---

## AF-402: writeRequestEntry
**Feature:** FT-4.2 | **Entry:** `ledger/request/index.ts`
**BRIDGE:** called by E3 `AF-303` before the verdict returns (NG-5).

**Business Rules**
1. Exactly one entry per request (FR-02). 2. Contains metadata + span pseudonyms,
never original text (NG-2, NG-10). 3. Written even on provider failure (FR-14) and
in degraded mode (coverage recorded, NG-4).

```ts
// SF-4021  request/buildRequestEntry.ts
export function buildRequestEntry(v: InspectionVerdict, meta: RequestMeta): Partial<LedgerEntry>
// 1. GIVEN a verdict THEN entry has verdict, mode, caughtBy, coverage, touchedAreas
// 2. GIVEN spans THEN spanPseudonyms attached (pseudonym+keyEpoch), no originals
// 3. GIVEN meta THEN user, promptHash, provider, latencyMs set

// SF-4022  request/redactBeforeWrite.ts
export function redactBeforeWrite(entry: Partial<LedgerEntry>): Partial<LedgerEntry>
// 1. GIVEN an entry THEN asserts no raw prompt/response text present (default mode)
// 2. GIVEN full-text opt-in disabled THEN throws if text field populated (NG-10 guard)
// 3. GIVEN pseudonyms only THEN passes

// SF-4023  request/writeRequestEntry.ts
export async function writeRequestEntry(v: InspectionVerdict, meta: RequestMeta): Promise<string>
// 1. GIVEN a clean verdict THEN one entry written, id returned
// 2. GIVEN a provider failure meta THEN entry still written with error marker (FR-14)
// 3. GIVEN rules-only coverage THEN recorded on the entry (NG-4)
// deps: SF-4021, SF-4022, AF-401
```

---

## AF-403: writeGovernanceEvent
**Feature:** FT-4.3 | **Entry:** `ledger/governance/index.ts`
**Consumers:** E2 `AF-206` (activation), E6 `AF-604` (tuning/dismissals), `AF-405` (export), E8 key rotation.

```ts
// SF-4031  governance/buildGovernanceEntry.ts
export function buildGovernanceEntry(kind: GovKind, actor: string, reason: string, payload: unknown): Partial<LedgerEntry>
// 1. GIVEN a rule-narrow THEN entry records before/after + 30-day impact in payload
// 2. GIVEN a dismissal THEN reason is mandatory (throws if empty)
// 3. GIVEN a key-rotate THEN records old/new epoch (no key material)

// SF-4032  governance/writeGovernanceEvent.ts
export async function writeGovernanceEvent(kind: GovKind, actor: string, reason: string, payload: unknown): Promise<string>
// 1. GIVEN a tuning action THEN appended as a governance entry, id returned
// 2. GIVEN missing actor THEN throws (accountability, NG-12)
// 3. GIVEN the entry THEN it sits in the same chain as request entries
// deps: SF-4031, AF-401
```

---

## AF-404: queryLedger
**Feature:** FT-4.4 | **Entry:** `ledger/query/index.ts`

```ts
// SF-4041  query/parseLedgerStream.ts
export async function* parseLedgerStream(path: string): AsyncIterable<LedgerEntry>
// 1. GIVEN a large ledger THEN streams entries (no full load)
// 2. GIVEN a malformed line THEN throws ChainError (never skips silently)
// 3. GIVEN empty ledger THEN yields nothing

// SF-4042  query/filterByDateArea.ts
export function filterByDateArea(entries: AsyncIterable<LedgerEntry>, f: {from?:string;to?:string;area?:string}): Promise<LedgerEntry[]>
// 1. GIVEN a date range THEN only entries within are returned
// 2. GIVEN an area THEN only entries touching it
// 3. GIVEN no filter THEN all entries

// SF-4043  query/projectSafeFields.ts
export function projectSafeFields(entries: LedgerEntry[], ctx: 'management'|'export'): LedgerEntry[]
// 1. GIVEN ctx 'management' THEN user id stripped (NG-13)
// 2. GIVEN ctx 'export' THEN user id retained (an audit needs it)
// 3. GIVEN either THEN raw text never present
```

---

## AF-405: exportEvidenceBundle
**Feature:** FT-4.5 | **Entry:** `ledger/export/index.ts`
**BRIDGE:** writes an export governance event (AF-403).

**Business Rules**
1. Export = CSV + JSONL over a range, with a recomputable chain + SHA-256 bundle
checksum. 2. Bundle header: tenant, range, generated-at, actor, reason, checksum,
page numbers. 3. Excludes prompt/response text; includes user ids (an audit needs
them — deliberately different from the management view, NG-13). 4. Export is itself
logged (NG-12). 5. **Stated design position (FR-25, R8): the export shows
pseudonyms, never entity names** — an auditor sees `⟨Lieferant:a3f9⟩`. The export
proves *decisions were made and policy was applied*, not *what the data was*.
6. **Key separation (FR-23, NG-17): no key material and no pseudonym preimage
appears anywhere in the bundle.**

```ts
// SF-4051  export/collectRange.ts
export async function collectRange(from: string, to: string): Promise<LedgerEntry[]>
// deps: AF-404
// 1. GIVEN a range THEN all entries within (requests + governance + ops)
// 2. GIVEN an empty range THEN a valid empty bundle (header only)
// 3. GIVEN a range THEN counts of requests/governance/ops computed

// SF-4052  export/buildCsv.ts
export function buildCsv(entries: LedgerEntry[]): string
// 1. GIVEN entries THEN columns: ts, area, mode, verdict, caughtBy layer
// 2. GIVEN a clean request THEN area '--', mode 'unverändert'
// 3. GIVEN no text columns THEN confirmed (schema check)

// SF-4053  export/buildJsonl.ts
export function buildJsonl(entries: LedgerEntry[]): string
// 1. GIVEN entries THEN one JSON line each incl. prevHash/hash (verifiable)
// 2. GIVEN the output THEN re-parseable by AF-406
// 3. GIVEN entries THEN order preserved

// SF-4054  export/computeBundleChecksum.ts
export function computeBundleChecksum(csv: string, jsonl: string): string
// 1. GIVEN a bundle THEN a SHA-256 over both artefacts
// 2. GIVEN any change THEN a different checksum
// 3. GIVEN header THEN checksum printed per the design ("SHA-256 4f9c...a71e")

// SF-4056  export/assertExportPrivacy.ts   (FR-25 + FR-23 gate; runs before the bundle is emitted)
export function assertExportPrivacy(csv: string, jsonl: string): void
// 1. GIVEN a bundle THEN asserts entity tokens are pseudonyms, not entity names (FR-25/R8)
// 2. GIVEN key material or a pseudonym preimage present THEN throws ExportPrivacyError (FR-23/NG-17)
// 3. GIVEN a clean bundle THEN returns void

// SF-4055  export/writeExportGovernanceEvent.ts
export async function writeExportGovernanceEvent(range:{from,to}, reason:string, actor:string, checksum:string): Promise<string>
// deps: AF-403
// 1. GIVEN an export THEN a governance entry records actor, reason, range, checksum
// 2. GIVEN a missing reason THEN throws (an export must state its Anlass)
// 3. GIVEN the entry THEN it appears in subsequent exports (self-documenting)
```

---

## AF-406: verifyChain
**Feature:** FT-4.5 | **Entry:** `ledger/verify/index.ts`

```ts
// SF-4061  verify/recomputeChain.ts
export async function recomputeChain(path: string): Promise<{ ok: boolean; brokenAt?: number }>
// 1. GIVEN an intact ledger THEN ok=true
// 2. GIVEN a tampered entry THEN ok=false, brokenAt=index
// 3. GIVEN a month of entries THEN completes and confirms unbroken (§8 test)
// deps: SF-4012, SF-4041
```

---

## AF-407: backupLedger
**Feature:** FT-4.6 | **Entry:** `ledger/backup/index.ts`

```ts
// SF-4071  backup/snapshotLedger.ts
export async function snapshotLedger(target: string): Promise<{ path: string; count: number }>
// 1. GIVEN a ledger THEN a consistent snapshot is written to target
// 2. GIVEN an in-flight append THEN snapshot captures a clean chain boundary
// 3. GIVEN target unwritable THEN throws (backup never silently skipped)
// 4. GIVEN the pseudonym key store THEN it is NEVER included in the ledger backup (FR-23, NG-17) — asserted, not assumed

// SF-4072  backup/verifyBackupChain.ts
export async function verifyBackupChain(target: string): Promise<boolean>
// 1. GIVEN a snapshot THEN its chain verifies (delegates AF-406)
// 2. GIVEN a truncated snapshot THEN false
// 3. GIVEN restore THEN restored ledger continues the chain with no gap (NFR-06)
// deps: AF-406
```
