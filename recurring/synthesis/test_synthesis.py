import pytest

from recurring.synthesis.assert_non_attributable import assert_non_attributable
from recurring.synthesis.estimate_duplicated_effort import estimate_duplicated_effort
from recurring.synthesis.estimate_hours_saved import estimate_hours_saved
from recurring.synthesis.name_removing_artefact import name_removing_artefact
from recurring.synthesis.rank_findings import rank_findings
from recurring.synthesis import synthesize_recurring_work
from recurring.types import (
    AttributionViolation, Cessation, DuplicatedEffort, RecurringWorkFinding, ResolvedCluster, ResolvedEntity,
)


def _rc(members, entities=()):
    return ResolvedCluster(cluster_id="c1", members=tuple(members), entities=tuple(entities), key_epoch=1)


def _finding(theme, hours_high, size):
    return RecurringWorkFinding(theme=theme, area="x", cluster_size=size, hours_saved_low=hours_high * 0.75, hours_saved_high=hours_high, artefact="A")


# --- SF-7061 ---
def test_four_members_three_redundant():
    assert estimate_duplicated_effort(_rc(["a", "b", "c", "d"])).redundant_instances == 3


def test_single_request_zero_duplication():
    assert estimate_duplicated_effort(_rc(["a"])).redundant_instances == 0


# --- SF-7062 ---
def test_hours_saved_from_redundancy():
    assert estimate_hours_saved(DuplicatedEffort(cluster_size=4, redundant_instances=3), 20.0) == 1.0
    assert estimate_hours_saved(DuplicatedEffort(cluster_size=1, redundant_instances=0)) == 0.0


# --- SF-7063 ---
def test_artefact_for_supplier_docs_and_solved_cadence():
    rc = _rc(["a", "b"], [ResolvedEntity("supA", "lieferanten-konditionen", 2)])
    art = name_removing_artefact(rc, None, None)
    assert "Auszug je Vertrag" in art.description
    solved = name_removing_artefact(rc, None, Cessation(last_day="2026-09-10", label="gelöst"))
    assert solved.likely_resolved is True


# --- SF-7064 ---
def test_rank_by_hours_then_cluster_size():
    ranked = rank_findings([_finding("a", 1.0, 2), _finding("b", 5.0, 3), _finding("c", 5.0, 9)])
    assert [f.theme for f in ranked] == ["c", "b", "a"]  # 5.0/size9, 5.0/size3, 1.0


# --- SF-7065 (NG-21 gate) ---
def test_assert_non_attributable_passes_clean_findings():
    assert_non_attributable([_finding("a", 1.0, 2)])  # no raise


def test_assert_non_attributable_raises_on_person_or_score():
    for bad in ({"theme": "t", "actor": "anna"}, {"theme": "t", "score": 0.9}, {"theme": "t", "sentiment": "frustrated"}):
        with pytest.raises(AttributionViolation):
            assert_non_attributable([bad])


# --- AF-706 integration ---
def test_synthesis_ranks_and_is_non_attributable():
    rc = _rc(["a", "b", "c", "d"], [ResolvedEntity("supA", "lieferanten-konditionen", 4)])
    findings = synthesize_recurring_work([rc])
    assert len(findings) == 1
    assert findings[0].area == "lieferanten-konditionen"
    assert findings[0].hours_saved_high > 0
    # no person dimension anywhere
    assert set(RecurringWorkFinding.__dataclass_fields__) == {"theme", "area", "cluster_size", "hours_saved_low", "hours_saved_high", "artefact", "cadence"}
