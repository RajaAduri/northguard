from recurring.temporal.bucket_by_time import bucket_by_time
from recurring.temporal.classify_trend import classify_trend
from recurring.temporal.detect_cadence import detect_cadence
from recurring.temporal.detect_cessation import detect_cessation
from recurring.types import Cadence, Cessation, FeatureDoc, ResolvedCluster, TimeBucket


def _doc(entry_id, ts):
    return FeatureDoc(entry_id=entry_id, conversation_id="c", ts=ts, redacted_text="", pseudonyms=(), pseudonym_areas=(), key_epoch=1, shingles=frozenset())


def _rc(members):
    return ResolvedCluster(cluster_id="c1", members=tuple(members), entities=(), key_epoch=1)


def _bucket(period, count, weekday):
    return TimeBucket(period=period, count=count, weekday=weekday)


# --- SF-7051 bucket_by_time ---
def test_bucket_counts_per_day_with_zeros_preserved():
    docs = [_doc("a", "2026-09-07T09:00:00Z"), _doc("b", "2026-09-09T09:00:00Z")]  # Mon + Wed, Tue gap
    buckets = bucket_by_time(_rc(["a", "b"]), docs)
    assert [b.count for b in buckets] == [1, 0, 1]


def test_bucket_trailing_zeros_up_to_window_end():
    docs = [_doc("a", "2026-09-07T09:00:00Z"), _doc("b", "2026-09-08T09:00:00Z")]
    buckets = bucket_by_time(_rc(["a", "b"]), docs, window_end="2026-09-11")
    assert buckets[-1].count == 0
    assert buckets[-1].period == "2026-09-11"


# --- SF-7052 classify_trend ---
def test_trend_rising_steady_falling():
    assert classify_trend([_bucket("d", 1, 0), _bucket("d", 1, 1), _bucket("d", 4, 2), _bucket("d", 5, 3)]) == "rising"
    assert classify_trend([_bucket("d", 3, 0), _bucket("d", 3, 1)]) == "steady"
    assert classify_trend([_bucket("d", 5, 0), _bucket("d", 1, 1)]) == "falling"


# --- SF-7053 detect_cadence ---
def test_weekly_friday_cadence_detected():
    # Fridays (weekday 4) active in 3 weeks, other days quiet
    buckets = []
    for wk, fri in enumerate(["2026-09-04", "2026-09-11", "2026-09-18"]):
        buckets.append(_bucket(fri, 3, 4))
        buckets.append(_bucket(f"2026-09-0{5 + wk}", 0, 5))
    cad = detect_cadence(buckets)
    assert isinstance(cad, Cadence)
    assert cad.weekday == 4
    assert cad.label == "weekly-Friday"


def test_no_periodicity_returns_none():
    assert detect_cadence([_bucket("2026-09-07", 1, 0), _bucket("2026-09-09", 1, 2)]) is None


# --- SF-7054 detect_cessation ---
def test_cessation_when_activity_stops_midwindow():
    buckets = [_bucket("2026-09-07", 2, 0), _bucket("2026-09-08", 1, 1), _bucket("2026-09-09", 0, 2), _bucket("2026-09-10", 0, 3)]
    c = detect_cessation(buckets)
    assert isinstance(c, Cessation)
    assert c.last_day == "2026-09-08"


def test_ongoing_activity_returns_none():
    assert detect_cessation([_bucket("2026-09-07", 1, 0), _bucket("2026-09-08", 2, 1)]) is None


def test_single_active_day_returns_none():
    assert detect_cessation([_bucket("2026-09-07", 3, 0), _bucket("2026-09-08", 0, 1)]) is None
