"""SF-7031 — embed documents with the pinned model, cached by text hash.

Vectors are cached by sha256(redacted_text) so a re-run reuses them and identical text
yields an identical vector (deterministic given the pinned model, NG-15). The model
version is carried for provenance.
"""
from __future__ import annotations

import hashlib

from ..types import FeatureDoc, Vector
from .pinned_embedder import PinnedEmbedder


def embed_documents(docs: list[FeatureDoc], model: PinnedEmbedder) -> dict[str, Vector]:
    by_hash: dict[str, Vector] = {}
    out: dict[str, Vector] = {}
    for doc in docs:
        h = hashlib.sha256(doc.redacted_text.encode("utf-8")).hexdigest()
        if h not in by_hash:
            by_hash[h] = model.embed(doc.redacted_text)
        out[doc.entry_id] = by_hash[h]
    return out
