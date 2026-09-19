"""SF-7061 — how much of a cluster is redundant repetition.

N members doing the same work → N-1 redundant instances (the first is the "real" work).
A single request is not a finding (0 redundant). Deterministic.
"""
from __future__ import annotations

from ..types import DuplicatedEffort, ResolvedCluster


def estimate_duplicated_effort(rc: ResolvedCluster) -> DuplicatedEffort:
    size = len(rc.members)
    return DuplicatedEffort(cluster_size=size, redundant_instances=max(0, size - 1))
