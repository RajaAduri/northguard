from recurring.resolve.group_by_pseudonym import group_by_pseudonym
from recurring.types import Cluster, FeatureDoc


def _doc(entry_id, conv, pseudo_areas):
    return FeatureDoc(
        entry_id=entry_id, conversation_id=conv, ts="t", redacted_text="",
        pseudonyms=tuple(p for p, _ in pseudo_areas),
        pseudonym_areas=tuple(pseudo_areas), key_epoch=1, shingles=frozenset(),
    )


def _cluster(members):
    return Cluster(id="c1", members=tuple(members), key_epoch=1, model_version="m@1", threshold=0.85)


def test_same_pseudonym_across_conversations_linked_as_one_entity():
    docs = [_doc("a", "conv1", [("supA", "lieferanten-konditionen")]), _doc("b", "conv2", [("supA", "lieferanten-konditionen")])]
    rc = group_by_pseudonym([_cluster(["a", "b"])], docs)[0]
    ents = [e for e in rc.entities if e.pseudonym == "supA"]
    assert len(ents) == 1
    assert ents[0].count == 2  # two distinct conversations
    assert ents[0].area == "lieferanten-konditionen"


def test_two_different_suppliers_are_distinct_groups():
    docs = [_doc("a", "c1", [("supA", "x")]), _doc("b", "c2", [("supB", "x")])]
    rc = group_by_pseudonym([_cluster(["a", "b"])], docs)[0]
    assert {e.pseudonym for e in rc.entities} == {"supA", "supB"}


def test_no_original_value_read_only_pseudonyms():
    docs = [_doc("a", "c1", [("supA", "lieferanten-konditionen")])]
    rc = group_by_pseudonym([_cluster(["a"])], docs)[0]
    assert all(e.pseudonym == "supA" for e in rc.entities)
    # entities expose only pseudonym/area/count — no original text field
    assert set(rc.entities[0].__dataclass_fields__) == {"pseudonym", "area", "count"}
