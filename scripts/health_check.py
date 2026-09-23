"""Health check — confirm each service is reachable before anything depends on it.

Every later integration step starts by running this. A failed check is a clear error
that names the service; there is never a silent fallback. Reads the single config
surface (ng_config). The LLM key is sent in a header, never printed.

Usage:
    python scripts/health_check.py                 # check all, report, exit=#failures
    python scripts/health_check.py --require llm    # only these must pass (others informational)
    python scripts/health_check.py --deep           # actually load the embedding model
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests  # noqa: E402

from ng_config import cfg  # noqa: E402

TIMEOUT = 5


class Result:
    def __init__(self, name: str, ok: bool, detail: str):
        self.name, self.ok, self.detail = name, ok, detail


def check_llm() -> Result:
    """The local OpenAI-compatible model endpoint, and that the configured model is served."""
    try:
        headers = {"Authorization": f"Bearer {cfg.llm_key}"}
        r = requests.get(f"{cfg.llm_url}/models", headers=headers, timeout=TIMEOUT)
        r.raise_for_status()
        ids = [m.get("id") for m in r.json().get("data", [])]
        if cfg.llm_model not in ids:
            return Result("local model", False, f"reachable at {cfg.llm_url} but model '{cfg.llm_model}' not served; has {ids}")
        return Result("local model", True, f"{cfg.llm_url} - model '{cfg.llm_model}' served")
    except Exception as exc:  # noqa: BLE001
        return Result("local model", False, f"unreachable at {cfg.llm_url}: {type(exc).__name__}: {exc}")


def check_backstop() -> Result:
    try:
        r = requests.get(cfg.backstop_health_url, timeout=TIMEOUT)
        r.raise_for_status()
        return Result("backstop service", True, f"{cfg.backstop_health_url} - {r.json()}")
    except Exception as exc:  # noqa: BLE001
        return Result("backstop service", False, f"unreachable at {cfg.backstop_health_url}: {type(exc).__name__}: {exc}")


def check_kg() -> Result:
    try:
        r = requests.get(f"{cfg.kg_sidecar_url}/health", timeout=TIMEOUT)
        r.raise_for_status()
        body = r.json()
        if not body.get("ok"):
            return Result("kg-gen sidecar", False, f"reachable but not ok: {body}")
        return Result("kg-gen sidecar", True, f"{cfg.kg_sidecar_url} - model '{body.get('model')}'")
    except Exception as exc:  # noqa: BLE001
        return Result("kg-gen sidecar", False, f"unreachable at {cfg.kg_sidecar_url}: {type(exc).__name__}: {exc}")


def check_embedder(deep: bool) -> Result:
    try:
        import sentence_transformers  # noqa: F401
    except ImportError:
        return Result("embedding model", False, "sentence-transformers not installed on this host")
    if deep:
        try:
            from sentence_transformers import SentenceTransformer
            m = SentenceTransformer(cfg.embedding_model, revision=cfg.embedding_model_revision)
            dim = m.get_sentence_embedding_dimension()
            return Result("embedding model", True, f"loaded {cfg.embedding_model}@{cfg.embedding_model_revision} - dim {dim}")
        except Exception as exc:  # noqa: BLE001
            return Result("embedding model", False, f"present but failed to load: {type(exc).__name__}: {exc}")
    # shallow: is the model in the HF cache?
    try:
        from huggingface_hub import scan_cache_dir
        repos = {r.repo_id for r in scan_cache_dir().repos}
        if cfg.embedding_model in repos:
            return Result("embedding model", True, f"{cfg.embedding_model} cached (run --deep to load)")
        return Result("embedding model", False, f"{cfg.embedding_model} not yet fetched (run the fetch step)")
    except Exception as exc:  # noqa: BLE001
        return Result("embedding model", False, f"cache check failed: {type(exc).__name__}: {exc}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--require", default="", help="comma-separated subset that MUST pass (default: all)")
    ap.add_argument("--deep", action="store_true", help="actually load the embedding model")
    args = ap.parse_args()

    results = [check_llm(), check_backstop(), check_kg(), check_embedder(args.deep)]
    required = set(filter(None, args.require.split(","))) if args.require else None
    name_to_key = {"local model": "llm", "backstop service": "backstop", "kg-gen sidecar": "kg", "embedding model": "embed"}

    print("NorthGuard health check")
    print("=" * 60)
    failures = 0
    for res in results:
        key = name_to_key[res.name]
        is_required = required is None or key in required
        mark = "OK " if res.ok else ("FAIL" if is_required else "-- ")
        print(f"[{mark}] {res.name:<18} {res.detail}")
        if is_required and not res.ok:
            failures += 1

    print("=" * 60)
    if failures:
        print(f"{failures} required service(s) DOWN — resolve before the dependent step. No fallback.")
    else:
        print("all required services reachable.")
    return failures


if __name__ == "__main__":
    raise SystemExit(main())
