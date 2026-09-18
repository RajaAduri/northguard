"""SF-7012 — deterministic hashed k-shingles.

Uses a stable hash (blake2b), never Python's salted built-in hash(), so the same text
yields the same shingle set on every run and every process (NG-15). Semantic
placeholders (⟨…⟩) are treated as single tokens, not split.
"""
from __future__ import annotations

import hashlib
import re

_TOKEN = re.compile(r"⟨[^⟩]*⟩|\w+", re.UNICODE)


def _stable_hash(s: str) -> int:
    return int.from_bytes(hashlib.blake2b(s.encode("utf-8"), digest_size=8).digest(), "big")


def tokenize_and_shingle(text: str, k: int = 5) -> frozenset[int]:
    tokens = _TOKEN.findall(text.lower())
    if len(tokens) < k:
        # short text: one shingle of the whole token run (still deterministic)
        return frozenset({_stable_hash("".join(tokens))}) if tokens else frozenset()
    shingles = {_stable_hash("".join(tokens[i : i + k])) for i in range(len(tokens) - k + 1)}
    return frozenset(shingles)
