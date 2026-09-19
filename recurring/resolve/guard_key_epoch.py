"""SF-7043 — clustering never crosses a key epoch (R5).

A key rotation permanently blanks recurring-work history across the boundary. If a
cluster's members span more than one keyEpoch, it is split so each resulting cluster is
single-epoch. A window that spanned a rotation is reported via `spanned_rotation` so the
briefing can carry a coverage caveat.

Note: the spec signature is guard_key_epoch(clusters); per-member epochs are not on the
Cluster, so `docs` is taken too (the deviation is recorded in SESSION-LOG).
"""
from __future__ import annotations

import hashlib

from ..types import Cluster, FeatureDoc


def _cluster_id(members: tuple[str, ...]) -> str:
    return hashlib.sha256("\n".join(sorted(members)).encode("utf-8")).hexdigest()[:16]


def guard_key_epoch(clusters: list[Cluster], docs: list[FeatureDoc]) -> tuple[list[Cluster], bool]:
    epoch_of = {d.entry_id: d.key_epoch for d in docs}
    out: list[Cluster] = []
    spanned_rotation = False
    for cluster in clusters:
        by_epoch: dict[int, list[str]] = {}
        for entry_id in cluster.members:
            e = epoch_of.get(entry_id, cluster.key_epoch)
            by_epoch.setdefault(e, []).append(entry_id)
        if len(by_epoch) <= 1:
            out.append(cluster)
            continue
        spanned_rotation = True
        for epoch, members in sorted(by_epoch.items()):
            m = tuple(sorted(members))
            if len(m) < 2:
                continue  # a lone member is no longer a cluster
            out.append(
                Cluster(id=_cluster_id(m), members=m, key_epoch=epoch, model_version=cluster.model_version, threshold=cluster.threshold)
            )
    return sorted(out, key=lambda c: c.id), spanned_rotation
