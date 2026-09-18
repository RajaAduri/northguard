"""SF-7023 — turn buckets into candidate pairs (Stage-1 output for Stage-2 confirmation).

Every distinct pair within a bucket is emitted; singleton buckets yield none. The
result is a set of ordered (a, b) pairs — stable/deterministic.
"""
from __future__ import annotations

from ..types import Bucket


def emit_candidate_pairs(buckets: list[Bucket]) -> set[tuple[str, str]]:
    pairs: set[tuple[str, str]] = set()
    for members in buckets:
        m = sorted(members)
        for i in range(len(m)):
            for j in range(i + 1, len(m)):
                pairs.add((m[i], m[j]))
    return pairs
