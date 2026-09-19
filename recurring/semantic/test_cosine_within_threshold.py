from recurring.semantic.cosine_within_threshold import cosine_within_threshold


def test_paraphrases_of_the_same_doc_are_within_threshold():
    a = (1.0, 0.0, 0.0)
    b = (0.98, 0.2, 0.0)  # cosine ~0.98
    assert cosine_within_threshold(a, b, 0.85) is True


def test_unrelated_docs_are_below_threshold():
    assert cosine_within_threshold((1.0, 0.0, 0.0), (0.0, 1.0, 0.0), 0.85) is False


def test_identical_vectors_are_within_threshold():
    assert cosine_within_threshold((0.3, 0.7, 0.1), (0.3, 0.7, 0.1), 0.99) is True
