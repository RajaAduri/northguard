# NorthGuard — Build Session Summary (Part B)

**Run:** continuous build from the amended specs, Sprint 1 → Sprint 2.
**Outcome:** Sprint 1 complete; Sprint 2 complete through US-009; **halted at US-010 on a stop condition** (NG-18 corpus contradiction). Full per-story trace in `SESSION-LOG.md`.

## Stories completed (12) — all committed, TDD red→green, tsc strict clean
| Story | AF | What | Invariants exercised |
|-------|----|------|----------------------|
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
| US-008 | AF-303 | Verdict decision core (decision half) | NG-8 |
| US-009 | AF-304 | Semantic indexed placeholders | NG-11, NG-14 |

**158 tests green, tsc strict clean** at the last committed story (US-009). Scaffolds: `core/` (TS strict + Vitest, Node 24), `recurring/` (pytest). Commits `6b33fec`…`a1bef35` (+ `1106cee` gitignore for the runtime hook log).

## Measured figures
- **Rules-layer p95 = 0.302 ms** over 2274 chars of German text (NFR-01 budget < 50 ms) — passes with a ~165× margin. No optimisation needed.
- **Policy stability index (real 3-page German policy): NOT MEASURED.** Requires a running kg-gen sidecar + LLM, not configured in this environment. The stability *code* meets its unit spec (0.80 gate; SI null → not stable). The real-policy measurement is a pending integration step, not a threshold breach — nothing was tuned.

## Key decisions taken (recorded inline + in SESSION-LOG)
- Shared pseudonym HMAC primitive in `core/lib/pseudonym.ts` (used by E4 actor derivation now, E3 entity pseudonyms in US-010) — the amendment's "SF-4024 reuses SF-3052" realised as one primitive.
- `assertNoPlaintextActor` (NG-19) landed in US-013, before any writer — no ledger entry can hold a plaintext user id.
- AF-406 `recomputeChain` pulled forward into US-018 (its natural dependency); `getLedgerPath()` added to the append module for the snapshot source.
- `writeActivationGovernanceEvent`/`activatePolicyVersion` gained a `key` param — governance actors are pseudonymised (NG-19), which postdates the pre-amendment signatures.
- `extractPdfText` is a minimal deterministic content-stream extractor; production should swap a pinned PDF lib (pdfjs-dist) behind the same signature.
- `computeSpans` emits an intermediate `DetectedSpan`; AF-304/305 enrich it into a full `RedactionSpan`.
- **US-008 SF-3035 (`assembleVerdict`, full composition + NG-5 ledger write) deferred to US-011** — a real forward dependency on AF-304/305/306; US-008 shipped the decision core + `assembleDecision`.
- Area ids are canonical lexicon slugs (`preise-margen`, …); E2 `mapGraphToAreas` should assign these at integration (currently sidecar node ids).

## ⛔ Blocker — why the run halted (US-010, NG-18)
`normalizeEntityValue` (SF-3051) is gated on `lexicons/de-entity-variants.yml`. The AF-305 mechanics are **sound** (NG-10: computePseudonymHmac + attachPseudonymToSpan green; unit normalisation rules green; **18/19 corpus assertions pass** — ENT-001/002/003/005 unify, all 4 distinct pairs hold). **Only group ENT-004 is unsatisfiable:**

- ENT-004 requires bare `"Nordwerk"` ≡ `"Nordwerk Systemtechnik"`. Because `"Systemtechnik"` is a plain noun (no legal-form / "& Söhne" suffix to strip), the *only* rule that unifies them is **first-token reduction**.
- The distinct set requires `"Nordwerk Systemtechnik"` ≠ `"Nordwerk Immobilien"`.
- **Empirical proof:** under first-token, ENT-004 unifies but **all four** distinct pairs collide (`brechtmann`/`müller`/`haltmayer`/`nordwerk`), breaking NG-18's no-collision half.
- Irreducible without arbitrarily stoplisting `"Systemtechnik"` yet keeping `"Immobilien"`/`"Transporte"`/`"Logistik"`/`"Metallbau"` — which the corpus header explicitly forbids ("Extend from real pilot data, never from imagination").

This is a **product/data decision**, not a code defect (same class as the stability-index stop condition). Per Part B stop rules, the invariant was **not** weakened, the corpus case was **not** skipped, and US-010 is **left uncommitted** (sound code + the red ENT-004 gate) as the blocker artifact.

### To unblock (your call — pick one, all are `de-entity-variants.yml` edits)
1. **Drop the bare `"Nordwerk"` form** from ENT-004 (keep `"Nordwerk Systemtechnik"`/`GmbH` variants) — bare single-token company names are inherently ambiguous; this is the most honest fix and consistent with ENT-003 (which has no bare form).
2. **Move `"Nordwerk"` to its own note** as a known-ambiguous short form that resolves only with more context.
3. If bare short-forms must unify with their full name, that needs a **customer-maintained alias table** (real pilot data, not a normaliser rule) — a new feature, out of E3's deterministic scope.

Once ENT-004 is resolved in the corpus, US-010 goes green with no code change (the normaliser already handles ENT-001/002/003/005 + every distinct pair).

## What is next (after the corpus decision)
- **US-010** — completes on the corpus fix (no code change expected).
- **US-011** (AF-306 wire transcript) — then complete **SF-3035 `assembleVerdict`** (wire AF-304/305/306) and **pull US-014 (AF-402 request-entry writer) forward** so NG-5 + the 10-turn wire-isolation acceptance gate run end-to-end.
- **US-012** (AF-307 rehydrate, never-guess).
- Sprint 2 exit gate: `wire-isolation`, `rehydration-never-guess`, `rules-latency` (already 0.3 ms), `degradation-recorded`.
- Deferred beyond this run: Sprint 3 (query/export/**US-031 dual-key unmask**), Sprint 4–5 (E7 — carries the NG-21 non-attributability gate + the real kg-gen stability measurement), Sprint 6 (E5 governed chat surface). AI Act Annex III exposure on E7 remains an open legal risk (escalate before GA).
