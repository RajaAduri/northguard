#!/usr/bin/env python3
"""
expand_query.py — Lexicon-Augmented Grep (deterministic, audit-traceable retrieval)

Turns a user query into a lexicon-expanded regex so that lexical search
(grep/ripgrep) finds domain synonyms and cross-language variants that a
naive keyword match would miss.

Design principles (see references/retrieval-architecture.md):
  - Deterministic: same query + same lexicon version = same regex. No embeddings.
  - Audit-traceable: --audit emits a JSON record with the lexicon version,
    the matched entries, and the final regex — attachable to a compliance ledger.
  - Longest-match-wins: multi-word lexicon terms are matched before substrings.

Usage:
  python expand_query.py "ISO 26262 fault tolerance" --lexicon lexicons/compliance-de.yml
  python expand_query.py "Bestellung Lieferant" --lexicon lexicons/procurement.yml --explain
  python expand_query.py "ASPICE Level 3" --lexicon lexicons/compliance-de.yml --audit

Exit codes: 0 = ok, 1 = usage error, 2 = lexicon load error
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not installed. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

try:
    import regex as re_mod
    HAVE_REGEX = True
except ImportError:
    import re as re_mod
    HAVE_REGEX = False


def normalize(text: str) -> str:
    """Lowercase and collapse whitespace/hyphens for matching."""
    return re_mod.sub(r"[\s\-]+", " ", text.strip().lower())


def load_lexicons(paths):
    """Load one or more lexicon YAML files. Returns (entries, versions).

    entries: list of dicts {id, canonical, variants: [str], _source}
    versions: dict {filename: version-string}
    """
    entries, versions = [], {}
    for p in paths:
        path = Path(p)
        if not path.exists():
            raise FileNotFoundError(f"Lexicon not found: {p}")
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "entries" not in data:
            raise ValueError(f"Invalid lexicon format (missing 'entries'): {p}")
        versions[path.name] = str(data.get("version", "unversioned"))
        for e in data["entries"]:
            variants = list(dict.fromkeys([e["canonical"]] + e.get("variants", [])))
            entries.append({
                "id": e.get("id", e["canonical"]),
                "canonical": e["canonical"],
                "variants": variants,
                "_source": path.name,
            })
    return entries, versions


def match_entries(query: str, entries):
    """Find lexicon entries whose canonical or variant appears in the query.

    Longest-match-wins: sort candidate terms by length descending; once a
    span of the query is consumed by a term, shorter overlapping terms are
    ignored.
    """
    q = normalize(query)
    # Build candidate list: (normalized_term, entry)
    candidates = []
    for entry in entries:
        for term in entry["variants"]:
            candidates.append((normalize(term), entry))
    candidates.sort(key=lambda t: len(t[0]), reverse=True)

    consumed = [False] * len(q)
    matched, seen_ids = [], set()
    for term, entry in candidates:
        if not term:
            continue
        start = 0
        while True:
            idx = q.find(term, start)
            if idx == -1:
                break
            end = idx + len(term)
            # word-boundary check
            ok_left = idx == 0 or not q[idx - 1].isalnum()
            ok_right = end == len(q) or not q[end].isalnum()
            overlap = any(consumed[idx:end])
            if ok_left and ok_right and not overlap:
                for i in range(idx, end):
                    consumed[i] = True
                if entry["id"] not in seen_ids:
                    seen_ids.add(entry["id"])
                    matched.append({"entry": entry, "matched_term": term})
            start = end
    # Residual tokens (words not covered by any lexicon entry)
    residual = []
    for m in re_mod.finditer(r"[^\s]+", q):
        if not any(consumed[m.start():m.end()]):
            residual.append(m.group(0))
    return matched, residual


def variant_to_regex(term: str) -> str:
    """Turn a variant into a whitespace/hyphen-tolerant regex fragment."""
    parts = [re_mod.escape(p) for p in re_mod.split(r"[\s\-]+", term.strip()) if p]
    return r"[\s\-]*".join(parts)


def build_regex(matched, residual, fuzzy: bool):
    """Build the final alternation regex.

    Each matched lexicon entry contributes ALL of its variants as an
    alternation group (so a German query also matches English docs and
    vice versa). Residual tokens are included literally.
    """
    groups = []
    for m in matched:
        alts = sorted({variant_to_regex(v) for v in m["entry"]["variants"]},
                      key=len, reverse=True)
        group = "(?:" + "|".join(alts) + ")"
        if fuzzy and HAVE_REGEX:
            group = "(?:" + "|".join(f"(?:{a}){{e<=1}}" for a in alts) + ")"
        groups.append(group)
    for token in residual:
        groups.append(variant_to_regex(token))
    if not groups:
        return None
    # OR semantics by default: any expanded concept is a hit. Callers who
    # need AND semantics should grep per-group and intersect files.
    return "(?i)(?:" + "|".join(groups) + ")"


def main():
    ap = argparse.ArgumentParser(description="Lexicon-augmented query expansion")
    ap.add_argument("query", help="User query in natural language")
    ap.add_argument("--lexicon", action="append", required=True,
                    help="Path to lexicon YAML (repeatable)")
    ap.add_argument("--explain", action="store_true",
                    help="Print human-readable expansion explanation")
    ap.add_argument("--audit", action="store_true",
                    help="Emit JSON audit record instead of plain regex")
    ap.add_argument("--fuzzy", action="store_true",
                    help="Allow 1 edit of tolerance per term (needs 'regex' pkg)")
    args = ap.parse_args()

    try:
        entries, versions = load_lexicons(args.lexicon)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    matched, residual = match_entries(args.query, entries)
    pattern = build_regex(matched, residual, args.fuzzy)

    if args.fuzzy and not HAVE_REGEX:
        print("WARNING: --fuzzy requested but 'regex' package not installed; "
              "falling back to exact matching.", file=sys.stderr)
        print("      Install with: pip install regex", file=sys.stderr)

    if args.audit:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "query": args.query,
            "lexicon_versions": versions,
            "matches": [
                {"id": m["entry"]["id"],
                 "canonical": m["entry"]["canonical"],
                 "matched_term": m["matched_term"],
                 "variants_expanded": m["entry"]["variants"],
                 "source": m["entry"]["_source"]}
                for m in matched
            ],
            "residual_tokens": residual,
            "regex": pattern,
            "fuzzy": bool(args.fuzzy and HAVE_REGEX),
        }
        print(json.dumps(record, ensure_ascii=False, indent=2))
        return 0

    if args.explain:
        print(f"QUERY: {args.query}")
        print(f"LEXICONS: {', '.join(f'{k} (v{v})' for k, v in versions.items())}")
        if matched:
            print("MATCHED ENTRIES:")
            for m in matched:
                print(f"  - {m['entry']['id']} via '{m['matched_term']}' "
                      f"→ {len(m['entry']['variants'])} variants")
        else:
            print("MATCHED ENTRIES: none")
        if residual:
            print(f"RESIDUAL TOKENS: {', '.join(residual)}")
        print("REGEX:")
    if pattern is None:
        print("ERROR: empty query after normalization", file=sys.stderr)
        return 1
    print(pattern)
    return 0


if __name__ == "__main__":
    sys.exit(main())
