from recurring.minhash.emit_candidate_pairs import emit_candidate_pairs


def test_a_bucket_of_three_yields_three_pairs():
    pairs = emit_candidate_pairs([("a", "b", "c")])
    assert pairs == {("a", "b"), ("a", "c"), ("b", "c")}


def test_singleton_buckets_yield_no_pairs():
    assert emit_candidate_pairs([("solo",)]) == set()


def test_output_is_stable_and_ordered():
    p1 = emit_candidate_pairs([("b", "a")])
    assert p1 == {("a", "b")}  # ordered a<b
    assert emit_candidate_pairs([("b", "a")]) == p1
