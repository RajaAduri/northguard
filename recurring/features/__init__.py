"""AF-701 — content feature extraction over the redacted+pseudonymised corpus.

Reads only redacted text + pseudonyms (NG-10); deterministic (NG-15).
"""
from __future__ import annotations

from ..types import FeatureDoc, LedgerWindow
from .attach_pseudonyms import attach_pseudonyms
from .load_redacted_corpus import load_redacted_corpus
from .tokenize_and_shingle import tokenize_and_shingle

__all__ = ["extract_content_features", "load_redacted_corpus", "tokenize_and_shingle", "attach_pseudonyms"]


def extract_content_features(window: LedgerWindow, k: int = 5) -> list[FeatureDoc]:
    return [attach_pseudonyms(doc, k) for doc in load_redacted_corpus(window)]
