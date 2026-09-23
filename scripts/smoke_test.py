"""End-to-end NG-1 smoke test against the RUNNING system (real services, not a unit test).

Walks the core path through the gateway: a prompt with a customer name + email + contract
number -> inspection -> mask -> forward the wire -> reply -> local rehydration -> provider
view. Asserts NO original value appears in ANY outbound payload (the wire sent to the
provider, and the provider's reply). A failure names the leaked value and the path.

    python scripts/smoke_test.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import requests  # noqa: E402
from ng_config import cfg  # noqa: E402

GATEWAY = "http://127.0.0.1:8080"

# The sensitive originals in the prompt. Each must be absent from every outbound payload.
CUSTOMER = "Brechtmann GmbH"
PERSON = "Klaus Meibert"
EMAIL = "klaus.meibert@brechtmann.de"
CONTRACT = "CN-4471"
PROMPT = f"Bitte schreibe eine kurze E-Mail an die {CUSTOMER}, Ansprechpartner {PERSON} ({EMAIL}), zu Vertrag {CONTRACT}."
ORIGINALS = {"customer name": CUSTOMER, "person name": PERSON, "email": EMAIL, "contract number": CONTRACT}


def main() -> int:
    print("NG-1 end-to-end smoke test (real services)")
    print("=" * 64)
    for name, url in [("gateway", f"{GATEWAY}/api/health"), ("local model", f"{cfg.llm_url}/models"), ("backstop", cfg.backstop_health_url)]:
        try:
            requests.get(url, timeout=5).raise_for_status()
        except Exception as exc:  # noqa: BLE001
            print(f"FATAL: {name} not reachable at {url}: {exc}")
            return 2

    verdict = requests.post(f"{GATEWAY}/api/inspect", json={"draftPrompt": PROMPT, "history": [], "conversationId": "smoke", "turnIndex": 0}, timeout=60).json()
    wire = verdict["redactedPrompt"]
    print(f"verdict: {verdict['verdict']} - coverage: {verdict.get('coverage')} - caughtBy: {verdict.get('caughtBy')}")
    print(f"wire (outbound to provider): {wire}")

    # Outbound payload 1: the wire prompt. Payload 2: the provider reply (also crosses back).
    reply = requests.post(f"{GATEWAY}/api/forward", json={"wire": [{"role": "user", "content": wire}]}, timeout=120).json()["completion"]

    leaks: list[tuple[str, str, str]] = []
    for label, value in ORIGINALS.items():
        if value in wire:
            leaks.append((label, value, "outbound wire -> provider (/api/forward request)"))
        if value in reply:
            leaks.append((label, value, "provider reply"))

    print("=" * 64)
    if leaks:
        print("NG-1 VIOLATION — original value(s) in an outbound payload:")
        for label, value, path in leaks:
            print(f"  LEAK: {label} {value!r} in {path}")
        print("\nThis is a stop condition. Do not continue until resolved.")
        return 1
    print("PASS: no original value in any outbound payload (NG-1 holds end-to-end).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
