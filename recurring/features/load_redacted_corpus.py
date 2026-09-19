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
        docs.append(
            RawDoc(
                entry_id=str(e["id"]),
                conversation_id=str(e.get("conversationId", "")),
                ts=str(e.get("ts", "")),
                redacted_text=str(e.get("redactedText", "")),
                pseudonyms=pseudonyms,
                pseudonym_areas=pseudonym_areas,
                key_epoch=key_epoch,
            )
        )
    return docs
