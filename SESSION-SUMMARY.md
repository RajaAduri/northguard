# NorthGuard — Build Session Summary (Part B)

**Run:** continuous build from the amended specs, Sprint 1 → Sprint 2.
**Outcome:** **Sprint 1 and Sprint 2 COMPLETE.** One stop condition was hit mid-run (NG-18 corpus contradiction, US-010), reported, resolved by the owner (dropped the bare "Nordwerk" form from ENT-004), and the run resumed to completion. Full per-story trace in `SESSION-LOG.md`.

## Stories completed (15) — all committed, TDD red→green, `tsc` strict clean
| Story | AF | What | Invariants |
|-------|----|------|-----------|
| US-013 | AF-401 | Append-only hash-chained ledger writer + actor-pseudonym guard | NG-5, **NG-19** |
| US-015 | AF-403 | Governance-event writer | NG-12, NG-19 |
| US-018 | AF-407 (+AF-406) | Durability & backup + chain recompute | NG-17, NFR-06 |
| US-001 | AF-201 | Policy ingest (text/PDF → normalized + hash) | — |
| US-002 | AF-202 | Extract protected concepts (sidecar, cached) | NG-6 |
| US-003 | AF-203 | Stability gate (0.80) | NG-3, NFR-07 |
| US-004 | AF-204 | Confirm & edit areas | NG-3 |
| US-005 | AF-205/206 | Area modes + guarded, logged activation | NG-3, NG-12 |
| US-006 | AF-301 | Rules layer (DE+EN, validated German identifiers) | NG-7, NG-16, **NFR-01** |
| US-007 | AF-302 | LLM backstop + graceful degradation | NG-4 |
| US-008 | AF-303 | Verdict decision core **+ full `assembleVerdict` (SF-3035)** | NG-8, **NG-5**, **NG-1** |
| US-009 | AF-304 | Semantic indexed placeholders | NG-11, NG-14 |
| US-010 | AF-305 | Keyed pseudonyms + corpus-validated German normalisation | **NG-10, NG-18** |
| US-011 | AF-306 | Wire transcript + two-transcript isolation | **NG-1** (§8 10-turn) |
| US-012 | AF-307 | Rehydration — declension-tolerant, never guess | **NG-9**, NG-14, NG-1 |
| US-014 | AF-402 | Request-entry writer (**pulled forward** from Sprint 3) | NG-2, NG-5, NG-10, NG-19 |

**214 tests green, `tsc` strict clean.** Scaffolds: `core/` (TS strict + Vitest, Node 24), `recurring/` (pytest). Commits `6b33fec`…`ca709d6`.

## Measured figures
- **Rules-layer p95 = 0.302 ms** over 2274 chars of German (NFR-01 budget < 50 ms) — ~165× margin, no optimisation needed.
- **§8 wire-transcript isolation: PASS** — a 10-turn conversation (20 outbound messages, 20 originals) leaks zero originals (`assertWireIsolation`), and `assembleVerdict` re-asserts it on every turn before anything could forward.
- **NG-18 corpus: 19/19** after the ENT-004 fix.
- **Policy stability index on a real 3-page German policy: NOT MEASURED** — needs a running kg-gen sidecar + LLM, not configured here. The stability *code* meets its unit spec; the real-policy measurement is a pending integration step, not a threshold breach (nothing was tuned).

## Invariants verified by automated test
NG-1 (wire isolation, §8 10-turn + per-turn), NG-2/NG-10 (pseudonyms + no raw text in ledger), NG-3 (activation guard), NG-4 (degrade, never fail open), NG-5 (ledger before reply), NG-6 (extract once per version), NG-7 (rules no-network, p95), NG-8 (span attribution), NG-9 (never guess rehydration), NG-11 (semantic placeholders), NG-12 (governance actor+reason), NG-14 (pure transcript engine), NG-16 (DE/EN parity), NG-17 (no key material in backup), NG-18 (corpus 19/19), NG-19 (no plaintext actor in any entry). NFR-01, NFR-06, NFR-07 exercised.

## The one stop condition (resolved)
`de-entity-variants.yml` group **ENT-004** required bare "Nordwerk" ≡ "Nordwerk Systemtechnik" while keeping "Nordwerk Systemtechnik" ≠ "Nordwerk Immobilien" — unsatisfiable by a deterministic normaliser (proof: first-token unifies ENT-004 but collapses all four distinct pairs). Halted per stop conditions #3/#4; the invariant was **not** weakened. Owner chose to drop the bare "Nordwerk" form (with an in-corpus note that bare short-forms need a customer alias table, out of E3 scope). US-010 then went green with **no code change** to the normaliser.

## Key decisions (full list in SESSION-LOG)
- Shared pseudonym HMAC primitive in `core/lib/pseudonym.ts` (E4 actor + E3 entity).
- `assertNoPlaintextActor` (NG-19) landed in US-013, before any writer.
- AF-406 `recomputeChain` pulled into US-018; AF-402 (US-014) pulled into Sprint 2 to complete `assembleVerdict` + NG-5.
- `assembleVerdict(req, policy, ctx)` takes an `InspectionContext {key,userId,provider}` beyond the E1 request (which carries neither key nor raw user id).
- `computeSpans` emits `DetectedSpan`; AF-304/305 enrich → `RedactionSpan`. `buildWireText` also returns the enriched spans.
- `extractPdfText` is a minimal deterministic extractor; production should swap a pinned PDF lib behind the same signature.
- Area ids are canonical lexicon slugs; E2 `mapGraphToAreas` should assign these at integration (currently sidecar node ids).
- Governance-write signatures gained a `key` param (NG-19 postdates the pre-amendment spec).

## What is next
- **Sprint 3** — E4 query/export (US-016/017), **US-031 dual-key unmask (AF-408, NG-20)**, E6 read-models (US-019/021/023). (US-014 already done; US-031 manifest already exists.)
- **Sprint 4–5** — E7 recurring-work (carries the **NG-21** non-attributability gate and the real kg-gen stability measurement).
- **Sprint 6** — E5 governed chat surface (React SPA over this core).
- **Integration** — assign canonical area slugs in E2 `mapGraphToAreas`; wire a real kg-gen sidecar to measure stability on a real policy; swap a pinned PDF lib into `extractPdfText`.
- **Before GA** — escalate the E7 AI Act Annex III exposure to counsel (open legal risk, DECISION-REGISTER §8 A5).
