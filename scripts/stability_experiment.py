"""Experiment 1 — extraction stability across the test corpus (real services).

For each published policy in test-corpus/policies/, runs the kg-gen sidecar's stability
measurement (mean pairwise Jaccard over STABILITY_RUNS extractions) and records the
stability index, whether it clears the threshold, and the graph size. Runs on a bounded
substantive excerpt of each policy (the local 4B model cannot extract a full multi-page
policy in tractable time — see SESSION-LOG Int-8).

    KG_STABILITY_RUNS=3 KG_CLUSTER=0 KG_CHUNK_SIZE=1500 uvicorn kg_sidecar:app --port 8077
    python scripts/stability_experiment.py

--alt-model rewrites via the alternate model to tell "German is hard to extract" apart
from "this model is weak" (a low index with one model is not yet a finding).
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import requests  # noqa: E402
from pypdf import PdfReader  # noqa: E402
from ng_config import cfg  # noqa: E402

CORPUS = Path(__file__).resolve().parent.parent / "test-corpus" / "policies"
EXCERPT_CHARS = 4500


def excerpt(pdf: Path) -> str:
    txt = "\n".join((p.extract_text() or "") for p in PdfReader(str(pdf)).pages)
    # Skip the cover/table-of-contents; take a substantive middle slice of real text.
    start = min(len(txt) // 10, 800)
    return txt[start:start + EXCERPT_CHARS]


def measure(policy: str) -> dict:
    t0 = time.time()
    r = requests.post(f"{cfg.kg_sidecar_url}/graph", json={"policy": policy, "context": "Betriebliche KI-/Datenschutzrichtlinie", "check_stability": True, "force": True}, timeout=1200)
    r.raise_for_status()
    d = r.json()
    return {"si": d.get("stability_index"), "stable": d.get("stable"), "threshold": d.get("threshold"),
            "nodes": len(d["graph"]["nodes"]), "edges": len(d["graph"]["edges"]), "model": d.get("model"), "elapsed_s": round(time.time() - t0, 1)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--alt-model", action="store_true", help="note: run against LOCAL_LLM_MODEL_ALT (restart the sidecar with KG_MODEL set) to compare")
    ap.parse_args()

    pdfs = sorted(CORPUS.glob("*.pdf"))
    print(f"Stability experiment — {len(pdfs)} policies, sidecar model in use, excerpt {EXCERPT_CHARS} chars")
    print("=" * 80)
    rows = []
    for pdf in pdfs:
        try:
            res = measure(excerpt(pdf))
            rows.append((pdf.name, res))
            print(f"{pdf.name[:44]:<46} SI={res['si']} stable={res['stable']} nodes={res['nodes']} edges={res['edges']} model={res['model']} {res['elapsed_s']}s")
        except Exception as exc:  # noqa: BLE001
            print(f"{pdf.name[:44]:<46} FAILED: {type(exc).__name__}: {exc}")
    print("=" * 80)
    lows = [n for n, r in rows if r["si"] is not None and r["si"] < (r["threshold"] or 0.8)]
    if lows:
        print(f"LOW stability ({', '.join(lows)}). A low index with ONE model is not a finding — "
              f"rerun at least one doc against {cfg.llm_model_alt} (restart sidecar: KG_MODEL=openai/{cfg.llm_model_alt}) before concluding German is the cause.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
