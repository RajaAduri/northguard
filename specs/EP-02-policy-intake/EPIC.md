# EP-02: Policy Intake → the baselined Schutzprofil
**Status:** DECOMPOSED · **Amended:** 2026-09-20 (Amendment B §9 — spec only, not built)

## Business Context
Turns a written company data policy into a confirmed set of protected areas. This
is the input to the whole system — with no confirmed policy, nothing is forwarded.
The extraction is expensive and drift-prone, so it runs once per policy version
(content-hash keyed) and passes a stability gate before a human may activate it.
Human confirmation is mandatory; nothing auto-activates (NG-3).

### Amendment B — the profile is a baselined configuration item (NG-22)
The confirmed result is no longer a one-shot activation; it is a **baseline of the
customer's Schutzprofil** with a version, created date, named approver, and the
change request that produced it (null for the initial baseline). **It is immutable
between baselines (NG-22)** — no extraction or background process alters an active
profile; the only path to a new baseline is an approved **Änderungsantrag** (E6
AF-610). Onboarding gains two steps ahead of confirmation: **multi-pass convergence**
(AF-207) and **clarifying questions** (AF-208). The stability index is reframed as an
**onboarding convergence signal**, not a per-activation gate (NFR-07; see the FLAGS
below). **Not built in this pass — decompose only.**

> **⚠ Flagged contradictions (DECISION-REGISTER §9):** F1 — built `guardActivation`
> (SF-2061) gates stability on *every* activation, but a change-request baseline is a
> reviewed human decision, not a stability re-measure. F2 — NG-6 "once per version"
> vs multi-pass convergence. F4 — built `publishActivePolicy` swaps in memory with no
> versioned baseline; NG-22 needs versioned, supersede-logged baselines. Resolve at
> the Amendment-B build; not resolved here.

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
| **FT-2.6** | **Multi-pass convergence (onboarding)** — Amendment B | **US-040** | **AF-207** |
| **FT-2.7** | **Clarifying questions (onboarding)** — Amendment B | **US-041** | **AF-208** |
| **FT-2.8** | **Baseline the Schutzprofil (configuration item, NG-22)** — Amendment B | **US-042** | **AF-209** |

## Success Metrics
| Metric | Target |
|--------|--------|
| Human-confirm time (3-page German policy) | < 10 min |
| Re-extraction on unchanged policy | 0 (served from cache) |
| Unstable graph activation | Impossible (guard) — onboarding baseline only (Amendment B) |
| **Convergence passes shown to the user** | **Yes — "N passes, the last added nothing" (AF-207)** |
| **Onboarding questions asked** | **5–8, generated from real ambiguities (AF-208); onboarding < ~20 min** |
| **Active profile mutated without an approved change request** | **Never (NG-22)** |

## Sidecar contract (consumed, not built here)
`POST http://127.0.0.1:8077/graph` → `{ key, graph:{nodes,edges}, stability_index,
stable, threshold, model, cached }` (see `prototype/kg_sidecar.py`). Core treats
`stable` as advisory and re-enforces the threshold itself (defence in depth).
