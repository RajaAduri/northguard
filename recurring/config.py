"""Pinned, deployment-fixed constants for E7 (NG-15: recorded in the audit record).

The embedding model is pinned to intfloat/multilingual-e5-base — chosen for permissive
licensing (MIT; Jina's v5 models are CC BY-NC and cannot ship in a commercial product)
and adequate German performance. The revision is pinned so re-runs are reproducible;
the resolved revision the loader actually fetched is what lands in the audit record.
"""
from __future__ import annotations

# Requested model + pinned revision. `EMBEDDING_MODEL_REVISION` is verified against the
# fetched model at load; the audit record stores the resolved `model_version`.
EMBEDDING_MODEL = "intfloat/multilingual-e5-base"
EMBEDDING_MODEL_REVISION = "main"  # deployment pins an exact commit hash; recorded at fetch
MODEL_VERSION = f"{EMBEDDING_MODEL}@{EMBEDDING_MODEL_REVISION}"

# Fixed cosine threshold for semantic clustering (NG-15). Tunable per deployment, but
# pinned + recorded — never sampled.
COSINE_THRESHOLD = 0.85

# Stage-1 MinHash-LSH parameters (pinned).
MINHASH_NUM_PERM = 128
MINHASH_SEED = 1
MINHASH_THRESHOLD = 0.7
