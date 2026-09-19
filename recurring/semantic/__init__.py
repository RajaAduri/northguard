"""AF-703 — semantic clustering (Stage 2, pinned local embeddings). Deterministic (NG-15)."""
from __future__ import annotations

from ..types import Cluster, FeatureDoc
from .connected_components_cluster import connected_components_cluster
from .cosine_within_threshold import cosine_within_threshold
from .embed_documents import embed_documents
from .pinned_embedder import E5MultilingualEmbedder, PinnedEmbedder
from .record_model_provenance import record_model_provenance

__all__ = [
    "cluster_semantic",
    "embed_documents",
    "cosine_within_threshold",
    "connected_components_cluster",
    "record_model_provenance",
    "PinnedEmbedder",
    "E5MultilingualEmbedder",
]


def cluster_semantic(
    docs: list[FeatureDoc],
    candidate_pairs: set[tuple[str, str]],
    model: PinnedEmbedder,
    threshold: float,
) -> list[Cluster]:
    vecs = embed_documents(docs, model)
    clusters = connected_components_cluster(candidate_pairs, vecs, threshold)
    return record_model_provenance(clusters, model.model_version, threshold)
