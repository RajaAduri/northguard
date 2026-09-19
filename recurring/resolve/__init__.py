"""AF-704 — pseudonym-keyed entity/topic resolution (NG-10, R5). Never reads an original."""
from __future__ import annotations

from ..types import Cluster, FeatureDoc, ResolvedCluster
from .group_by_pseudonym import group_by_pseudonym
from .guard_key_epoch import guard_key_epoch
from .merge_pseudonym_across_cluster import merge_pseudonym_across_cluster

__all__ = ["resolve_entities", "group_by_pseudonym", "merge_pseudonym_across_cluster", "guard_key_epoch"]


def resolve_entities(clusters: list[Cluster], docs: list[FeatureDoc]) -> tuple[list[ResolvedCluster], bool]:
    guarded, spanned_rotation = guard_key_epoch(clusters, docs)
    resolved = [merge_pseudonym_across_cluster(rc) for rc in group_by_pseudonym(guarded, docs)]
    return resolved, spanned_rotation
