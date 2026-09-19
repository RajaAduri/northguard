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
    pseudonym_areas: tuple[tuple[str, str], ...]  # (pseudonym, area) — area for resolution, never an original
    key_epoch: int


@dataclass(frozen=True)
class FeatureDoc:
    entry_id: str
    conversation_id: str
    ts: str
    redacted_text: str
    pseudonyms: tuple[str, ...]
    pseudonym_areas: tuple[tuple[str, str], ...]
    key_epoch: int
    shingles: frozenset[int]      # hashed token shingles (deterministic)


class PrivacyViolation(Exception):
    """Raised if an original entity value (raw prompt/response text) is encountered."""


@dataclass(frozen=True)
class TimeBucket:
    period: str    # a day, ISO 'YYYY-MM-DD'
    count: int
    weekday: int   # 0=Mon … 6=Sun


@dataclass(frozen=True)
class Cadence:
    kind: str      # 'weekly'
    weekday: int
    label: str     # e.g. 'weekly-Friday'


@dataclass(frozen=True)
class Cessation:
    last_day: str
    label: str     # 'no request since <day> — likely solved'


@dataclass(frozen=True)
class DuplicatedEffort:
    cluster_size: int
    redundant_instances: int


@dataclass(frozen=True)
class Artefact:
    description: str
    likely_resolved: bool


@dataclass(frozen=True)
class RecurringWorkFinding:
    """AF-706 output → E6 briefing (bridge B4). Non-attributable (NG-21): topics/
    artefacts, never people; no score/rank/sentiment field exists here."""
    theme: str
    area: str
    cluster_size: int
    hours_saved_low: float
    hours_saved_high: float
    artefact: str
    cadence: str | None = None


class AttributionViolation(Exception):
    """Raised if an E7 finding carries a person dimension / score / sentiment (NG-21)."""


# A MinHash signature is a fixed-length tuple of min-hash values (deterministic given a
# pinned seed + permutation family). A Bucket is the sorted entry-ids that collided.
MinHash = tuple[int, ...]
Bucket = tuple[str, ...]

# A pinned-model embedding vector.
Vector = tuple[float, ...]


@dataclass(frozen=True)
class Cluster:
    id: str                       # deterministic (sorted member hash)
    members: tuple[str, ...]      # entry_ids
    key_epoch: int
    model_version: str            # provenance (NG-15)
    threshold: float


@dataclass(frozen=True)
class ResolvedEntity:
    pseudonym: str                # never an original value (NG-10)
    area: str
    count: int                    # distinct conversations touching this entity in the cluster


@dataclass(frozen=True)
class ResolvedCluster:
    cluster_id: str
    members: tuple[str, ...]
    entities: tuple[ResolvedEntity, ...]
    key_epoch: int
