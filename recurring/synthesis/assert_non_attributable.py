"""SF-7065 — the NG-21 gate. Runs before findings leave E7.

A RecurringWorkFinding describes work topics and artefacts (area, pseudonymised cluster,
count, hours saved) — never who did it or how they felt. Any person dimension, per-
individual score/rank, or sentiment/tone field is an AttributionViolation.
"""
from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Any

from ..types import AttributionViolation

FORBIDDEN_FIELDS = {
    "actor", "actor_pseudonym", "user", "user_id", "userid", "username", "person", "name", "reporter",
    "score", "rank", "rating", "sentiment", "tone", "emotion", "mood",
}


def _fields(finding: Any) -> set[str]:
    if is_dataclass(finding) and not isinstance(finding, type):
        return set(asdict(finding).keys())
    if isinstance(finding, dict):
        return set(finding.keys())
    return set(getattr(finding, "__dict__", {}).keys())


def assert_non_attributable(findings: list[Any]) -> None:
    for f in findings:
        offending = _fields(f) & FORBIDDEN_FIELDS
        if offending:
            raise AttributionViolation(f"NG-21: E7 finding carries a forbidden dimension {sorted(offending)}")
