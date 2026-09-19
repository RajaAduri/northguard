"""SF-7033 — form clusters from confirmed similarity edges.

Edges come from two sources: the Stage-1 MinHash candidate pairs (near-verbatim) AND
all vector pairs whose cosine is within the threshold (semantic). The second source is
what catches the headline case — the same document phrased differently that MinHash
missed. Connected components over the union become clusters. Cluster ids are a
deterministic sorted-member hash (NG-15).
"""
from __future__ import annotations

import hashlib
from itertools import combinations

from ..types import Cluster, Vector
from .cosine_within_threshold import cosine_within_threshold


def _cluster_id(members: tuple[str, ...]) -> str:
    return hashlib.sha256("\n".join(sorted(members)).encode("utf-8")).hexdigest()[:16]


def connected_components_cluster(
    pairs: set[tuple[str, str]],
    vecs: dict[str, Vector],
    threshold: float,
) -> list[Cluster]:
    adjacency: dict[str, set[str]] = {eid: set() for eid in vecs}

    def link(a: str, b: str) -> None:
        if a in adjacency and b in adjacency:
            adjacency[a].add(b)
            adjacency[b].add(a)

    # Stage-1 candidates, confirmed by cosine.
    for a, b in pairs:
        if a in vecs and b in vecs and cosine_within_threshold(vecs[a], vecs[b], threshold):
            link(a, b)
    # Semantic edges MinHash may have missed (the headline case).
    for a, b in combinations(sorted(vecs), 2):
        if cosine_within_threshold(vecs[a], vecs[b], threshold):
            link(a, b)

    seen: set[str] = set()
    clusters: list[Cluster] = []
    for start in sorted(adjacency):
        if start in seen or not adjacency[start]:
            continue
        # BFS the component
        stack = [start]
        members: set[str] = set()
        while stack:
            node = stack.pop()
            if node in members:
                continue
            members.add(node)
            seen.add(node)
            stack.extend(adjacency[node] - members)
        if len(members) >= 2:
            m = tuple(sorted(members))
            clusters.append(Cluster(id=_cluster_id(m), members=m, key_epoch=0, model_version="", threshold=threshold))
    return sorted(clusters, key=lambda c: c.id)
