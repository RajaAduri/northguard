from recurring.resolve.guard_key_epoch import guard_key_epoch
from recurring.types import Cluster, FeatureDoc


def _doc(entry_id, epoch):
    return FeatureDoc(entry_id=entry_id, conversation_id="c", ts="t", redacted_text="", pseudonyms=(), pseudonym_areas=(), key_epoch=epoch, shingles=frozenset())


def _cluster(members):
    return Cluster(id="orig", members=tuple(members), key_epoch=0, model_version="m@1", threshold=0.85)


def test_members_from_two_epochs_are_split():
    docs = [_doc("a", 1), _doc("b", 1), _doc("c", 2), _doc("d", 2)]
    out, spanned = guard_key_epoch([_cluster(["a", "b", "c", "d"])], docs)
    assert spanned is True
    epochs = sorted(c.key_epoch for c in out)
    assert epochs == [1, 2]
    for c in out:
        assert len({docs_epoch for docs_epoch in [d.key_epoch for d in docs if d.entry_id in c.members]}) == 1


def test_a_window_spanning_a_rotation_sets_the_caveat_flag():
    docs = [_doc("a", 1), _doc("b", 2)]
    # a,b alone per epoch are singletons → dropped, but the rotation is still reported
    _out, spanned = guard_key_epoch([_cluster(["a", "b"])], docs)
    assert spanned is True


def test_one_epoch_is_unchanged():
    docs = [_doc("a", 1), _doc("b", 1)]
    out, spanned = guard_key_epoch([_cluster(["a", "b"])], docs)
    assert spanned is False
    assert out[0].id == "orig"
