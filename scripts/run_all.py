"""One command to bring up the whole NorthGuard system for a tester.

    python scripts/run_all.py

Starts (only if not already healthy): the E3 backstop service, the kg-gen sidecar, the
E7 bridge (B4), the gateway, and the web UI. The local model endpoint is external
(Ollama/LM Studio/…) and must already be running — it is health-checked, never started.
Prints the URLs, then waits; Ctrl+C stops everything this launcher started.

Env comes from the single config surface (.env via ng_config). Use --check to only run
the health check and exit.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import requests  # noqa: E402
from ng_config import cfg  # noqa: E402

NG_ROOT = Path(__file__).resolve().parent.parent


def healthy(url: str) -> bool:
    try:
        return requests.get(url, timeout=2).ok
    except Exception:  # noqa: BLE001
        return False


# (label, health-url, start-cmd, cwd). cmd=None → external, only checked.
def services() -> list[tuple[str, str, list[str] | None, Path]]:
    return [
        ("local model", f"{cfg.llm_url}/models", None, NG_ROOT),
        ("backstop", cfg.backstop_health_url, [sys.executable, "-m", "uvicorn", "backstop_service:app", "--host", "127.0.0.1", "--port", str(cfg.backstop_port), "--log-level", "warning"], NG_ROOT),
        ("kg-sidecar", f"{cfg.kg_sidecar_url}/health", [sys.executable, "-m", "uvicorn", "kg_sidecar:app", "--host", "127.0.0.1", "--port", str(cfg.kg_sidecar_port), "--log-level", "warning"], NG_ROOT),
        ("e7-bridge", "http://127.0.0.1:8079/health", [sys.executable, "-m", "uvicorn", "e7_bridge:app", "--host", "127.0.0.1", "--port", "8079", "--log-level", "warning"], NG_ROOT),
        ("gateway", "http://127.0.0.1:8080/api/health", ["npx", "vite-node", "../gateway/server.ts"], NG_ROOT / "core"),
        ("web", f"http://127.0.0.1:{cfg.web_port}/", ["npm", "run", "dev"], NG_ROOT / "web"),
    ]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="run the health check and exit")
    args = ap.parse_args()

    if args.check:
        return subprocess.call([sys.executable, str(NG_ROOT / "scripts" / "health_check.py")])

    if not healthy(f"{cfg.llm_url}/models"):
        print(f"FATAL: local model endpoint not reachable at {cfg.llm_url} — start it first (Ollama/LM Studio). No fallback.")
        return 1

    procs: list[tuple[str, subprocess.Popen]] = []
    for label, health_url, cmd, cwd in services():
        if cmd is None:
            print(f"[external] {label}: {'OK' if healthy(health_url) else 'DOWN'}")
            continue
        if healthy(health_url):
            print(f"[skip] {label} already running ({health_url})")
            continue
        print(f"[start] {label}: {' '.join(cmd)} (cwd {cwd.name})")
        procs.append((label, subprocess.Popen(cmd, cwd=str(cwd), env=os.environ, shell=(os.name == "nt"))))

    # Wait for each to report healthy.
    for label, health_url, cmd, _ in services():
        if cmd is None:
            continue
        for _ in range(60):
            if healthy(health_url):
                print(f"[up] {label}: {health_url}")
                break
            time.sleep(1)
        else:
            print(f"[WARN] {label} did not become healthy at {health_url}")

    print("\nNorthGuard is up:")
    print(f"  Web UI (LAN):   http://<this-machine-ip>:{cfg.web_port}/")
    print(f"  Web UI (local): http://127.0.0.1:{cfg.web_port}/")
    print(f"  Gateway:        http://127.0.0.1:8080/api/health")
    print("Ctrl+C to stop everything this launcher started.")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        for label, p in procs:
            print(f"[stop] {label}")
            p.terminate()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
