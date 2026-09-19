"""SF-7041 — resolve entities within a cluster by pseudonym.

The same pseudonym touched across conversations links as one entity (NG-10); the count
is the number of distinct conversations touching it. Different pseudonyms → distinct
entities. No original value is ever read — only the pseudonym token + its area.
"""
from __future__ import annotations

from ..types import Cluster, FeatureDoc, ResolvedCluster, ResolvedEntity


def group_by_pseudonym(clusters: list[Cluster], docs: list[FeatureDoc]) -> list[ResolvedCluster]:
    by_id = {d.entry_id: d for d in docs}
    resolved: list[ResolvedCluster] = []
    for cluster in clusters:
        # pseudonym -> (area, set of conversation ids)
        agg: dict[str, tuple[str, set[str]]] = {}
        for entry_id in cluster.members:
            doc = by_id.get(entry_id)
            if doc is None:
                continue
            areas = dict(doc.pseudonym_areas)
            for p in doc.pseudonyms:
                area, convs = agg.get(p, (areas.get(p, ""), set()))
                convs.add(doc.conversation_id)
                agg[p] = (area, convs)
        entities = tuple(
            ResolvedEntity(pseudonym=p, area=area, count=len(convs))
            for p, (area, convs) in sorted(agg.items())
        )
        resolved.append(
            ResolvedCluster(cluster_id=cluster.id, members=cluster.members, entities=entities, key_epoch=cluster.key_epoch)
        )
    return resolved
