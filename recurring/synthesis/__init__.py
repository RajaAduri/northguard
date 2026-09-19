"""AF-706 — hours-saved + artefact synthesis (the briefing headline).

Reported in hours saved, non-attributable by construction (NG-21). Output consumed by
E6 AF-602 over a localhost interface (bridge B4).
"""
from __future__ import annotations

from ..types import Cadence, Cessation, RecurringWorkFinding, ResolvedCluster
from .assert_non_attributable import assert_non_attributable
from .estimate_duplicated_effort import estimate_duplicated_effort
from .estimate_hours_saved import estimate_hours_saved
from .name_removing_artefact import name_removing_artefact
from .rank_findings import rank_findings

__all__ = [
    "synthesize_recurring_work",
    "estimate_duplicated_effort",
    "estimate_hours_saved",
    "name_removing_artefact",
    "rank_findings",
    "assert_non_attributable",
]

_LOW_MIN, _HIGH_MIN = 15.0, 20.0


def synthesize_recurring_work(
    clusters: list[ResolvedCluster],
    temporal: dict[str, tuple[Cadence | None, Cessation | None]] | None = None,
) -> list[RecurringWorkFinding]:
    temporal = temporal or {}
    findings: list[RecurringWorkFinding] = []
    for rc in clusters:
        eff = estimate_duplicated_effort(rc)
        if eff.redundant_instances <= 0:
            continue  # not a finding
        cadence, cessation = temporal.get(rc.cluster_id, (None, None))
        artefact = name_removing_artefact(rc, cadence, cessation)
        top_area = max(rc.entities, key=lambda e: e.count).area if rc.entities else ""
        findings.append(
            RecurringWorkFinding(
                theme=f"wiederkehrende Arbeit im Bereich {top_area}" if top_area else "wiederkehrende Arbeit",
                area=top_area,
                cluster_size=eff.cluster_size,
                hours_saved_low=estimate_hours_saved(eff, _LOW_MIN),
                hours_saved_high=estimate_hours_saved(eff, _HIGH_MIN),
                artefact=artefact.description,
                cadence=cadence.label if cadence else None,
            )
        )
    ranked = rank_findings(findings)
    assert_non_attributable(ranked)  # NG-21 gate, before findings leave E7
    return ranked
