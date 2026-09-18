"""AF-702 — near-duplicate blocking (Stage 1, MinHash-LSH). Deterministic (NG-15)."""
from __future__ import annotations

from ..types import Bucket, FeatureDoc
from .compute_signatures import compute_signatures
from .emit_candidate_pairs import emit_candidate_pairs
from .lsh_bucketize import lsh_bucketize

__all__ = ["block_near_duplicates", "compute_signatures", "lsh_bucketize", "emit_candidate_pairs"]


def block_near_duplicates(docs: list[FeatureDoc], num_perm: int = 128, seed: int = 1, threshold: float = 0.7) -> set[tuple[str, str]]:
    sigs = compute_signatures(docs, num_perm=num_perm, seed=seed)
    buckets: list[Bucket] = lsh_bucketize(sigs, threshold=threshold)
    return emit_candidate_pairs(buckets)
