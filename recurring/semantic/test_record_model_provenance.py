from recurring.semantic.record_model_provenance import record_model_provenance
from recurring.types import Cluster


def _c():
    return Cluster(id="abc123", members=("a", "b"), key_epoch=0, model_version="", threshold=0.0)


def test_each_cluster_carries_model_version_and_threshold():
    out = record_model_provenance([_c()], "intfloat/multilingual-e5-base@main", 0.85)
    assert out[0].model_version == "intfloat/multilingual-e5-base@main"
    assert out[0].threshold == 0.85


def test_two_runs_same_version_identical_provenance():
    a = record_model_provenance([_c()], "m@1", 0.85)
    b = record_model_provenance([_c()], "m@1", 0.85)
    assert a == b


def test_a_version_bump_is_recorded():
    v1 = record_model_provenance([_c()], "m@1", 0.85)[0]
    v2 = record_model_provenance([_c()], "m@2", 0.85)[0]
    assert v1.model_version != v2.model_version
