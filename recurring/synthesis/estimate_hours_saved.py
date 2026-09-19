"""SF-7062 — hours saved = redundant instances × per-task minutes ÷ 60.

Per-task minutes is configurable (the design reckons 15–20 min/request). Zero
duplication → 0.0. This is the point estimate; the briefing shows it as a range.
"""
from __future__ import annotations

from ..types import DuplicatedEffort

DEFAULT_MINUTES_PER_TASK = 17.5


def estimate_hours_saved(eff: DuplicatedEffort, minutes_per_task: float = DEFAULT_MINUTES_PER_TASK) -> float:
    if eff.redundant_instances <= 0:
        return 0.0
    return round(eff.redundant_instances * minutes_per_task / 60.0, 2)
