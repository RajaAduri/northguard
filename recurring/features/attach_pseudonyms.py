"""SF-7013 — turn a RawDoc into a FeatureDoc by shingling its redacted text.

The pseudonyms + key_epoch are carried through for AF-704 resolution. No original value
is present (type-enforced: FeatureDoc holds only redacted text + pseudonyms).
"""
from __future__ import annotations

from ..types import FeatureDoc, RawDoc
from .tokenize_and_shingle import tokenize_and_shingle


def attach_pseudonyms(doc: RawDoc, k: int = 5) -> FeatureDoc:
    return FeatureDoc(
        entry_id=doc.entry_id,
        conversation_id=doc.conversation_id,
        ts=doc.ts,
        redacted_text=doc.redacted_text,
        pseudonyms=doc.pseudonyms,
        key_epoch=doc.key_epoch,
        shingles=tokenize_and_shingle(doc.redacted_text, k),
    )
