# NorthGuard — Decomposition Handoff

Produced by running the dev-blueprint (engineering-prd) methodology against
`northguard-slc-pack.md` + the design PDFs + the prototype (`kg_sidecar.py`,
`northguard-demo.jsx`). Everything lives under `inputs/northguard/`; nothing was
written to the dev-blueprint root.

> **Amended 2026-09-17 (architecture research).** The interception question is
> resolved — a **browser extension (block-and-warn) + a governed chat surface (E5,
> the full experience)**. Applied before any code: **E5 is now decomposed to file
> level** (AF-501…508); **NG-19** (actor pseudonymisation, lands in US-013), **NG-20**
> (dual-key unmask, E4 `AF-408`/US-031), **NG-21** (E7 non-attributability), the
> **E3 detection rebalance** (model is the detector; lexicons + model before regex
> breadth), and the **AI Act exposure on E7** recorded as an **open legal risk** (not
> resolved in code). Full detail in DECISION-REGISTER §8; amendment log there.

## Artifact set
| File | Phase | Purpose |
|------|-------|---------|
| `DECISION-REGISTER.md` | 0 | Locked stack, D1–D5, refinements R1–R6, epic renumber, cuts |
| `AGENT-RULES.md` | — | Binding invariants NG-1…NG-21 (incl. NG-10 pseudonyms, NG-19 actor pseudonymisation, NG-20 dual-key unmask, NG-21 E7 non-attributability) + CI gate |
| `PRD.md` | 1 | Vision, personas, 30 user stories, NFRs, risks, cuts, hierarchy summary |
| `specs/EP-01…EP-08/` | 2 | 5-level hierarchy: EPIC.md + APP-FUNCTIONS.md (SW-Function signatures, test cases, deps). **E5 now decomposed (AF-501…508); E4 adds AF-408 dual-key unmask.** |
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
1. **Architecture-independent core + the governed surface.** Decomposed to file
   level: E2, E3, E4, **E5 (now — the governed chat surface)**, E6, E7. Still
   deferred behind contracts: **E1 (browser extension, block-and-warn — decided but
   decomposed after E5)** and E8 (Operations). The redaction/rehydration **logic**
   remains in the E3 core as a pure, stateless module so the wire-isolation
   correctness test is exercised now; E5 renders that solved core (§8 A1).
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

## Known open items
- **AI Act exposure on E7 (Annex III / Art. 6(3)) — OPEN LEGAL RISK, not resolved in
  code (§8 A5).** E7 constrained to be non-attributable (NG-21); escalate to counsel
  before GA; no AI-Act effective-date stated anywhere until verified.
- **Interception decision — RESOLVED (§8 A1):** browser extension (block-and-warn) +
  E5 governed chat surface. E5 is decomposed; the E1 extension decomposes after E5.
- **Dual-key unmask secret store + role binding** — interface specified in E4
  (AF-408); physical storage is E8 (deferred).
- **Pinned embedding model choice** — locked as "pinned local, version-recorded, on backstop host"; exact model to select at E7 build (fits NFR-04).
- Per-story manifests for Sprints 3–6 generate from the specs on demand (templates:
  `US-013`, `US-031`, `US-032`, or any existing `US-*.manifest.json`).
- Windows note: run `scripts/generate_checksums.py` with `PYTHONIOENCODING=utf-8` to avoid the cosmetic cp1252 emoji crash.

## First move
`SPRINT-PLAN.md` → Sprint 1 → `manifests/US-013.manifest.json` (now carries the
NG-19 actor-pseudonym guard). Scaffold `core/` (TS strict + Vitest) and `recurring/`
(pytest), then run the session per `CLAUDE.md`. E5 (`web/`, React SPA) is Sprint 6.

## Architecture research — RECEIVED and APPLIED (2026-09-17)
The three deep-research reports (Gemini, ChatGPT, Perplexity) landed and their
amendments (A1–A6) are applied across the decomposition — see DECISION-REGISTER §8
and its amendment log. Nothing about the interception surface now blocks any epic.
