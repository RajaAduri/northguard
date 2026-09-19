from recurring.features.attach_pseudonyms import attach_pseudonyms
from recurring.minhash.compute_signatures import compute_signatures
from recurring.types import FeatureDoc, RawDoc


def _doc(entry_id, shingles):
    return FeatureDoc(entry_id=entry_id, conversation_id="c", ts="t", redacted_text="", pseudonyms=(), pseudonym_areas=(), key_epoch=1, shingles=frozenset(shingles))


def test_a_signature_per_doc_with_pinned_permutations():
    sigs = compute_signatures([_doc("a", range(20)), _doc("b", range(50, 70))], num_perm=64)
    assert set(sigs) == {"a", "b"}
    assert len(sigs["a"]) == 64


def test_same_doc_identical_signature_every_run():
    d = _doc("a", range(20))
    assert compute_signatures([d]) == compute_signatures([d])


def test_empty_shingles_defined_empty_signature():
    sig = compute_signatures([_doc("empty", [])], num_perm=8)["empty"]
    assert len(sig) == 8
    assert len(set(sig)) == 1  # all the same MAX sentinel
