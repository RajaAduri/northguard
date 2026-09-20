# EP-06: Management View → + the review cycle
**Status:** DECOMPOSED · **Amended:** 2026-09-20 (Amendment B §9 — spec only, not built)

> **Amendment B (§9 B4):** adds the **review cycle** — evidence accumulates between
> reviews; a review produces a **Review-Vorschlag** (proposals with evidence in
> numbers + period, ordered by priority, and able to propose **nothing**). Approving a
> proposal creates an **Änderungsantrag** (change request); approving that creates the
> next Schutzprofil baseline (E2 AF-209). New AFs: `AF-609 composeReviewProposal`,
> `AF-610 processChangeRequest`. Amendment B also upgrades `previewRuleNarrowing`
> (AF-604) to a real before/after from the business-event `features` (resolves F3).
> **Terminology (§9 B6):** user-visible strings say **Schutzprofil / Review-Vorschlag
> / Änderungsantrag** — never "the model suggests" or a graph name. Not built this pass.

## Business Context
The second room. Where the risk owner and engineering lead read the week: where
exposure concentrated, what the team is stuck on (the briefing, powered by E7),
the false-positive queue that keeps the false-block rate under 1/user/week, and
the evidence export that closes a sale. It is **structurally aggregated** — no
person column exists in any model here (NG-13) — and it is visually a *document*,
not a *tool*, entered through a named threshold (FR-19).

## Scope
- **In scope:** exposure-concentration read-model, weekly-briefing composition
  (consuming E7 findings + ledger stats; prose generated, inputs deterministic),
  aggregated activity log, false-positive review queue + resolution actions
  (each a governance event), evidence-export view (delegates E4), the two-rooms
  context model.
- **Out of scope:** the recurring-work machinery itself (E7); rendering (E5);
  any per-person breakdown (NG-13).

## Features
| ID | Feature | Stories | App Functions |
|----|---------|---------|---------------|
| FT-6.1 | Exposure Concentration | US-019 | AF-601 |
| FT-6.2 | Weekly Briefing Composition | US-020 | AF-602 |
| FT-6.3 | Aggregated Activity Log | US-021 | AF-603 |
| FT-6.4 | False-Positive Review Queue | US-022 | AF-604 |
| FT-6.5 | Evidence Export View | US-023 | AF-605 |
| FT-6.6 | Two-Rooms Context | US-024 | AF-606 |
| **FT-6.7** | **Review cycle → Review-Vorschlag** — Amendment B | **US-043** | **AF-609** |
| **FT-6.8** | **Change request → next baseline (Änderungsantrag)** — Amendment B | **US-044** | **AF-610** |

## Success Metrics
| Metric | Target |
|--------|--------|
| Person column anywhere in E6 models | 0 (structural) |
| False-block rate after FP loop | < 1 / user / week |
| Briefing novel-insight rate | ≥ 1 / week |
| **Review cadence** | **fortnightly (Q1) → monthly → quarterly, configurable (AF-609)** |
| **A review able to propose nothing** | **Yes — a valid, healthy outcome (AF-609)** |
| **Profile changed without an approved Änderungsantrag** | **Never (NG-22, AF-610)** |
| **`previewRuleNarrowing` after-count** | **Real, from the business-event `features` (NG-23) — no longer `measured:false`** |
