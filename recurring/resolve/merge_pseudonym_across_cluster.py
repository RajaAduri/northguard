"""SF-7042 — collapse duplicate pseudonym entities within a resolved cluster.

If the same supplier pseudonym appears in several sub-entries, they merge into one
resolved entity whose count sums the distinct touches; distinct pseudonyms stay
distinct. The result never names an original value — only the pseudonymised entity + area.
"""
from __future__ import annotations

from ..types import ResolvedCluster, ResolvedEntity


def merge_pseudonym_across_cluster(rc: ResolvedCluster) -> ResolvedCluster:
    merged: dict[str, ResolvedEntity] = {}
    for e in rc.entities:
        existing = merged.get(e.pseudonym)
        if existing is None:
            merged[e.pseudonym] = e
        else:
            merged[e.pseudonym] = ResolvedEntity(
                pseudonym=e.pseudonym,
                area=existing.area or e.area,
                count=existing.count + e.count,
            )
    entities = tuple(sorted(merged.values(), key=lambda x: x.pseudonym))
    return ResolvedCluster(cluster_id=rc.cluster_id, members=rc.members, entities=entities, key_epoch=rc.key_epoch)
