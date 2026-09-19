"""SF-7054 — detect that a recurring pattern has stopped ("likely solved").

If activity stops before the window end (trailing zero buckets after the last active
day) and there was more than one active day, that is a cessation. Ongoing activity
(the final bucket has activity) → None. A single active day → None (too little).
"""
from __future__ import annotations

from ..types import Cessation, TimeBucket


def detect_cessation(buckets: list[TimeBucket]) -> Cessation | None:
    active_days = [b.period for b in buckets if b.count > 0]
    if len(active_days) < 2:
        return None
    if buckets and buckets[-1].count > 0:
        return None  # still ongoing
    last_active = active_days[-1]
    return Cessation(last_day=last_active, label=f"seit {last_active} keine Anfrage — vermutlich gelöst")
