"""
NorthGuard — kg-gen sidecar

A small Python service the Node gateway calls over localhost to turn a company
policy into a protection graph. Python because kg-gen is a Python library; the
gateway stays Node.

    python3 -m venv .venv-kg && source .venv-kg/bin/activate
    pip install kg-gen fastapi uvicorn
    export ANTHROPIC_API_KEY=...
    uvicorn kg_sidecar:app --host 127.0.0.1 --port 8077

Design notes:
  * Extraction is expensive (multi-call LLM). It runs once per distinct policy,
    keyed by content hash, then serves from cache. Never per prompt.
  * kg-gen is LLM-backed, so the same policy can yield a slightly different graph
    run to run. For a governance product that drift is a real problem: a
    customer's protection map should not change between Tuesday and Thursday.
    STABILITY_RUNS extractions are compared by mean pairwise Jaccard over nodes
    and edges; below SI_THRESHOLD the graph is returned flagged as unstable so
    the caller can surface it rather than silently trusting it.
"""

import os
import json
import hashlib
import itertools
import statistics
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel

from kg_gen import KGGen

from ng_config import cfg

# Point kg-gen at the local OpenAI-compatible endpoint (litellm 'openai/<model>' +
# api_base). KG_MODEL can override the model string; the endpoint + key come from the
# single config surface. The key is passed to litellm, never logged.
MODEL = os.getenv("KG_MODEL", f"openai/{cfg.llm_model}")
SI_THRESHOLD = float(os.getenv("KG_SI_THRESHOLD", "0.80"))
STABILITY_RUNS = int(os.getenv("KG_STABILITY_RUNS", "5"))
CACHE_DIR = Path(os.getenv("KG_CACHE_DIR", ".kg-cache"))
CACHE_DIR.mkdir(exist_ok=True)

app = FastAPI(title="NorthGuard kg-gen sidecar")
kg = KGGen(model=MODEL, api_key=cfg.llm_key, api_base=cfg.llm_url)


class PolicyIn(BaseModel):
    policy: str
    context: str | None = "Company data protection policy"
    force: bool = False          # bypass cache
    check_stability: bool = True  # run the SI gate on first extraction


def policy_key(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]


def jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 1.0
    return len(a & b) / len(a | b) if (a | b) else 0.0


def to_dict(graph: Any) -> dict:
    """Normalise a kg-gen Graph into the JSON shape the gateway renders."""
    entities = {str(e) for e in getattr(graph, "entities", set())}
    relations = [
        {"from": str(s), "rel": str(p), "to": str(o)}
        for (s, p, o) in getattr(graph, "relations", set())
    ]
    return {
        "nodes": [{"id": slug(e), "label": e} for e in sorted(entities)],
        "edges": [
            {"from": slug(r["from"]), "to": slug(r["to"]), "rel": r["rel"]}
            for r in relations
        ],
    }


def slug(s: str) -> str:
    return "-".join("".join(c.lower() if c.isalnum() else " " for c in s).split())


def stability_index(graphs: list[dict]) -> float:
    """Mean pairwise Jaccard across node sets and edge sets."""
    scores = []
    for g1, g2 in itertools.combinations(graphs, 2):
        n1 = {n["id"] for n in g1["nodes"]}
        n2 = {n["id"] for n in g2["nodes"]}
        e1 = {(e["from"], e["to"]) for e in g1["edges"]}
        e2 = {(e["from"], e["to"]) for e in g2["edges"]}
        scores.append((jaccard(n1, n2) + jaccard(e1, e2)) / 2)
    return round(statistics.fmean(scores), 4) if scores else 1.0


def extract(policy: str, context: str) -> dict:
    graph = kg.generate(input_data=policy, context=context, cluster=True)
    return to_dict(graph)


@app.post("/graph")
def build_graph(req: PolicyIn):
    key = policy_key(req.policy)
    cached = CACHE_DIR / f"{key}.json"

    if cached.exists() and not req.force:
        payload = json.loads(cached.read_text())
        payload["cached"] = True
        return payload

    if req.check_stability:
        runs = [extract(req.policy, req.context) for _ in range(STABILITY_RUNS)]
        si = stability_index(runs)
        # keep the run with the median node count as the representative graph
        runs.sort(key=lambda g: len(g["nodes"]))
        graph = runs[len(runs) // 2]
    else:
        graph = extract(req.policy, req.context)
        si = None

    payload = {
        "key": key,
        "graph": graph,
        "stability_index": si,
        "stable": None if si is None else si >= SI_THRESHOLD,
        "threshold": SI_THRESHOLD,
        "model": MODEL,
        "cached": False,
    }
    cached.write_text(json.dumps(payload))
    return payload


@app.get("/graph/{key}")
def get_graph(key: str):
    cached = CACHE_DIR / f"{key}.json"
    if not cached.exists():
        return {"error": "not found", "key": key}
    return json.loads(cached.read_text())


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL, "threshold": SI_THRESHOLD, "runs": STABILITY_RUNS}
