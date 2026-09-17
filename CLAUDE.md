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
1. `DECISION-REGISTER.md` — what is locked (stack, D1–D5, refinements R1–R12). **§8 holds the 2026-09-17 architecture-research amendments (A1–A6).** No re-litigating.
2. `AGENT-RULES.md` — binding invariants **NG-1…NG-21** (incl. NG-19 actor pseudonymisation, NG-20 dual-key unmask, NG-21 E7 non-attributability). These sit above any manifest.
3. `PRD.md` — vision, personas, all 30 user stories, NFRs, cuts.
4. `specs/` — the 5-level hierarchy (EPIC.md + APP-FUNCTIONS.md per epic) with SW-Function signatures + test cases.
5. `FUNCTION-CHAINS.md` — runtime flow, cross-module bridges B1–B5, end-to-end diagram.
6. `SPRINT-PLAN.md` + `manifests/` — build order and per-story change manifests.

## Architecture in one paragraph
The **core is architecture-independent** and is what we build first: E2 Policy Intake,
E3 Inspection + Redaction/Rehydration Engine, E4 Audit Ledger, E6 Management View,
E7 Recurring-Work Intelligence. **The interception question is DECIDED (§8 A1):** a
**browser extension (block-and-warn, E1 — contract for now, decompose after E5)**
plus a **governed chat surface (E5 — the full experience, now DECOMPOSED).** E5 is a
React SPA that renders the solved E3 core; the E1 extension and **deployment (E8
Operations)** stay deferred. The core never imports a provider SDK, a UI framework,
or a gateway; it exposes functions the adapter (E5 now, the E1 extension later)
calls (see `specs/EP-01-gateway-adapter/EPIC.md` for the `InterceptionAdapter`
contract).

- **TypeScript** (`core/`): E3, E4, E6 — Node 20 ESM, strict, Vitest.
- **TypeScript** (`web/`): E5 — React SPA (Vite), strict, Vitest; view-model logic is pure and tested, components render it. Nordic Clarity design system; the Handoff timings ARE the spec (§8 A6).
- **Python** (`sidecar/` existing prototype; `recurring/`): E2 kg-gen extraction; E7 similarity + local embeddings — pytest.
- Shared contract types live once in `core/lib/types.ts` (mirror for Python bridge B4 in `recurring/types.py`); never duplicated. E5 imports these + E3's pure rehydration module (AF-307), never reimplementing core logic.

## The five non-negotiables (full list in AGENT-RULES.md)
- **NG-1 wire isolation:** the redacted wire transcript is the ONLY thing transmitted, ever, including as history. A 10-turn automated test proves no original leaks.
- **NG-5 ledger-before-reply:** one hash-chained entry per request, written before the reply returns, even on provider failure.
- **NG-9 never guess rehydration:** an unmatched placeholder stays visible; no approximate substitution.
- **NG-10 pseudonyms, never originals:** entity resolution uses `HMAC(customerKey, normalize(value))`; full-text retention is opt-in, never default.
- **NG-14 pure transcript engine:** it takes a mapping as input, owns/persists nothing; there is NO server-side mapping store.
- **NG-17 key separation:** the pseudonym key never shares storage/backups with the ledger and never appears in an export. Pseudonyms are HMAC over low-entropy names — dictionary-attackable if key and ledger are co-located; separation is their *only* privacy.
- **NG-18 corpus-validated German normalisation:** `normalizeEntityValue` is gated on `lexicons/de-entity-variants.yml`. Loose normalisation silently produces empty clusters that read as "no duplicated work" — a defect, not an empty week.
- **NG-19 actor pseudonymisation:** the ledger stores `actorPseudonym = HMAC(customerKey, normalize(userId))`, **never a plaintext user id** — even in an export. `assertNoPlaintextActor` guards the append (lands in US-013). Under BAG *objektive Eignung*, per-user rows trigger co-determination even if the UI aggregates.
- **NG-20 dual-key unmask:** recovering a person from a pseudonym needs the Vier-Augen-Prinzip — two named authorisers in distinct roles (IT security + works-council rep); the unmask is itself a logged ledger entry. Interface in E4 (AF-408); secret store in E8 (deferred).
- **NG-21 E7 non-attributable:** recurring-work reports on topics/artefacts, never people — no scoring, ranking, sentiment, or person dimension. This keeps the AI Act Art. 6(3) reading available; the Annex III exposure is an **open legal risk** (§8 A5). **No AI-Act effective-date in code, docs, or copy.**

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
inspection; per-prompt approval workflow. **Do not build the E1 browser extension
yet** (decided, but decompose it only after E5 ships) **or E8 Operations** (incl. the
dual-key secret store — E4 owns only the AF-408 interface). **E5 IS now in scope**
(governed chat surface, Sprint 6). The evidence export shows **pseudonyms, not
entity names** by design (FR-25) and **the actor as a pseudonym, never a plaintext id**
(NG-19) — do not "helpfully" add either. **E7 must never score, rank, or attribute
to a person** (NG-21) and **no AI-Act effective-date goes anywhere** until verified.

## Deployment truths to carry into the customer conversation (see specs/EP-08)
- **Key separation is security, not preference:** key store separate from the ledger, out of ledger backups, out of exports (FR-23).
- **Key rotation is compromise-response, not annual hygiene:** it permanently blanks recurring-work history. Tell customers on routine-rotation policies up front (R5).

## Next steps checklist
- [ ] Scaffold `core/` (package.json, tsconfig strict, vitest) and `recurring/` (pyproject, pytest). `web/` (Vite React SPA) scaffolds at Sprint 6.
- [ ] Sprint 1: US-013 (now incl. NG-19 actor-pseudonym guard) → US-015 → US-018 → US-001 → US-002 → US-003 → US-004 → US-005.
- [ ] Sprint 2: the E3 correctness core, model-first detection (§8 A4), ending on the wire-isolation acceptance test.
- [ ] Sprint 3: adds US-031 (dual-key unmask, AF-408 — NG-20).
- [ ] Sprint 6: E5 governed chat surface (US-032…US-039); then decompose the E1 extension.
- [ ] Keep the pinned embedding model + kg-gen sidecar within NFR-04 (≤8 GB, single host).
- [ ] Before GA: escalate the E7 AI Act Annex III exposure to counsel (open legal risk, §8 A5).
- [ ] Refresh checksums after each session (global rule).
