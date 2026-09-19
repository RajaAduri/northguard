from recurring.semantic.connected_components_cluster import connected_components_cluster

# a,b: near-identical vectors (cosine ~1). c: orthogonal.
VECS = {"a": (1.0, 0.0, 0.0), "b": (0.99, 0.1, 0.0), "c": (0.0, 0.0, 1.0)}


def test_candidate_pairs_confirmed_by_cosine_form_a_cluster():
    clusters = connected_components_cluster({("a", "b")}, VECS, 0.85)
    assert any(set(c.members) == {"a", "b"} for c in clusters)
    assert all("c" not in c.members for c in clusters)


def test_cluster_id_is_deterministic_and_stable():
    c1 = connected_components_cluster({("a", "b")}, VECS, 0.85)
    c2 = connected_components_cluster({("a", "b")}, VECS, 0.85)
    assert [c.id for c in c1] == [c.id for c in c2]
    assert all(len(c.id) == 16 for c in c1)


def test_paraphrase_missed_by_minhash_still_clustered_via_cosine():
    # NO MinHash candidate pairs at all — the semantic (cosine) edge must still cluster a,b.
    clusters = connected_components_cluster(set(), VECS, 0.85)
    assert any(set(c.members) == {"a", "b"} for c in clusters)
