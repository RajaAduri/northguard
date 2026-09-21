"""SF-7011 — load the redacted corpus from a ledger window.

Reads only redacted text + pseudonyms (NG-10). A raw prompt/response text field
(full-text opt-in disabled) is a PrivacyViolation. Governance/ops entries are skipped.
"""
from __future__ import annotations

from ..types import LedgerWindow, PrivacyViolation, RawDoc

RAW_TEXT_FIELDS = ("promptText", "responseText", "rawPrompt", "rawResponse", "text", "content")


def load_redacted_corpus(window: LedgerWindow) -> list[RawDoc]:
    docs: list[RawDoc] = []
    for e in window.entries:
        if e.get("kind") != "request":
            continue
        for field in RAW_TEXT_FIELDS:
            if e.get(field):
                raise PrivacyViolation(f"raw text field '{field}' present in ledger entry {e.get('id')}")
        spans = e.get("spanPseudonyms", []) or []
        pseudonyms = tuple(s["pseudonym"] for s in spans if "pseudonym" in s)
        pseudonym_areas = tuple((s["pseudonym"], s.get("area", "")) for s in spans if "pseudonym" in s)
        key_epoch = next((int(s["keyEpoch"]) for s in spans if "keyEpoch" in s), int(e.get("actorEpoch", 0)))
        features = _read_features(e)
        docs.append(
            RawDoc(
                entry_id=str(e["id"]),
                conversation_id=str(e.get("conversationId", "")),
                ts=str(e.get("ts", "")),
                redacted_text=str(e.get("redactedText", "")),
                pseudonyms=pseudonyms,
                pseudonym_areas=pseudonym_areas,
                key_epoch=key_epoch,
                features=features,
                work_topic=str(e.get("workTopic", "")),
            )
        )
    return docs


def _read_features(e: dict) -> tuple[tuple[str, object], ...]:
    """Read the NG-23 business-event features. Structural only: a value must be a scalar
    (str/int/bool), never a nested structure that could smuggle original text."""
    out: list[tuple[str, object]] = []
    for f in e.get("features", []) or []:
        name, value = f.get("name"), f.get("value")
        if name is None:
            continue
        if not isinstance(value, (str, int, bool)):
            raise PrivacyViolation(f"non-structural feature value on ledger entry {e.get('id')}")
        out.append((str(name), value))
    return tuple(out)
