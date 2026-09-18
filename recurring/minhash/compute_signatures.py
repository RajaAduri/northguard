"""SF-7021 — fixed-permutation MinHash signatures.

Deterministic (NG-15): the permutation family is derived from a pinned seed, so the
same document yields the same signature on every run and process. An empty shingle set
gets a defined all-MAX signature.
"""
from __future__ import annotations

import random
from collections.abc import Sequence

from ..types import FeatureDoc, MinHash

_PRIME = (1 << 61) - 1
_MAX = _PRIME  # the "empty" min value


def _permutations(num_perm: int, seed: int) -> list[tuple[int, int]]:
    rng = random.Random(seed)
    return [(rng.randrange(1, _PRIME), rng.randrange(0, _PRIME)) for _ in range(num_perm)]


def _signature(shingles: frozenset[int], perms: Sequence[tuple[int, int]]) -> MinHash:
    if not shingles:
        return tuple(_MAX for _ in perms)
    return tuple(min((a * s + b) % _PRIME for s in shingles) for a, b in perms)


def compute_signatures(docs: list[FeatureDoc], num_perm: int = 128, seed: int = 1) -> dict[str, MinHash]:
    perms = _permutations(num_perm, seed)
    return {d.entry_id: _signature(d.shingles, perms) for d in docs}
