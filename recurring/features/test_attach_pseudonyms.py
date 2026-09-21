from recurring.features.attach_pseudonyms import attach_pseudonyms
from recurring.types import FeatureDoc, RawDoc


def _raw(pseudonyms, features=(), work_topic=""):
    return RawDoc(entry_id="1", conversation_id="c1", ts="t", redacted_text="frage zu ⟨Lieferant⟩ heute morgen", pseudonyms=pseudonyms, pseudonym_areas=tuple((p,"lieferanten-konditionen") for p in pseudonyms), key_epoch=1, features=features, work_topic=work_topic)


def test_pseudonyms_and_key_epoch_attached():
    fd = attach_pseudonyms(_raw(("ab12",)))
    assert isinstance(fd, FeatureDoc)
    assert fd.pseudonyms == ("ab12",)
    assert fd.key_epoch == 1
    assert len(fd.shingles) > 0


def test_no_entities_gives_empty_pseudonym_tuple():
    assert attach_pseudonyms(_raw(())).pseudonyms == ()


def test_no_original_value_present():
    fd = attach_pseudonyms(_raw(("ab12",)))
    # FeatureDoc carries redacted text + pseudonyms + shingles + the NG-23 business-event
    # record (structural features + work topic) only — no original-text field.
    assert set(fd.__dataclass_fields__) == {"entry_id", "conversation_id", "ts", "redacted_text", "pseudonyms", "pseudonym_areas", "key_epoch", "shingles", "features", "work_topic"}


def test_business_event_record_carries_through_ng23():
    fd = attach_pseudonyms(_raw(("ab12",), features=(("percentPresent", True),), work_topic="lieferanten-konditionen"))
    assert fd.features == (("percentPresent", True),)
    assert fd.work_topic == "lieferanten-konditionen"
