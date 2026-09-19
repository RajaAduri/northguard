"""SF-7034 — stamp the model version + threshold onto every cluster (NG-15).

Results are comparable only within a model version, so the version is part of the
audit record. Two runs on the same version produce identical provenance.
"""
from __future__ import annotations

from dataclasses import replace

from ..types import Cluster


def record_model_provenance(clusters: list[Cluster], model_version: str, threshold: float) -> list[Cluster]:
    return [replace(c, model_version=model_version, threshold=threshold) for c in clusters]
