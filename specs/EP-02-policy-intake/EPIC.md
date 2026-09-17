# EP-02: Policy Intake
**Status:** DECOMPOSED

## Business Context
Turns a written company data policy into a confirmed set of protected areas. This
is the input to the whole system — with no confirmed policy, nothing is forwarded.
The extraction is expensive and drift-prone, so it runs once per policy version
(content-hash keyed) and passes a stability gate before a human may activate it.
Human confirmation is mandatory; nothing auto-activates (NG-3).

## Scope
- **In scope:** paste/PDF ingest, normalisation + content hash, kg-gen extraction
  via the localhost sidecar, stability index enforcement, area confirmation +
  manual edit, per-area mode assignment, guarded activation, activation as a
  logged governance event.
- **Out of scope:** automatic policy authoring (SLC pack §5.3); per-request
  extraction (forbidden by NG-6); the sidecar's internals (owned by the prototype
  `kg_sidecar.py`, consumed here over HTTP).

## Features
| ID | Feature | Stories | App Functions |
|----|---------|---------|---------------|
| FT-2.1 | Policy Ingest | US-001 | AF-201 |
| FT-2.2 | Concept Extraction | US-002 | AF-202 |
| FT-2.3 | Stability Gate | US-002, US-003 | AF-203 |
| FT-2.4 | Area Confirmation & Manual Edit | US-004 | AF-204 |
| FT-2.5 | Area Mode Assignment & Activation | US-005 | AF-205, AF-206 |

## Success Metrics
| Metric | Target |
|--------|--------|
| Human-confirm time (3-page German policy) | < 10 min |
| Re-extraction on unchanged policy | 0 (served from cache) |
| Unstable graph activation | Impossible (guard) |

## Sidecar contract (consumed, not built here)
`POST http://127.0.0.1:8077/graph` → `{ key, graph:{nodes,edges}, stability_index,
stable, threshold, model, cached }` (see `prototype/kg_sidecar.py`). Core treats
`stable` as advisory and re-enforces the threshold itself (defence in depth).
