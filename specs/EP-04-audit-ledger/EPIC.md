# EP-04: Audit Ledger
**Status:** DECOMPOSED

## Business Context
The ledger is the product's evidence. It is designed as an audit artefact, not
telemetry: append-only, hash-chained, one entry per request, exportable as a
verifiable chain and a signed evidence bundle. It records what was sent, what was
caught, and what was redacted — and it records the system's own tuning as
governance decisions, so an auditor sees the control's history, not just its
output. It never stores original prompt text by default (hash + redacted only);
entity tokens are pseudonyms (NG-10).

**The actor is pseudonymous too (NG-19).** Per-user rows make the ledger
*objektiv geeignet* to collect behavioural data under §87(1) Nr. 6 BetrVG, so the
ledger stores an `actorPseudonym = HMAC(customerKey, normalize(userId))` — never a
plaintext user id, even in an evidence export — using the same key lifecycle and
separation rule as entity pseudonyms (NG-17). Recovering the person behind a
pseudonym is a deliberate, two-party operation: the **dual-key unmask (NG-20,
AF-408)** requires the Vier-Augen-Prinzip and is itself a logged ledger entry.
Together these make a Betriebsvereinbarung signable — co-determination is not
avoidable, so the design makes it easy to agree to.

## Scope
- **In scope:** event model + hash chain, atomic append (restart-safe), request-
  entry writer (before reply), governance-event writer, query by date/area, CSV +
  JSONL export with chain verification + signed bundle, ledger backup/durability
  (moved here from Operations); **actor pseudonymisation (NG-19)** and the **dual-key
  unmask interface + ledger semantics (NG-20, AF-408)**.
- **Out of scope:** storing original prompt/response text (unless full-text opt-in,
  never default — NG-10); storing a plaintext user id (never — NG-19);
  management-view rendering (E6); the dual-key **secret store + role binding**
  (E8-deferred — AF-408 specifies the interface, not the storage).

## Features
| ID | Feature | Stories | App Functions |
|----|---------|---------|---------------|
| FT-4.1 | Event Model & Hash Chain (incl. actor-pseudonym guard, NG-19) | US-013 | AF-401 |
| FT-4.2 | Request Entry Writer (derives `actorPseudonym`) | US-014 | AF-402 |
| FT-4.3 | Governance-Event Writer | US-015 | AF-403 |
| FT-4.4 | Query (date, area) | US-016 | AF-404 |
| FT-4.5 | Export (CSV+JSONL, chain verify, signed bundle) | US-017 | AF-405, AF-406 |
| FT-4.6 | Durability & Backup | US-018 | AF-407 |
| **FT-4.7** | **Dual-key actor unmask (Vier-Augen, NG-20)** | **US-031** | **AF-408** |

## Success Metrics
| Metric | Target |
|--------|--------|
| Chain verification over a month | 100% unbroken |
| Restart gap | 0 entries lost/duplicated |
| Original text in ledger (default mode) | Never present |
| **Plaintext user id in any ledger entry or export** | **Never — `actorPseudonym` only (NG-19)** |
| Entity names in an evidence export | Never — pseudonyms only (FR-25, R8) |
| Key material in a ledger backup or export | Never (FR-23, NG-17) |
| **Actor unmask without two distinct-role authorisers** | **Impossible; every unmask is a logged ledger entry (NG-20)** |
