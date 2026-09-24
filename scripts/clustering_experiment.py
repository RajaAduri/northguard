"""Experiment 2 — E7 recurring-work clustering over a realistic batch (real embedder).

Runs the full E7 pipeline over a seeded batch ledger and records what it finds at each
stage: near-duplicate candidate pairs, semantic clusters (with sizes), resolved entities
(pseudonyms + area, never names — NG-10/NG-21), and the recurring-work findings the E6
briefing would receive. Uses the pinned e5 embedder (NG-15).

    python scripts/clustering_experiment.py <ledgerPath>
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from recurring import config  # noqa: E402
from recurring.features.attach_pseudonyms import attach_pseudonyms  # noqa: E402
from recurring.features.load_redacted_corpus import load_redacted_corpus  # noqa: E402
from recurring.minhash import block_near_duplicates  # noqa: E402
from recurring.resolve import resolve_entities  # noqa: E402
from recurring.semantic import cluster_semantic, default_embedder  # noqa: E402
from recurring.synthesis import synthesize_recurring_work  # noqa: E402
from recurring.temporal import bucket_by_time, detect_cadence, detect_cessation  # noqa: E402
from recurring.pipeline import load_ledger_window  # noqa: E402


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parent.parent / ".tenant" / "batch-ledger.jsonl")
    window = load_ledger_window(path)
    docs = [attach_pseudonyms(d) for d in load_redacted_corpus(window)]
    print(f"E7 clustering experiment — {len(window.entries)} ledger entries, {len(docs)} request docs")
    print("=" * 78)

    pairs = block_near_duplicates(docs, num_perm=config.MINHASH_NUM_PERM, seed=config.MINHASH_SEED, threshold=config.MINHASH_THRESHOLD)
    print(f"Stage 1 (MinHash-LSH): {len(pairs)} candidate near-duplicate pairs")

    embedder = default_embedder()
    clusters = cluster_semantic(docs, pairs, embedder, config.COSINE_THRESHOLD)
    print(f"Stage 2 (semantic, e5 @ cos {config.COSINE_THRESHOLD}, model {embedder.model_version}): {len(clusters)} clusters")
    for c in clusters:
        print(f"  cluster {c.id[:8]} size {len(c.members)}")

    resolved, spanned = resolve_entities(clusters, docs)
    print(f"Stage 3 (resolve): {len(resolved)} resolved clusters (spanned key rotation: {spanned})")
    for rc in resolved:
        ents = ", ".join(f"{e.pseudonym[:8]}…/{e.area}×{e.count}" for e in rc.entities)
        print(f"  {rc.cluster_id[:8]} size {len(rc.members)} entities: {ents or '(none)'}")

    temporal = {rc.cluster_id: (detect_cadence(bucket_by_time(rc, docs)), detect_cessation(bucket_by_time(rc, docs))) for rc in resolved}
    findings = synthesize_recurring_work(resolved, temporal)
    print("=" * 78)
    print(f"Findings the briefing would receive: {len(findings)}")
    for f in findings:
        print(f"  [{f.area}] {f.theme} — cluster {f.cluster_size}, ~{f.hours_saved_low}-{f.hours_saved_high} h, artefact: {f.artefact}" + (f" (cadence {f.cadence})" if f.cadence else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
