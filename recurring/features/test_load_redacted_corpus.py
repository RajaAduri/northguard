import pytest

from recurring.features.load_redacted_corpus import load_redacted_corpus
from recurring.types import LedgerWindow, PrivacyViolation


def _req(entry_id, text, spans, conv="c1"):
    return {"id": entry_id, "kind": "request", "ts": "2026-09-10T00:00:00Z", "conversationId": conv,
            "redactedText": text, "spanPseudonyms": spans}


def test_returns_redacted_text_and_pseudonyms_per_request():
    win = LedgerWindow(entries=(
        _req("1", "Frage zu ⟨Lieferant⟩", [{"area": "lieferanten-konditionen", "layer": "rule", "pseudonym": "ab12", "keyEpoch": 1}]),
    ))
    docs = load_redacted_corpus(win)
    assert len(docs) == 1
    assert docs[0].redacted_text == "Frage zu ⟨Lieferant⟩"
    assert docs[0].pseudonyms == ("ab12",)
    assert docs[0].key_epoch == 1


def test_raw_text_field_raises_privacy_violation():
    win = LedgerWindow(entries=({"id": "1", "kind": "request", "promptText": "the real prompt"},))
    with pytest.raises(PrivacyViolation):
        load_redacted_corpus(win)


def test_governance_and_ops_entries_are_skipped():
    win = LedgerWindow(entries=(
        {"id": "g", "kind": "governance", "govKind": "export"},
        _req("1", "x", []),
    ))
    docs = load_redacted_corpus(win)
    assert [d.entry_id for d in docs] == ["1"]


def test_reads_business_event_features_and_work_topic_ng23():
    e = _req("1", "Frage zu ⟨Lieferant⟩", [])
    e["features"] = [{"name": "percentPresent", "value": True}, {"name": "priceTermInSentence", "value": False}]
    e["workTopic"] = "lieferanten-konditionen"
    docs = load_redacted_corpus(LedgerWindow(entries=(e,)))
    assert docs[0].features == (("percentPresent", True), ("priceTermInSentence", False))
    assert docs[0].work_topic == "lieferanten-konditionen"


def test_features_default_empty_when_absent():
    docs = load_redacted_corpus(LedgerWindow(entries=(_req("1", "x", []),)))
    assert docs[0].features == ()
    assert docs[0].work_topic == ""


def test_non_structural_feature_value_raises_privacy_violation():
    e = _req("1", "x", [])
    e["features"] = [{"name": "smuggled", "value": {"nested": "the real prompt"}}]
    with pytest.raises(PrivacyViolation):
        load_redacted_corpus(LedgerWindow(entries=(e,)))
