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

## Scope
- **In scope:** event model + hash chain, atomic append (restart-safe), request-
  entry writer (before reply), governance-event writer, query by date/area, CSV +
  JSONL export with chain verification + signed bundle, ledger backup/durability
  (moved here from Operations).
- **Out of scope:** storing original prompt/response text (unless full-text opt-in,
  never default — NG-10); management-view rendering (E6).

## Features
| ID | Feature | Stories | App Functions |
|----|---------|---------|---------------|
| FT-4.1 | Event Model & Hash Chain | US-013 | AF-401 |
| FT-4.2 | Request Entry Writer | US-014 | AF-402 |
| FT-4.3 | Governance-Event Writer | US-015 | AF-403 |
| FT-4.4 | Query (date, area) | US-016 | AF-404 |
| FT-4.5 | Export (CSV+JSONL, chain verify, signed bundle) | US-017 | AF-405, AF-406 |
| FT-4.6 | Durability & Backup | US-018 | AF-407 |

## Success Metrics
| Metric | Target |
|--------|--------|
| Chain verification over a month | 100% unbroken |
| Restart gap | 0 entries lost/duplicated |
| Original text in ledger (default mode) | Never present |
| Entity names in an evidence export | Never — pseudonyms only (FR-25, R8) |
| Key material in a ledger backup or export | Never (FR-23, NG-17) |
