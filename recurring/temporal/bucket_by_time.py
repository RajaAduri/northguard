"""SF-7051 — bucket a resolved cluster's activity by day.

Counts per day from the member docs' timestamps, with zeros preserved across gaps
(deterministic). Buckets run from the first active day to `window_end` (default: the
last active day), so a window that extends past the last activity shows trailing zeros
for cessation detection.

Note: per-member timestamps are not on ResolvedCluster, so `docs` is taken too
(deviation recorded in SESSION-LOG).
"""
from __future__ import annotations

from datetime import date, timedelta

from ..types import FeatureDoc, ResolvedCluster, TimeBucket


def bucket_by_time(rc: ResolvedCluster, docs: list[FeatureDoc], window_end: str | None = None) -> list[TimeBucket]:
    by_id = {d.entry_id: d for d in docs}
    days: dict[str, int] = {}
    for entry_id in rc.members:
        doc = by_id.get(entry_id)
        if doc is None or not doc.ts:
            continue
        day = doc.ts[:10]
        days[day] = days.get(day, 0) + 1
    if not days:
        return []
    first = min(days)
    last = max(days)
    end = window_end[:10] if window_end else last
    if end < last:
        end = last
    buckets: list[TimeBucket] = []
    cur = date.fromisoformat(first)
    stop = date.fromisoformat(end)
    while cur <= stop:
        iso = cur.isoformat()
        buckets.append(TimeBucket(period=iso, count=days.get(iso, 0), weekday=cur.weekday()))
        cur += timedelta(days=1)
    return buckets
