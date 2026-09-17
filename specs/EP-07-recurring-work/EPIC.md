# EP-07: Recurring-Work Intelligence
**Status:** DECOMPOSED — the deepest component in the build. Real machinery, not a report generator.

## Business Context
This is the product's only *value-creating* rather than loss-preventing output —
and the strongest line in a sales conversation. It answers: where is the team doing
the same work more than once, and what artefact would remove it? Reported in **hours
saved**, not violations caught. It is hard because it must find duplicated effort —
including *the same document asked about in completely different words* — while
operating strictly inside the privacy model: the ledger holds only redacted text +
one-way pseudonyms; original entity values are never stored (NG-10).

## The two-stage deterministic similarity pipeline (R2, NG-15)
Reproducibility is a hard constraint (a briefing that says "4 people did duplicate
work" must be the same next run). It is met by **determinism at every stage**, not
by avoiding embeddings:

1. **Stage 1 — MinHash-LSH** over token shingles of the redacted text. Cheap
   near-verbatim blocking; deterministic given fixed shingle size + permutations.
2. **Stage 2 — pinned local embedding model** (fixed version, cached vectors,
   fixed cosine threshold, deterministic/no-sampling inference, runs on the
   backstop host). Catches the headline case: same document, different words.
   The model version + threshold are recorded in the audit record, exactly as
   kg-gen records its model + SI.

Entity resolution runs on **pseudonyms** (NG-10). Clustering **never crosses a
`keyEpoch`** (R5); a window spanning a rotation carries a coverage caveat.

## Scope
- **In scope:** content-feature extraction over the redacted+pseudonymised corpus,
  MinHash-LSH near-duplicate blocking, semantic clustering via pinned embeddings,
  pseudonym-based entity/topic resolution, temporal pattern detection, hours-saved
  + named-artefact synthesis.
- **Out of scope:** reading any original entity value (NG-10); embeddings sent off
  host (NFR-05); non-deterministic inference (NG-15); the briefing prose itself
  (E6 `AF-602` consumes E7 output).

## Features
| ID | Feature | Stories | App Functions |
|----|---------|---------|---------------|
| FT-7.1 | Content Feature Extraction | US-025 | AF-701 |
| FT-7.2 | Near-Duplicate Blocking (MinHash-LSH) | US-026 | AF-702 |
| FT-7.3 | Semantic Clustering (pinned embeddings) | US-027 | AF-703 |
| FT-7.4 | Pseudonym Entity/Topic Resolution | US-028 | AF-704 |
| FT-7.5 | Temporal Pattern Detection | US-029 | AF-705 |
| FT-7.6 | Hours-Saved & Artefact Synthesis | US-030 | AF-706 |

## Normalisation is the quiet failure mode (FR-24, NG-18)
Entity resolution rests on `normalizeEntityValue` (SF-3051, E3) folding German
surface variants to one pseudonym: `Brechtmann GmbH`, `Brechtmann`,
`Brechtmann GmbH & Co. KG`, `brechtmann gmbh`, and `Müller`/`Mueller` must each
collapse correctly. **If normalisation is too loose, clustering finds nothing —
and "no duplicated work this week" looks identical to a broken normaliser.** This
is a defect that hides as an empty result, so it is caught by acceptance, not left
to be discovered. E7 acceptance therefore **requires** the maintained corpus
`lexicons/de-entity-variants.yml`: every variant group must collapse to one
pseudonym and distinct entities must never collide. Legal forms (GmbH/AG/KG/mbH/
e.K./"GmbH & Co. KG"), umlaut/transliteration variance, casing, and dropped-legal-
form casual reference are all in the corpus.

## Success Metrics / Acceptance
| Metric | Target |
|--------|--------|
| Same-document-different-words recall | Catches the headline case Stage 1 misses |
| Determinism (same window, two runs) | Identical cluster ids (NG-15) |
| Original values read from storage | 0 (NG-10) |
| Cross-epoch cluster leakage | 0 (R5) |
| **German entity-variant corpus** | **Every group → one pseudonym; zero cross-group collision (FR-24, NG-18) — a hard acceptance gate** |
| Key material in any E7 output/log | 0 (NG-17 — E7 reads pseudonyms, never the key) |

## Language
Python 3.11 (`recurring/` package), colocated with the embedding model on the
backstop host. Reads the ledger over the same E4 query contract (redacted +
pseudonyms only). Output consumed by E6 `AF-602` over a localhost interface.
