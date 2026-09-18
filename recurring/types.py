"""Core types for E7 recurring-work intelligence.

Everything read from the ledger is redacted text + one-way pseudonyms (NG-10); no
dataclass here can hold an original entity value. All stages are deterministic (NG-15)
and non-attributable — no person dimension (NG-21).
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LedgerWindow:
    """A window of ledger entries (already projected: redacted + pseudonyms)."""
    entries: tuple[dict, ...]


@dataclass(frozen=True)
class RawDoc:
    entry_id: str
    conversation_id: str
    ts: str
    redacted_text: str            # from the ledger (never an original)
    pseudonyms: tuple[str, ...]   # HMAC tokens present in this prompt
    key_epoch: int


@dataclass(frozen=True)
class FeatureDoc:
    entry_id: str
    conversation_id: str
    ts: str
    redacted_text: str
    pseudonyms: tuple[str, ...]
    key_epoch: int
    shingles: frozenset[int]      # hashed token shingles (deterministic)


class PrivacyViolation(Exception):
    """Raised if an original entity value (raw prompt/response text) is encountered."""
