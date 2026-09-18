"""SF-7022 — banded LSH over MinHash signatures.

Documents that share any band land in the same bucket, so high-Jaccard (near-verbatim)
docs are blocked together while unrelated docs are not. The band count is chosen
deterministically from the threshold, so buckets are stable across runs (NG-15).
"""
from __future__ import annotations

from collections import defaultdict

from ..types import Bucket, MinHash


def _bands_for(num_perm: int, threshold: float) -> tuple[int, int]:
    # pick (b bands, r rows) minimising |threshold - (1/b)**(1/r)|, with b*r <= num_perm
    best: tuple[float, int, int] | None = None
    for r in range(1, num_perm + 1):
        b = num_perm // r
        if b < 1:
            break
        est = (1.0 / b) ** (1.0 / r)
        err = abs(est - threshold)
        if best is None or err < best[0]:
            best = (err, b, r)
    assert best is not None
    return best[1], best[2]


def lsh_bucketize(sigs: dict[str, MinHash], threshold: float = 0.7) -> list[Bucket]:
    if not sigs:
        return []
    num_perm = len(next(iter(sigs.values())))
    b, r = _bands_for(num_perm, threshold)
    bands: dict[tuple[int, MinHash], set[str]] = defaultdict(set)
    for entry_id, sig in sorted(sigs.items()):
        for i in range(b):
            band = sig[i * r : (i + 1) * r]
            bands[(i, band)].add(entry_id)
    buckets: list[Bucket] = []
    seen: set[Bucket] = set()
    for members in bands.values():
        if len(members) >= 2:
            key: Bucket = tuple(sorted(members))
            if key not in seen:
                seen.add(key)
                buckets.append(key)
    return sorted(buckets)
