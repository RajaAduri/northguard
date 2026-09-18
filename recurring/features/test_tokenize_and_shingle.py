from recurring.features.tokenize_and_shingle import tokenize_and_shingle


def test_returns_hashed_k_shingles():
    s = tokenize_and_shingle("der lieferant hat die konditionen bestaetigt heute", k=3)
    assert isinstance(s, frozenset)
    assert all(isinstance(x, int) for x in s)
    assert len(s) > 0


def test_same_text_same_shingles_deterministic():
    text = "der lieferant hat die konditionen bestaetigt"
    assert tokenize_and_shingle(text) == tokenize_and_shingle(text)


def test_placeholders_are_single_tokens_not_split():
    # "⟨Lieferant 1⟩" must be one token; a plain "lieferant 1" tokenises to two.
    with_ph = tokenize_and_shingle("angebot von ⟨Lieferant 1⟩ heute", k=2)
    without = tokenize_and_shingle("angebot von lieferant 1 heute", k=2)
    assert with_ph != without
