from recurring.minhash.compute_signatures import compute_signatures
from recurring.minhash.lsh_bucketize import lsh_bucketize
from recurring.types import FeatureDoc


def _doc(entry_id, shingles):
    return FeatureDoc(entry_id=entry_id, conversation_id="c", ts="t", redacted_text="", pseudonyms=(), pseudonym_areas=(), key_epoch=1, shingles=frozenset(shingles))


# a & b: Jaccard ~0.9 (near-verbatim); c: disjoint
DOCS = [_doc("a", range(0, 20)), _doc("b", list(range(0, 19)) + [999]), _doc("c", range(500, 520))]


def test_near_verbatim_docs_share_a_bucket():
    buckets = lsh_bucketize(compute_signatures(DOCS))
    assert any("a" in bk and "b" in bk for bk in buckets)


def test_unrelated_docs_are_not_bucketed_together():
    buckets = lsh_bucketize(compute_signatures(DOCS))
    assert not any("c" in bk and ("a" in bk or "b" in bk) for bk in buckets)


def test_fixed_threshold_is_deterministic():
    assert lsh_bucketize(compute_signatures(DOCS)) == lsh_bucketize(compute_signatures(DOCS))
