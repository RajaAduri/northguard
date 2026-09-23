"""AF-701..706 end-to-end — the E7 recurring-work pipeline over a ledger window.

Chains the built stages: load redacted corpus -> attach pseudonyms/shingles -> MinHash-LSH
blocking -> semantic clustering (pinned embedder) -> pseudonym resolution -> temporal
patterns -> hours-saved synthesis. Reads pseudonyms + redacted text only (NG-10) and is
non-attributable by construction (NG-21). Deterministic given the pinned model (NG-15).

`findings_to_ts` maps the snake_case dataclass onto the TypeScript camelCase
RecurringWorkFinding shape the E6 briefing consumes across bridge B4.
"""
from __future__ import annotations

import json
from pathlib import Path

from . import config
from .features.attach_pseudonyms import attach_pseudonyms
from .features.load_redacted_corpus import load_redacted_corpus
from .minhash import block_near_duplicates
from .resolve import resolve_entities
from .semantic import PinnedEmbedder, cluster_semantic, default_embedder
from .synthesis import synthesize_recurring_work
from .temporal import bucket_by_time, detect_cadence, detect_cessation
from .types import LedgerWindow, RecurringWorkFinding


def load_ledger_window(path: str, date_from: str | None = None, date_to: str | None = None) -> LedgerWindow:
    """Read a JSONL ledger file into a window, optionally filtered to [date_from, date_to]
    on the entry timestamp's date. Malformed lines are skipped."""
    entries: list[dict] = []
    p = Path(path)
    if not p.exists():
        return LedgerWindow(entries=())
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            e = json.loads(line)
        except json.JSONDecodeError:
            continue
        day = str(e.get("ts", ""))[:10]
        if date_from and day and day < date_from:
            continue
        if date_to and day and day > date_to:
            continue
        entries.append(e)
    return LedgerWindow(entries=tuple(entries))


def run_e7(window: LedgerWindow, embedder: PinnedEmbedder | None = None, window_end: str | None = None) -> tuple[list[RecurringWorkFinding], bool]:
    """Run the full pipeline. Returns (findings, spanned_key_rotation)."""
    docs = [attach_pseudonyms(d) for d in load_redacted_corpus(window)]
    if not docs:
        return [], False
    pairs = block_near_duplicates(
        docs, num_perm=config.MINHASH_NUM_PERM, seed=config.MINHASH_SEED, threshold=config.MINHASH_THRESHOLD
    )
    model = embedder or default_embedder()
    clusters = cluster_semantic(docs, pairs, model, config.COSINE_THRESHOLD)
    resolved, spanned_rotation = resolve_entities(clusters, docs)
    temporal = {
        rc.cluster_id: (
            detect_cadence(bucket_by_time(rc, docs, window_end)),
            detect_cessation(bucket_by_time(rc, docs, window_end)),
        )
        for rc in resolved
    }
    return synthesize_recurring_work(resolved, temporal), spanned_rotation


def findings_to_ts(findings: list[RecurringWorkFinding]) -> list[dict]:
    """Map onto the TS RecurringWorkFinding (camelCase). cadence is omitted when None."""
    out: list[dict] = []
    for f in findings:
        d = {
            "theme": f.theme,
            "area": f.area,
            "clusterSize": f.cluster_size,
            "hoursSavedLow": f.hours_saved_low,
            "hoursSavedHigh": f.hours_saved_high,
            "artefact": f.artefact,
        }
        if f.cadence:
            d["cadence"] = f.cadence
        out.append(d)
    return out
