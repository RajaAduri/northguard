# NorthGuard — Decomposition Handoff

Produced by running the dev-blueprint (engineering-prd) methodology against
`northguard-slc-pack.md` + the design PDFs + the prototype (`kg_sidecar.py`,
`northguard-demo.jsx`). Everything lives under `inputs/northguard/`; nothing was
written to the dev-blueprint root.

## Artifact set
| File | Phase | Purpose |
|------|-------|---------|
| `DECISION-REGISTER.md` | 0 | Locked stack, D1–D5, refinements R1–R6, epic renumber, cuts |
| `AGENT-RULES.md` | — | Binding invariants NG-1…NG-16 (incl. NG-10 pseudonyms) + CI gate |
| `PRD.md` | 1 | Vision, personas, 30 user stories, NFRs, risks, cuts, hierarchy summary |
| `specs/EP-01…EP-08/` | 2 | 5-level hierarchy: EPIC.md + APP-FUNCTIONS.md (SW-Function signatures, test cases, deps) |
| `FUNCTION-CHAINS.md` | 3 | Runtime chains, bridges B1–B5, end-to-end flow |
| `manifests/traceability-matrix.md` | 6 | SBOM: US→FT→AF→SF→file→test for all 30 stories |
| `manifests/US-*.manifest.json` | 5 | Change manifests with zero-question agent prompts (Sprint 1–2 critical path + US-027) |
| `manifests/sprint-*.manifest.json` | 5 | Sprint sequencing (all 5 sprints) |
| `manifests/checksums.json` | 6 | SHA-256 baseline (53 files) |
| `SPRINT-PLAN.md` | — | Build order + dependency notes |
| `CLAUDE.md` | 7 | Project instructions for build sessions |
| `.claude/` + `scripts/` | 7 | Manifest-enforcement hooks + verify/checksum scripts |
| `lexicons/protected-areas-de.yml` | 10 | DE/EN detection lexicon (E3 rules) + retrieval-aware naming |
| `lexicons/de-entity-variants.yml` | — | German entity-name normalisation corpus — the E7 acceptance fixture (FR-24, NG-18) |

## How the three constraints were met
1. **Architecture-independent core only.** Decomposed to file level: E2, E3, E4,
   E6, E7. Deferred behind contracts: E1 (Gateway → `InterceptionAdapter`
   interface, specified precisely in `specs/EP-01-…/EPIC.md`), E5 (Chat Surface →
   rendering shell over the E3 core), E8 (Operations). The redaction/rehydration
   **logic** was pulled out of E5 into the E3 core as a pure, stateless module so
   the wire-isolation correctness test is exercised now, not deferred.
2. **E6's hardest component is its own epic.** FR-21 recurring-work detection is
   **E7 — Recurring-Work Intelligence**, decomposed as real machinery: a two-stage
   deterministic similarity pipeline (MinHash-LSH → pinned local embeddings),
   pseudonym-based cross-conversation entity resolution (NG-10), temporal pattern
   detection, and hours-saved/artefact synthesis. Not a report generator.
3. **SLC, not MVP.** Every decomposed feature ships production-complete. Three
   cuts were made rather than shipping partial (PRD §11 / Decision Register §7):
   no original-entity naming in the briefing (pseudonymised clusters instead),
   no file/image inspection, no per-prompt approval workflow.

## Refinements incorporated from scoping
- Transcript engine is pure/stateless; **no server-side mapping store** (NG-14, R1).
- E7 uses a **pinned deterministic embedding model** (not MinHash-only), because same-document-different-words is the headline finding (R2/R3, NG-15).
- Cross-conversation resolution via **keyed per-entity pseudonyms** with `keyEpoch` rotation semantics; full-text retention never default (R4/R5, NG-10).
- **Key separation (NG-17, R7, FR-23):** the pseudonym key never shares storage/backups with the ledger and never appears in an export — because HMAC over low-entropy names is dictionary-attackable if key and ledger co-locate. Written as a rule now, before E8.
- **Key rotation is compromise-response, not scheduled hygiene (R5):** it permanently blanks recurring-work history; the analytics cost is documented in E8 deployment guidance and surfaced via the spanning-briefing coverage caveat — not left for a confused quality lead.
- **Evidence export shows pseudonyms, not entity names (FR-25, R8):** a stated design position, gated by `assertExportPrivacy` (SF-4056).
- **German normalisation is corpus-validated (FR-24, NG-18):** `lexicons/de-entity-variants.yml` is a hard E7 acceptance gate — legal forms, umlaut/transliteration, casing, dropped-legal-form; silent under-clustering is a defect, not an empty week.

## Known open items (not blockers)
- **Interception decision** (gateway vs extension) unblocks E1/E5/E8. Core is ready either way.
- **Pinned embedding model choice** — locked as "pinned local, version-recorded, on backstop host"; exact model to select at E7 build (fits NFR-04).
- Per-story manifests for Sprints 3–5 generate from the specs on demand (template: any `US-*.manifest.json`).
- Windows note: run `scripts/generate_checksums.py` with `PYTHONIOENCODING=utf-8` to avoid the cosmetic cp1252 emoji crash.

## First move
`SPRINT-PLAN.md` → Sprint 1 → `manifests/US-013.manifest.json`. Scaffold `core/`
(TS strict + Vitest) and `recurring/` (pytest), then run the session per `CLAUDE.md`.

## Awaiting research (gates E1/E5/E8 only — the core is not blocked)
Send the interception-architecture reports (gateway vs browser extension) when they
land; they unblock the deferred epics. Sprint 1 is clear to run now.
