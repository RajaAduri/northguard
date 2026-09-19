from recurring.resolve.merge_pseudonym_across_cluster import merge_pseudonym_across_cluster
from recurring.types import ResolvedCluster, ResolvedEntity


def test_four_people_same_supplier_one_entity_count_four():
    rc = ResolvedCluster(
        cluster_id="c1", members=("a", "b", "c", "d"),
        entities=(ResolvedEntity("supA", "lieferanten-konditionen", 2), ResolvedEntity("supA", "lieferanten-konditionen", 2)),
        key_epoch=1,
    )
    out = merge_pseudonym_across_cluster(rc)
    supA = [e for e in out.entities if e.pseudonym == "supA"]
    assert len(supA) == 1
    assert supA[0].count == 4


def test_mixed_pseudonyms_kept_distinct():
    rc = ResolvedCluster(cluster_id="c1", members=("a", "b"), entities=(ResolvedEntity("supA", "x", 1), ResolvedEntity("supB", "x", 1)), key_epoch=1)
    assert {e.pseudonym for e in merge_pseudonym_across_cluster(rc).entities} == {"supA", "supB"}


def test_never_names_an_original_value():
    rc = ResolvedCluster(cluster_id="c1", members=("a",), entities=(ResolvedEntity("supA", "lieferanten-konditionen", 3),), key_epoch=1)
    out = merge_pseudonym_across_cluster(rc)
    assert out.entities[0].pseudonym == "supA"
    assert out.entities[0].area == "lieferanten-konditionen"
