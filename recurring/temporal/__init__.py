"""AF-705 — temporal pattern detection (trend / cadence / cessation). Deterministic."""
from __future__ import annotations

from .bucket_by_time import bucket_by_time
from .classify_trend import classify_trend
from .detect_cadence import detect_cadence
from .detect_cessation import detect_cessation

__all__ = ["bucket_by_time", "classify_trend", "detect_cadence", "detect_cessation"]
