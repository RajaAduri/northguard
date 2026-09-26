#!/usr/bin/env python
"""S9 P1 step 4 — is the placeholder contamination model weakness or prompt design?

For each (model x prompt-design x test-prompt) we ask the local provider stand-in and count
INVENTED placeholders in the reply: any ⟨…⟩ token that was NOT in the input. A clean prompt
should yield zero. We compare the OLD forwarding prompt (always-on, seeded with the example
tokens ⟨Preis⟩/⟨Kundenname⟩) against the NEW design (buildForwardMessages: preserve-only, no
examples, omitted entirely on a clean wire) across gemma3:4b and qwen2.5:7b-instruct.

Run: PYTHONIOENCODING=utf-8 python scripts/p1_contamination_experiment.py
"""
import json
import os
import re
import sys
import urllib.request

LLM_URL = os.environ.get("LOCAL_LLM_URL", "http://127.0.0.1:11434/v1")
MODELS = ["gemma3:4b", "qwen2.5:7b-instruct"]
PLACEHOLDER = re.compile(r"⟨[^⟩]*⟩")

OLD_SYSTEM = (
    "Du bist ein hilfreicher Assistent. Antworte auf Deutsch. Platzhalter in spitzen "
    "Klammern wie ⟨Preis⟩ oder ⟨Kundenname⟩ sind bewusst maskiert — gib sie unverändert "
    "wieder und rate ihren Inhalt nicht."
)
BASE = "Du bist ein hilfreicher Assistent. Antworte auf Deutsch."
PRESERVE = (
    " Einige Angaben im Text wurden durch Platzhalter in spitzen Klammern der Form ⟨…⟩ "
    "ersetzt. Gib jeden Platzhalter, der im Text vorkommt, unverändert und an derselben "
    "Stelle wieder. Führe keine neuen Platzhalter ein und rate ihren Inhalt nicht."
)

# (id, has_mask, user_prompt)
PROMPTS = [
    ("clean_summary", False, "Fasse die Vorteile von Wärmepumpen für Gewerbekunden in drei Sätzen zusammen."),
    ("clean_email", False, "Schreibe eine kurze, freundliche Antwort-E-Mail an einen Kunden, der nach dem Liefertermin gefragt hat."),
    ("masked_two", True, "Schreib eine E-Mail an ⟨E-Mail-Adresse 1⟩ zu den Konditionen von ⟨Lieferant 1⟩."),
]


def new_system(user: str) -> str:
    return BASE + PRESERVE if PLACEHOLDER.search(user) else BASE


def ask(model: str, system: str, user: str) -> str:
    body = json.dumps({
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0,
        "stream": False,
        "max_tokens": 240,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{LLM_URL}/chat/completions", data=body,
        headers={"content-type": "application/json", "authorization": "Bearer not-required"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    return data["choices"][0]["message"]["content"]


def invented(user: str, reply: str) -> list[str]:
    given = set(PLACEHOLDER.findall(user))
    return [t for t in PLACEHOLDER.findall(reply) if t not in given]


def preserved(user: str, reply: str) -> tuple[int, int]:
    given = PLACEHOLDER.findall(user)
    kept = sum(1 for t in given if t in reply)
    return kept, len(given)


def main() -> None:
    results = []
    for model in MODELS:
        for design, sysfn in (("old", lambda u: OLD_SYSTEM), ("new", new_system)):
            for pid, has_mask, user in PROMPTS:
                try:
                    reply = ask(model, sysfn(user), user)
                except Exception as e:  # noqa: BLE001 — record and continue
                    results.append({"model": model, "design": design, "prompt": pid, "error": str(e)})
                    print(f"[{model} | {design} | {pid}] ERROR {e}")
                    continue
                inv = invented(user, reply)
                kept, total = preserved(user, reply)
                row = {
                    "model": model, "design": design, "prompt": pid, "has_mask": has_mask,
                    "invented": inv, "invented_count": len(inv),
                    "preserved": f"{kept}/{total}", "reply": reply.strip(),
                }
                results.append(row)
                print(f"[{model} | {design:>3} | {pid:<13}] invented={len(inv)} {inv}  preserved={kept}/{total}")

    out = os.path.join(os.path.dirname(__file__), "p1_contamination_results.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n=== invented-placeholder totals (lower is better) ===")
    for model in MODELS:
        for design in ("old", "new"):
            rows = [r for r in results if r.get("model") == model and r.get("design") == design and "invented_count" in r]
            tot = sum(r["invented_count"] for r in rows)
            clean = sum(r["invented_count"] for r in rows if not r["has_mask"])
            print(f"  {model:<22} {design:>3}: total={tot}  (on clean prompts={clean})")
    print(f"\nfull transcripts → {out}")


if __name__ == "__main__":
    main()
