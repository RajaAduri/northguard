"""SF-7052 — rising/steady/falling over the bucket series."""
from __future__ import annotations

from ..types import TimeBucket


def classify_trend(buckets: list[TimeBucket]) -> str:
    counts = [b.count for b in buckets]
    if len(counts) < 2:
        return "steady"
    mid = len(counts) // 2
    first = sum(counts[:mid])
    second = sum(counts[mid:])
    if second > first:
        return "rising"
    if second < first:
        return "falling"
    return "steady"
