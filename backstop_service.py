"""NorthGuard — E3 LLM backstop service.

The core calls this over localhost (NORTHGUARD_BACKSTOP_URL); it bridges the core's
{system, user, temperature} contract to the local OpenAI-compatible model. Keeping this
adapter here means the core never learns which model or vendor is behind it — it stays
architecture-independent (it calls a function, the adapter calls the model).

    python -m uvicorn backstop_service:app --host 127.0.0.1 --port 8078

Deterministic (temperature 0 by default). The LLM key is read from config and sent in a
header; it is never logged.
"""
from __future__ import annotations

import os
import time

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ng_config import cfg

app = FastAPI(title="NorthGuard backstop service")

# The backstop is on the latency path of every inspection. Bound the model call so a slow
# or swapping local model degrades to rules-only fast (NG-4) instead of hanging the UI.
LLM_TIMEOUT_S = float(os.environ.get("NORTHGUARD_BACKSTOP_LLM_TIMEOUT", "20"))


class InspectIn(BaseModel):
    system: str
    user: str
    temperature: float = 0.0


@app.post("/inspect")
def inspect(req: InspectIn) -> dict:
    t0 = time.perf_counter()
    try:
        r = requests.post(
            f"{cfg.llm_url}/chat/completions",
            headers={"Authorization": f"Bearer {cfg.llm_key}", "Content-Type": "application/json"},
            json={
                "model": cfg.llm_model,
                "messages": [
                    {"role": "system", "content": req.system},
                    {"role": "user", "content": req.user},
                ],
                "temperature": req.temperature,
                "stream": False,
            },
            timeout=LLM_TIMEOUT_S,
        )
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        # Return a clean 503 (no stack trace): the core reads non-2xx as "backstop
        # unavailable" and records reduced coverage (rules-only) rather than failing.
        print(f"[backstop] model unavailable ({type(e).__name__}) after "
              f"{round((time.perf_counter() - t0) * 1000)} ms — degrading to rules-only")
        raise HTTPException(status_code=503, detail="backstop model unavailable") from None
    completion = r.json()["choices"][0]["message"]["content"]
    return {"completion": completion, "model": cfg.llm_model, "latencyMs": round((time.perf_counter() - t0) * 1000, 1)}


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": cfg.llm_model, "endpoint": cfg.llm_url}
