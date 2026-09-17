# NorthGuard — Project Instructions (Claude Code)

LLM prompt-governance gateway for regulated DACH engineering SMBs. This file
orients every Claude Code session in this folder. It supplements — does not
override — the global `~/.claude/CLAUDE.md`.

## What this is
A governance layer that turns a written company data policy into an enforced
boundary on employee LLM traffic, with audit-grade, hash-chained evidence. The
lovable moment is the **redacted reply that still answers the question**, not the
block. SLC, not MVP: everything decomposed ships production-complete.

## Read these first (in order)
1. `DECISION-REGISTER.md` — what is locked (stack, D1–D5, refinements R1–R6). No re-litigating.
2. `AGENT-RULES.md` — binding invariants **NG-1…NG-16**. These sit above any manifest.
3. `PRD.md` — vision, personas, all 30 user stories, NFRs, cuts.
4. `specs/` — the 5-level hierarchy (EPIC.md + APP-FUNCTIONS.md per epic) with SW-Function signatures + test cases.
5. `FUNCTION-CHAINS.md` — runtime flow, cross-module bridges B1–B5, end-to-end diagram.
6. `SPRINT-PLAN.md` + `manifests/` — build order and per-story change manifests.

## Architecture in one paragraph
The **core is architecture-independent** and is what we build: E2 Policy Intake,
E3 Inspection + Redaction/Rehydration Engine, E4 Audit Ledger, E6 Management View,
E7 Recurring-Work Intelligence. The **interception mechanism** (E1 Gateway) and the
**UI shell** (E5 Chat Surface) and **deployment** (E8 Operations) are DEFERRED
behind precise contracts because the interception decision (API gateway vs browser
extension) is still open. The core never imports a provider SDK, a UI framework, or
a gateway; it exposes functions the eventual adapter calls (see
`specs/EP-01-gateway-adapter/EPIC.md` for the `InterceptionAdapter` contract).

- **TypeScript** (`core/`): E3, E4, E6 — Node 20 ESM, strict, Vitest.
- **Python** (`sidecar/` existing prototype; `recurring/`): E2 kg-gen extraction; E7 similarity + local embeddings — pytest.
- Shared contract types live once in `core/lib/types.ts` (mirror for Python bridge B4 in `recurring/types.py`); never duplicated.

## The five non-negotiables (full list in AGENT-RULES.md)
- **NG-1 wire isolation:** the redacted wire transcript is the ONLY thing transmitted, ever, including as history. A 10-turn automated test proves no original leaks.
- **NG-5 ledger-before-reply:** one hash-chained entry per request, written before the reply returns, even on provider failure.
- **NG-9 never guess rehydration:** an unmatched placeholder stays visible; no approximate substitution.
- **NG-10 pseudonyms, never originals:** entity resolution uses `HMAC(customerKey, normalize(value))`; full-text retention is opt-in, never default.
- **NG-14 pure transcript engine:** it takes a mapping as input, owns/persists nothing; there is NO server-side mapping store.
- **NG-17 key separation:** the pseudonym key never shares storage/backups with the ledger and never appears in an export. Pseudonyms are HMAC over low-entropy names — dictionary-attackable if key and ledger are co-located; separation is their *only* privacy.
- **NG-18 corpus-validated German normalisation:** `normalizeEntityValue` is gated on `lexicons/de-entity-variants.yml`. Loose normalisation silently produces empty clusters that read as "no duplicated work" — a defect, not an empty week.

## Running a build session (dev-blueprint Phase 7)
```bash
# 1. Pick the story (see SPRINT-PLAN.md; start with US-013 then US-015/018, then E2).
# 2. Activate its manifest so the hooks enforce it:
cp manifests/US-013.manifest.json .claude/active-manifest.json
# 3. Baseline checksums:
python scripts/generate_checksums.py .
git add -A && git commit -m "chore: pre-session checksums for US-013"
# 4. Start Claude Code IN THIS FOLDER and paste the manifest's agent_prompt.
claude            # or: claude --chrome  (for E5 visual verification, later)
# 5. On Stop, the verify-session hook runs scripts/verify_session.py automatically.
python scripts/verify_session.py --manifest US-013 --baseline manifests/checksums.json
```
The `.claude/settings.json` here wires three hooks: PreToolUse blocks writes to
`protected` paths, PostToolUse runs the file's test, Stop verifies the session.
Manifests for stories without an individual file follow the template in any
existing `manifests/US-*.manifest.json` and are generated from the specs on demand.

## Build rules for every session
- **TDD:** write the test first, watch it fail, then implement (red-green).
- **Chain order:** implement in the manifest's `chain_order` — dependencies first.
- **Scope:** only touch files in the active manifest's `create`/`modify`; never touch `protected`.
- **One SW Function = one file + one test file.** Every App Function folder has an `index.ts` / `__init__.py` entry point.
- **If ambiguous, choose the simpler option — do not ask.** The signatures in `specs/` are zero-question complete.
- No docstrings/comments/type-annotations on code you didn't change (global rule); no `any`; validate only at boundaries.

## Retrieval-aware naming (§ RETRIEVER)
Name files/functions from lexicon vocabulary. The NorthGuard detection lexicon is
`lexicons/protected-areas-de.yml` (DE/EN); reference compliance/procurement
lexicons are in `lexicons-ref/`. Expand queries deterministically:
```bash
python scripts/expand_query.py "Lieferant Konditionen" --lexicon lexicons/protected-areas-de.yml --explain
```

## What NOT to build (cuts — see PRD §11 / DECISION-REGISTER §7)
Naming original entities in the briefing (use pseudonymised clusters); file/image
inspection; per-prompt approval workflow. And do not build E1/E5/E8 — they wait on
the interception decision. The evidence export shows **pseudonyms, not entity names**
by design (FR-25) — do not "helpfully" add names to it.

## Deployment truths to carry into the customer conversation (see specs/EP-08)
- **Key separation is security, not preference:** key store separate from the ledger, out of ledger backups, out of exports (FR-23).
- **Key rotation is compromise-response, not annual hygiene:** it permanently blanks recurring-work history. Tell customers on routine-rotation policies up front (R5).

## Next steps checklist
- [ ] Scaffold `core/` (package.json, tsconfig strict, vitest) and `recurring/` (pyproject, pytest).
- [ ] Sprint 1: US-013 → US-015 → US-018 → US-001 → US-002 → US-003 → US-004 → US-005.
- [ ] Sprint 2: the E3 correctness core, ending on the wire-isolation acceptance test.
- [ ] Keep the pinned embedding model + kg-gen sidecar within NFR-04 (≤8 GB, single host).
- [ ] Refresh checksums after each session (global rule).
