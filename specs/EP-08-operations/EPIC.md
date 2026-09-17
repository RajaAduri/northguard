# EP-08: Operations
**Status:** DEFERRED — coupled to the interception architecture, not decomposed.
**Origin:** was SLC-pack E7.

## Why this epic is not decomposed

Deployment topology (Docker Compose), health checks, process layout, and provider
key storage all presuppose the interception decision (gateway container vs
extension + local service). Building them now would bake in a guess. Deferred with
E1/E5.

## What moved out of Operations into the core
- **Ledger durability, restart-safety, and backup** → **E4** (`AF-401` atomic
  append, `AF-407` backup). These are correctness-critical (NFR-06) and
  architecture-independent, so they are built now, not deferred.

## What remains deferred here
| Concern | Source | Notes |
|---------|--------|-------|
| Docker Compose single-host topology | SLC pack §5.7 | Depends on gateway-vs-extension |
| Health checks | SLC pack E7 | Sidecar already exposes `/health`; gateway health TBD by architecture |
| Provider key management | D3 | Behind a `KeyProvider` interface; secret storage is deployment-specific |
| Pseudonym key storage + rotation trigger | R5, FR-23 | **Derivation + rotation semantics are core (E3/E7); physical key storage is here.** The `KeyProvider` interface is defined in core; its secret-store implementation is deferred. **Binding now (NG-17): the key lives in storage separate from the ledger, is excluded from ledger backups, and never appears in an evidence export.** |
| Log rotation | SLC pack E7 | Ledger rotation must preserve chain continuity — spec note for the eventual implementation |

## The one interface the core needs from E8 (defined in core, implemented later)
```ts
// core/lib/keyProvider.ts — interface only; implementation deferred to E8
export interface KeyProvider {
  currentEpoch(): number
  hmacKey(epoch: number): Uint8Array | Buffer   // never leaves customer infra (NG-10)
  rotate(): number                              // returns the new epoch; logged as a governance event (NG-12)
}
```
For core development and tests, a local file/env-backed `KeyProvider` stub is used;
it is not the production secret store.

## Deployment guidance — key separation & rotation (write this into the customer-facing deploy doc)

These are the two things a deployment engineer and the customer's quality/IT lead
must be told **before** go-live, because both fail silently if discovered late.

### 1. Key separation (FR-23, NG-17) — a security requirement, not a preference
- The pseudonym key MUST be stored **separately from the ledger** — different
  volume, different backup job, different access scope. A single backup that
  captures both the ledger and the key voids the entire pseudonymisation scheme.
- Rationale to give the customer plainly: pseudonyms are `HMAC(key, name)` over
  **low-entropy** values — supplier and customer names are highly guessable.
  Anyone holding both the ledger and the key can dictionary-attack and reverse
  them. The privacy of the whole audit trail rests on the key being somewhere the
  ledger's readers and backups are not.
- The key never appears in an evidence export (the export is pseudonyms only, R8).

### 2. Key rotation is compromise-response, not scheduled hygiene (R5)
- Rotation is **destructive to analytics.** Because clustering never crosses a
  `keyEpoch` (NG-15/R5), a rotation **permanently blanks recurring-work history**
  and **fractures any briefing window that spans it** — old pseudonyms and new
  pseudonyms for the same entity can never be re-linked (there are no originals to
  re-link from; that is the privacy guarantee working as designed).
- **Therefore: rotate on suspected key compromise, not on a calendar.** Many
  corporate security policies mandate routine annual key rotation. A customer who
  applies such a policy here will **lose their duplicated-work history every year**
  and, unless told, will not understand why the Monday briefing suddenly says
  "no recurring work." State this trade-off up front so it is a decision, not a
  confused quality lead filing a bug.
- The in-product mechanism already exists: a briefing whose window spans a rotation
  carries a **coverage caveat** (E6 `SF-6021`), and the rotation itself is a logged
  governance event (E4 `AF-403`). The missing piece is this guidance — that the
  caveat means "history was reset by a key rotation on `<date>`," and that this was
  expected if a rotation was performed.
- If a customer's compliance regime genuinely requires periodic rotation, the
  honest options to offer are: (a) accept the annual analytics reset, or (b) treat
  recurring-work analytics as out of scope for that deployment. Do **not** work
  around it by weakening key separation or persisting originals.
