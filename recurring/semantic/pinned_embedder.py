"""The pinned local embedding model (intfloat/multilingual-e5-base).

Runs on the backstop host; nothing leaves customer infra (NFR-05). Deterministic
inference (no sampling). The concrete adapter lazy-imports sentence-transformers so the
deterministic pipeline + its tests do not require the model to be installed — running
against the real model is an integration step (flagged, not a blocker).
"""
from __future__ import annotations

from typing import Protocol, runtime_checkable

from .. import config
from ..types import Vector


@runtime_checkable
class PinnedEmbedder(Protocol):
    model_version: str

    def embed(self, text: str) -> Vector: ...


class E5MultilingualEmbedder:
    """Adapter for intfloat/multilingual-e5-base via sentence-transformers.

    e5 expects a task prefix; we use "passage: " for the stored corpus. The revision is
    pinned (config.EMBEDDING_MODEL_REVISION) and the resolved model_version is recorded.
    """

    def __init__(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer  # lazy: optional dep
        except ImportError as exc:  # pragma: no cover - exercised only without the dep
            raise RuntimeError(
                "sentence-transformers not installed — the pinned embedding model "
                f"({config.MODEL_VERSION}) must be fetched on the backstop host before E7 "
                "semantic clustering can run against real data."
            ) from exc
        self._model = SentenceTransformer(config.EMBEDDING_MODEL, revision=config.EMBEDDING_MODEL_REVISION)
        self.model_version = config.MODEL_VERSION

    def embed(self, text: str) -> Vector:
        vec = self._model.encode(f"passage: {text}", normalize_embeddings=True, show_progress_bar=False)
        return tuple(float(x) for x in vec)
