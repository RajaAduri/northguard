"""Bridge B4 — the localhost JSON interface from Python E7 to the TypeScript briefing.

The E6 weekly briefing (core, TS) consumes recurring-work findings but never imports
Python. This service runs the E7 pipeline over a ledger window and returns the findings
already shaped for the TS RecurringWorkFinding contract (camelCase), so the core stays
architecture-independent — it fetches findings, it does not compute them.

    python -m uvicorn e7_bridge:app --host 127.0.0.1 --port 8079

The pinned embedder is loaded lazily on first request (NG-15 provenance in modelVersion).
Non-attributable by construction (NG-21): topics/artefacts + hours, never people.
"""
from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from ng_config import cfg
from recurring.pipeline import findings_to_ts, load_ledger_window, run_e7

app = FastAPI(title="NorthGuard E7 bridge (B4)")

_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        from recurring.semantic import default_embedder

        _embedder = default_embedder()
    return _embedder


class FindingsIn(BaseModel):
    ledgerPath: str
    date_from: str | None = None
    date_to: str | None = None
    window_end: str | None = None


@app.post("/recurring-findings")
def recurring_findings(req: FindingsIn) -> dict:
    window = load_ledger_window(req.ledgerPath, req.date_from, req.date_to)
    findings, spanned_rotation = run_e7(window, embedder=_get_embedder(), window_end=req.window_end)
    return {
        "findings": findings_to_ts(findings),
        "count": len(findings),
        "spannedKeyRotation": spanned_rotation,
        "modelVersion": _get_embedder().model_version,
        "entriesScanned": len(window.entries),
    }


@app.get("/health")
def health() -> dict:
    return {"ok": True, "embeddingModel": f"{cfg.embedding_model}@{cfg.embedding_model_revision}"}
