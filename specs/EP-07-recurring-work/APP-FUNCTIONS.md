# EP-07 · App Functions & SW-Function Signatures

Language: Python 3.11. Files under `recurring/`. Each SW Function = one module +
one `test_*.py`. **No code path reads an original entity value** — only redacted
text and pseudonyms from the ledger (NG-10). All stages deterministic (NG-15).

**Core types (`recurring/types.py`):**
```python
@dataclass(frozen=True)
class FeatureDoc:
    entry_id: str
    conversation_id: str
    ts: str
    redacted_text: str          # from ledger (never original)
    pseudonyms: tuple[str, ...] # HMAC tokens present in this prompt
    key_epoch: int
    shingles: frozenset[int]    # hashed token shingles

@dataclass(frozen=True)
class Cluster:
    id: str                     # deterministic (sorted member hash)
    members: tuple[str, ...]    # entry_ids
    key_epoch: int
    model_version: str          # provenance (NG-15)
    threshold: float
```

---

## AF-701: extractContentFeatures
**Feature:** FT-7.1 | **Entry:** `recurring/features/__init__.py`

**I/O Contract**
- Input: `window: LedgerWindow` (from E4 query, management/export projection — redacted + pseudonyms)
- Output: `list[FeatureDoc]`
- Side effects: none (reads the ledger via the query contract).

**Business Rules**
1. Only redacted text + pseudonyms are read; assert no original value present (NG-10).
2. Shingling is deterministic (fixed k). 3. Pseudonyms attached per doc for AF-704.

```python
# SF-7011  features/load_redacted_corpus.py
def load_redacted_corpus(window: LedgerWindow) -> list[RawDoc]: ...
# 1. GIVEN a ledger window THEN returns redacted text + pseudonyms per request entry
# 2. GIVEN an entry with a raw-text field (opt-in disabled) THEN raises PrivacyViolation (NG-10)
# 3. GIVEN governance/ops entries THEN skipped (only requests)

# SF-7012  features/tokenize_and_shingle.py
def tokenize_and_shingle(text: str, k: int = 5) -> frozenset[int]: ...
# 1. GIVEN text THEN returns hashed k-shingles (deterministic)
# 2. GIVEN same text twice THEN identical shingle set
# 3. GIVEN placeholders THEN treated as single tokens (not split)

# SF-7013  features/attach_pseudonyms.py
def attach_pseudonyms(doc: RawDoc) -> FeatureDoc: ...
# 1. GIVEN a doc THEN pseudonyms + key_epoch attached
# 2. GIVEN no entities THEN empty pseudonym tuple
# 3. GIVEN output THEN contains no original value (type-enforced)
```

---

## AF-702: blockNearDuplicates  *(Stage 1 — MinHash-LSH)*
**Feature:** FT-7.2 | **Entry:** `recurring/minhash/__init__.py`

```python
# SF-7021  minhash/compute_signatures.py
def compute_signatures(docs: list[FeatureDoc], num_perm: int = 128, seed: int = 1) -> dict[str, MinHash]: ...
# 1. GIVEN docs THEN a fixed-permutation MinHash per doc (seed pinned)
# 2. GIVEN same doc THEN identical signature every run (NG-15)
# 3. GIVEN empty shingles THEN a defined empty signature

# SF-7022  minhash/lsh_bucketize.py
def lsh_bucketize(sigs: dict[str, MinHash], threshold: float = 0.7) -> list[Bucket]: ...
# 1. GIVEN near-verbatim docs THEN they share a bucket
# 2. GIVEN unrelated docs THEN separate buckets
# 3. GIVEN fixed threshold THEN buckets are deterministic

# SF-7023  minhash/emit_candidate_pairs.py
def emit_candidate_pairs(buckets: list[Bucket]) -> set[tuple[str, str]]: ...
# 1. GIVEN a bucket of 3 THEN 3 candidate pairs
# 2. GIVEN singleton buckets THEN no pairs
# 3. GIVEN output THEN sorted/stable (determinism)
```

---

## AF-703: clusterSemantic  *(Stage 2 — pinned local embeddings)*
**Feature:** FT-7.3 | **Entry:** `recurring/semantic/__init__.py`

**Business Rules**
1. Embedding model is pinned (version in config), runs locally on the backstop host,
deterministic inference (no sampling). 2. Vectors cached by `sha256(redacted_text)`
so a re-run reuses them. 3. Fixed cosine threshold. 4. Model version + threshold
recorded on every cluster for the audit record (NG-15).

```python
# SF-7031  semantic/embed_documents.py
def embed_documents(docs: list[FeatureDoc], model: PinnedEmbedder) -> dict[str, Vector]: ...
# 1. GIVEN a doc THEN a cached vector keyed by text hash
# 2. GIVEN the same text twice THEN identical vector (pinned model, cache)
# 3. GIVEN model version THEN recorded alongside vectors (provenance)

# SF-7032  semantic/cosine_within_threshold.py
def cosine_within_threshold(a: Vector, b: Vector, threshold: float) -> bool: ...
# 1. GIVEN two paraphrases of the same doc THEN cosine >= threshold → True
# 2. GIVEN unrelated docs THEN False
# 3. GIVEN identical vectors THEN True

# SF-7033  semantic/connected_components_cluster.py
def connected_components_cluster(pairs: set[tuple[str,str]], vecs, threshold: float) -> list[Cluster]: ...
# 1. GIVEN candidate pairs confirmed by cosine THEN connected components form clusters
# 2. GIVEN a deterministic cluster id (sorted member hash) THEN stable across runs (NG-15)
# 3. GIVEN a paraphrase pair missed by MinHash THEN still clustered if within cosine threshold (headline case)

# SF-7034  semantic/record_model_provenance.py
def record_model_provenance(clusters: list[Cluster], model_version: str, threshold: float) -> list[Cluster]: ...
# 1. GIVEN clusters THEN each carries model_version + threshold
# 2. GIVEN two runs same version THEN identical provenance
# 3. GIVEN a model version bump THEN recorded (results comparable only within a version)
```

---

## AF-704: resolveEntities  *(pseudonym-keyed — NG-10, R5)*
**Feature:** FT-7.4 | **Entry:** `recurring/resolve/__init__.py`

```python
# SF-7041  resolve/group_by_pseudonym.py
def group_by_pseudonym(clusters: list[Cluster], docs: list[FeatureDoc]) -> list[ResolvedCluster]: ...
# 1. GIVEN the same pseudonym across conversations THEN linked as one entity
# 2. GIVEN two different suppliers THEN distinct groups
# 3. GIVEN NO original value read THEN enforced (NG-10)

# SF-7042  resolve/merge_pseudonym_across_cluster.py
def merge_pseudonym_across_cluster(rc: ResolvedCluster) -> ResolvedCluster: ...
# 1. GIVEN a cluster where 4 people touched the same supplier pseudonym THEN one resolved entity, count 4
# 2. GIVEN mixed pseudonyms THEN kept distinct within the cluster
# 3. GIVEN a cluster THEN it never names an original value — only the pseudonymised entity + its area

# SF-7043  resolve/guard_key_epoch.py
def guard_key_epoch(clusters: list[Cluster]) -> list[Cluster]: ...
# 1. GIVEN members from two epochs THEN split so clustering never crosses an epoch (R5)
# 2. GIVEN a window spanning a rotation THEN a coverage caveat flag is set
# 3. GIVEN one epoch THEN unchanged
```

---

## AF-705: detectTemporalPatterns
**Feature:** FT-7.5 | **Entry:** `recurring/temporal/__init__.py`

```python
# SF-7051  temporal/bucket_by_time.py
def bucket_by_time(rc: ResolvedCluster) -> list[TimeBucket]: ...
# 1. GIVEN cluster members THEN counts per day/week
# 2. GIVEN sparse data THEN buckets with zeros preserved
# 3. GIVEN deterministic bucketing THEN stable

# SF-7052  temporal/classify_trend.py
def classify_trend(buckets: list[TimeBucket]) -> str: ...
# 1. GIVEN rising counts THEN 'rising'
# 2. GIVEN flat THEN 'steady'
# 3. GIVEN falling THEN 'falling'

# SF-7053  temporal/detect_cadence.py
def detect_cadence(buckets: list[TimeBucket]) -> Cadence | None: ...
# 1. GIVEN a Friday spike each week THEN weekly-Friday cadence detected (the CI pattern)
# 2. GIVEN no periodicity THEN None
# 3. GIVEN deterministic detection THEN stable

# SF-7054  temporal/detect_cessation.py
def detect_cessation(buckets: list[TimeBucket]) -> Cessation | None: ...
# 1. GIVEN activity that stops mid-window THEN "no request since <day> — likely solved"
# 2. GIVEN ongoing activity THEN None
# 3. GIVEN a single-day cluster THEN None (not enough to call cessation)
```

---

## AF-706: synthesizeRecurringWork
**Feature:** FT-7.6 | **Entry:** `recurring/synthesis/__init__.py`
**BRIDGE:** output consumed by E6 `AF-602` (briefing). Reported in hours saved.

```python
# SF-7061  synthesis/estimate_duplicated_effort.py
def estimate_duplicated_effort(rc: ResolvedCluster) -> DuplicatedEffort: ...
# 1. GIVEN 4 people summarising the same doc THEN 3 redundant instances
# 2. GIVEN a single request THEN zero duplication (not a finding)
# 3. GIVEN counts THEN deterministic

# SF-7062  synthesis/estimate_hours_saved.py
def estimate_hours_saved(eff: DuplicatedEffort) -> float: ...
# 1. GIVEN 3 redundant doc-summaries THEN hours-saved estimate (per-instance minutes × redundancy)
# 2. GIVEN configurable per-task minutes THEN applied
# 3. GIVEN zero duplication THEN 0.0

# SF-7063  synthesis/name_removing_artefact.py
def name_removing_artefact(rc: ResolvedCluster, cadence: Cadence | None) -> Artefact: ...
# 1. GIVEN duplicated supplier-doc reads THEN "a stored extract per contract"
# 2. GIVEN near-verbatim audit-phrasing asks THEN "a phrasing kit / Satzbaukasten"
# 3. GIVEN a solved cadence THEN artefact notes it's likely already resolved

# SF-7064  synthesis/rank_findings.py
def rank_findings(findings: list[RecurringWorkFinding]) -> list[RecurringWorkFinding]: ...
# 1. GIVEN findings THEN ranked by hours saved desc (briefing headline first)
# 2. GIVEN ties THEN by cluster size
# 3. GIVEN determinism THEN identical order across runs (NG-15)
```

**Chain order:** extractContentFeatures → blockNearDuplicates → clusterSemantic → resolveEntities → detectTemporalPatterns → synthesizeRecurringWork → (E6 briefing).
