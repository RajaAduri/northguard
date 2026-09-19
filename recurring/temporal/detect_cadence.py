"""SF-7053 — detect a weekly cadence (e.g. the Friday-CI pattern).

If one weekday carries activity across multiple weeks and accounts for the large
majority of the total, that is a weekly cadence on that weekday. No periodicity → None.
Deterministic.
"""
from __future__ import annotations

from ..types import Cadence, TimeBucket

_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def detect_cadence(buckets: list[TimeBucket]) -> Cadence | None:
    total = sum(b.count for b in buckets)
    if total == 0:
        return None
    weeks_active: dict[int, set[str]] = {}
    count_by_weekday: dict[int, int] = {}
    for b in buckets:
        if b.count > 0:
            weeks_active.setdefault(b.weekday, set()).add(b.period)
            count_by_weekday[b.weekday] = count_by_weekday.get(b.weekday, 0) + b.count
    if not count_by_weekday:
        return None
    top_wd = max(count_by_weekday, key=lambda wd: count_by_weekday[wd])
    # weekly if the top weekday recurred on >= 2 distinct dates and dominates the volume
    recurred = len(weeks_active.get(top_wd, set())) >= 2
    dominates = count_by_weekday[top_wd] >= 0.6 * total
    if recurred and dominates:
        return Cadence(kind="weekly", weekday=top_wd, label=f"weekly-{_WEEKDAYS[top_wd]}")
    return None
