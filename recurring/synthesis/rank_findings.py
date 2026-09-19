"""SF-7064 — rank findings for the briefing headline: hours saved desc, ties by
cluster size. Deterministic (NG-15)."""
from __future__ import annotations

from ..types import RecurringWorkFinding


def rank_findings(findings: list[RecurringWorkFinding]) -> list[RecurringWorkFinding]:
    return sorted(
        findings,
        key=lambda f: (-f.hours_saved_high, -f.cluster_size, f.theme),
    )
