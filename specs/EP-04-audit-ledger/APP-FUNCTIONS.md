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
  actorPseudonym?: string           // HMAC(customerKey, normalize(userId)) — NG-19, NEVER a plaintext user id
  actorEpoch?: number               // keyEpoch of the actor pseudonym (same lifecycle as entity pseudonyms)
  promptHash?: string
  touchedAreas?: string[]
  verdict?: Verdict
  mode?: AreaMode | null
  caughtBy?: string | null
  provider?: string
  latencyMs?: number
  coverage?: Coverage
  spanPseudonyms?: { area: string; layer: Layer; ruleId?: string; pseudonym: string; keyEpoch: number }[]  // NG-10 (ruleId added US-022)
  // Amendment B (§9 B5, NG-23) — the business-event record: WHAT the business was doing, not who.
  features?: { name: string; value: string | number | boolean }[]  // structural features that decided it (percentPresent, priceTermInSentence, …) — never text
  workTopic?: string        // coarse, non-attributable topic label — never an original value
  baselineVersion?: string  // the Schutzprofil baseline in force for this event
  // governance entries:
  govKind?: 'activation'|'rule-narrow'|'term-exclude'|'mode-change'|'dismiss'|'export'|'key-rotate'|'unmask'|'baseline'|'change-request'
  reason?: string
  payload?: unknown
  // unmask entries (AF-408, NG-20): who authorised a de-anonymisation
  unmaskAuthorisers?: { party: string; role: string }[]   // exactly two, distinct roles
  unmaskTarget?: string             // the actorPseudonym that was unmasked (never the recovered identity)
  // NEVER: raw prompt/response text (unless full-text opt-in, never default); NEVER a plaintext user id (NG-19)
}
```

> **NG-19 note.** There is no `user` field. The actor is `actorPseudonym` on both
> request and governance entries — accountability is preserved because the pseudonym
> is stable and, when a person genuinely must be identified, recoverable only via the
> dual-key unmask (AF-408). An unmask entry records *who authorised it* (`unmaskAuthorisers`)
> and *which pseudonym* (`unmaskTarget`) — never the recovered identity itself.
>
> **NG-23 note (Amendment B §9 B5, spec only — not built).** A request entry is the
> **business-event record**: `features` (structural — what decided the verdict, never
> text) + `workTopic` + `baselineVersion`, alongside the existing pseudonyms. **This
> one record serves both the E6 narrowing preview (AF-604) and E7 recurring-work
> (AF-701) — never two parallel stores.** The `features` make `previewRuleNarrowing`
> return a real before/after (resolves F3). Governance `govKind:'baseline'` records a
> Schutzprofil supersede (NG-22); `govKind:'change-request'` records an approved
> Änderungsantrag. A query window spanning a `baseline` change carries a coverage note
> (as a key-epoch crossing does).

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
4. **NG-19: the append refuses any entry carrying a plaintext user identifier.**
`assertNoPlaintextActor` (SF-4015) runs before the write; only `actorPseudonym`
(+`actorEpoch`) is permitted. This is the first ledger story (US-013), so the guard
exists before any writer can populate the field.

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

// SF-4015  append/assertNoPlaintextActor.ts   (NG-19 guard; runs before every append)
export function assertNoPlaintextActor(e: Partial<LedgerEntry>): void
// 1. GIVEN an entry with only actorPseudonym (+actorEpoch) THEN returns void
// 2. GIVEN an entry carrying a plaintext `user` field (or any userId-shaped key) THEN throws PlaintextActorError (NG-19)
// 3. GIVEN a governance entry THEN same rule: the acting party is a pseudonym, never a plaintext id

// SF-4014  append/appendLedgerEntry.ts
export async function appendLedgerEntry(e: Partial<LedgerEntry>): Promise<{id:string;hash:string}>
// 1. GIVEN an entry THEN prevHash chained, id + hash returned
// 2. GIVEN two entries THEN second.prevHash === first.hash
// 3. GIVEN write failure THEN throws (caller must not proceed to reply — NG-5)
// 4. GIVEN an entry with a plaintext user id THEN assertNoPlaintextActor throws before any write (NG-19)
// deps: SF-4011, SF-4012, SF-4013, SF-4015
```

---

## AF-402: writeRequestEntry
**Feature:** FT-4.2 | **Entry:** `ledger/request/index.ts`
**BRIDGE:** called by E3 `AF-303` before the verdict returns (NG-5).

**Business Rules**
1. Exactly one entry per request (FR-02). 2. Contains metadata + span pseudonyms,
never original text (NG-2, NG-10). 3. Written even on provider failure (FR-14) and
in degraded mode (coverage recorded, NG-4). 4. **NG-19: `RequestMeta` carries the
raw `userId` (customer-side only); the writer derives `actorPseudonym` and never
puts the raw id on the entry.** `RequestMeta = { userId: string; promptHash: string;
provider: string; latencyMs: number; key: KeyMaterial }`.

```ts
// SF-4024  request/deriveActorPseudonym.ts
export function deriveActorPseudonym(userId: string, key: KeyMaterial): { actorPseudonym: string; actorEpoch: number }
// 1. GIVEN a userId + key THEN HMAC(key, normalize(userId)) + keyEpoch (NG-19, same construction as entity pseudonyms)
// 2. GIVEN the same userId + key epoch THEN a stable pseudonym (an actor resolves across their own requests)
// 3. GIVEN output THEN it never contains the raw userId
// deps: E3 SF-3052 computePseudonymHmac (reused; the actor is just another keyed value) [BRIDGE → E3]

// SF-4021  request/buildRequestEntry.ts
export function buildRequestEntry(v: InspectionVerdict, meta: RequestMeta): Partial<LedgerEntry>
// 1. GIVEN a verdict THEN entry has verdict, mode, caughtBy, coverage, touchedAreas
// 2. GIVEN spans THEN spanPseudonyms attached (pseudonym+keyEpoch), no originals
// 3. GIVEN meta THEN actorPseudonym (via SF-4024), actorEpoch, promptHash, provider, latencyMs set — the raw userId never lands on the entry (NG-19)
// 4. AMENDMENT B (§9 B5, NG-23): GIVEN a verdict THEN features (structural, from AF-303) + workTopic + baselineVersion are recorded — the business-event record; never raw text
// deps: SF-4024

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
// 4. GIVEN the written entry THEN it carries actorPseudonym, never a plaintext userId (NG-19; enforced again by SF-4015 at append)
// deps: SF-4024, SF-4021, SF-4022, AF-401
```

---

## AF-403: writeGovernanceEvent
**Feature:** FT-4.3 | **Entry:** `ledger/governance/index.ts`
**Consumers:** E2 `AF-206` (activation), E6 `AF-604` (tuning/dismissals), `AF-405` (export), E8 key rotation.

```ts
// SF-4031  governance/buildGovernanceEntry.ts
export function buildGovernanceEntry(kind: GovKind, actorId: string, reason: string, payload: unknown, key: KeyMaterial): Partial<LedgerEntry>
// 1. GIVEN a rule-narrow THEN entry records before/after + 30-day impact in payload
// 2. GIVEN a dismissal THEN reason is mandatory (throws if empty)
// 3. GIVEN a key-rotate THEN records old/new epoch (no key material)
// 4. GIVEN an actorId THEN stored as actorPseudonym via SF-4024, never as a plaintext id (NG-19; accountability preserved, unmask via AF-408)
// deps: SF-4024

// SF-4032  governance/writeGovernanceEvent.ts
export async function writeGovernanceEvent(kind: GovKind, actorId: string, reason: string, payload: unknown, key: KeyMaterial): Promise<string>
// 1. GIVEN a tuning action THEN appended as a governance entry, id returned
// 2. GIVEN missing actorId THEN throws (accountability, NG-12)
// 3. GIVEN the entry THEN it sits in the same chain as request entries, actor pseudonymised (NG-19)
// deps: SF-4031, SF-4024, AF-401
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
// 1. GIVEN ctx 'management' THEN the actor dimension is dropped entirely — no actorPseudonym, no person column (NG-13)
// 2. GIVEN ctx 'export' THEN actorPseudonym is retained (an audit needs a stable actor token) but NEVER a plaintext id (NG-19); the person is recoverable only via AF-408
// 3. GIVEN either THEN raw text never present
```

---

## AF-405: exportEvidenceBundle
**Feature:** FT-4.5 | **Entry:** `ledger/export/index.ts`
**BRIDGE:** writes an export governance event (AF-403).

**Business Rules**
1. Export = CSV + JSONL over a range, with a recomputable chain + SHA-256 bundle
checksum. 2. Bundle header: tenant, range, generated-at, requesting actor
(pseudonym), reason, checksum, page numbers. 3. Excludes prompt/response text;
includes the `actorPseudonym` — a **stable pseudonymous** actor token, never a
plaintext user id (NG-19; recovering the person is the dual-key unmask, AF-408).
This is deliberately different from the management view, which drops the actor
dimension entirely (NG-13). 4. Export is itself logged (NG-12). 5. **Stated design
position (FR-25, R8): the export shows pseudonyms, never entity names** — an auditor
sees `⟨Lieferant:a3f9⟩`. The export proves *decisions were made and policy was
applied*, not *what the data was*. 6. **Key separation (FR-23, NG-17): no key
material and no pseudonym preimage appears anywhere in the bundle.**

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
// 3. GIVEN a plaintext user id anywhere in the bundle THEN throws ExportPrivacyError (NG-19) — only actorPseudonym is permitted
// 4. GIVEN a clean bundle THEN returns void

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

---

## AF-408: unmaskActor  *(dual-key de-anonymisation — NG-20)*
**Feature:** FT-4.7 | **Entry:** `ledger/unmask/index.ts`
**BRIDGE:** writes an unmask governance entry (AF-403). **Story:** US-031.

The one operation that recovers a person from an `actorPseudonym`. It requires the
**Vier-Augen-Prinzip**: two named parties in distinct roles (IT security + a
works-council representative), authorising simultaneously; neither alone. Because
the pseudonym is `HMAC(key, normalize(userId))` (one-way), recovery is a *matched
recomputation* over the customer's known employee directory under the customer key
— both supplied by a `KeyProvider`/`DirectoryProvider` interface whose physical
secret store + role binding are an **E8 concern (deferred)**. E4 owns the interface,
the dual-authorisation logic, and the ledger semantics; E8 owns where the secrets live.

**Business Rules**
1. Two authorisers, two **distinct** roles, or the unmask is refused (NG-20).
2. The unmask writes its own ledger entry: both parties, both roles, timestamp,
   stated reason, and the target `actorPseudonym` — never the recovered identity.
3. The recovered identity is returned to the authorised callers only; it is never
   written to the ledger or any export.

```ts
// SF-4081  unmask/buildUnmaskRequest.ts
export function buildUnmaskRequest(targetPseudonym: string, reason: string): UnmaskRequest
// 1. GIVEN a target + reason THEN a well-formed request
// 2. GIVEN an empty reason THEN throws (an unmask must state its Anlass — NG-12/NG-20)
// 3. GIVEN a target that is not a pseudonym shape THEN throws (guards against passing a raw id)

// SF-4082  unmask/verifyDualAuthorisation.ts
export function verifyDualAuthorisation(auths: Authorisation[], roleBinding: RoleBinding): { party: string; role: string }[]
// 1. GIVEN a single authoriser THEN throws DualAuthorisationError (NG-20)
// 2. GIVEN two authorisers in the SAME role THEN throws (distinct roles required)
// 3. GIVEN two authorisers in distinct bound roles (IT security + works-council rep) THEN returns the validated pair
// deps: RoleBinding (interface; physical binding in E8)

// SF-4083  unmask/resolveActorIdentity.ts
export function resolveActorIdentity(targetPseudonym: string, key: KeyMaterial, dir: DirectoryProvider): string
// 1. GIVEN the pseudonym + key + employee directory THEN recompute HMAC over each candidate and return the match
// 2. GIVEN no match in the directory THEN throws UnresolvedActorError (never guesses — NG-9 spirit)
// 3. GIVEN the output THEN it is returned to the caller only; it is NOT part of any ledger entry (rule 3)
// deps: E3 SF-3052 computePseudonymHmac (same construction), DirectoryProvider (interface; E8-provided)

// SF-4084  unmask/writeUnmaskGovernanceEvent.ts
export async function writeUnmaskGovernanceEvent(target: string, authorisers: {party:string;role:string}[], reason: string, key: KeyMaterial): Promise<string>
// 1. GIVEN a valid unmask THEN a govKind:'unmask' entry records both authorisers, reason, target pseudonym
// 2. GIVEN the entry THEN it carries NO recovered identity and no plaintext user id (NG-19/NG-20)
// 3. GIVEN the entry THEN it sits in the same chain and appears in subsequent exports (self-documenting)
// deps: AF-403

// SF-4085  unmask/unmaskActor.ts   (composition — the guarded entry point)
export async function unmaskActor(req: UnmaskRequest, auths: Authorisation[], ctx: UnmaskContext): Promise<{ identity: string; ledgerEntryId: string }>
// 1. GIVEN a valid request + two distinct-role authorisers THEN writes the unmask entry FIRST, then returns the recovered identity
// 2. GIVEN authorisation fails THEN nothing is resolved and nothing is written (no partial unmask)
// 3. GIVEN the ledger write fails THEN the identity is NOT returned (no off-ledger unmask — NG-20)
// deps: SF-4081, SF-4082, SF-4084, SF-4083
```

**Chain order:** buildUnmaskRequest → verifyDualAuthorisation → writeUnmaskGovernanceEvent → resolveActorIdentity → return. **The ledger entry is written before the identity is returned** (an unmask off the record is impossible, mirroring NG-5).
