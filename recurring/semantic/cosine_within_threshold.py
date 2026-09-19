"""SF-7032 — cosine similarity gate."""
from __future__ import annotations

import math

from ..types import Vector


def _cosine(a: Vector, b: Vector) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def cosine_within_threshold(a: Vector, b: Vector, threshold: float) -> bool:
    return _cosine(a, b) >= threshold
