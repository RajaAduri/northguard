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


def _resolve_cached_commit(repo_id: str) -> str | None:
    """The commit hash of the locally cached snapshot (so 'main' resolves to an exact
    revision for the audit record). None if it cannot be determined."""
    try:
        from huggingface_hub import scan_cache_dir

        for repo in scan_cache_dir().repos:
            if repo.repo_id == repo_id:
                revs = sorted(repo.revisions, key=lambda r: r.last_modified or 0, reverse=True)
                if revs:
                    return revs[0].commit_hash[:12]
    except Exception:  # noqa: BLE001 - provenance resolution is best-effort
        return None
    return None


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
        # NG-15: record the RESOLVED commit the loader actually fetched, not the moving
        # 'main' pointer, so a re-run is reproducible and the audit record is exact.
        self.resolved_revision = _resolve_cached_commit(config.EMBEDDING_MODEL) or config.EMBEDDING_MODEL_REVISION
        self.model_version = f"{config.EMBEDDING_MODEL}@{self.resolved_revision}"

    def embed(self, text: str) -> Vector:
        vec = self._model.encode(f"passage: {text}", normalize_embeddings=True, show_progress_bar=False)
        return tuple(float(x) for x in vec)
