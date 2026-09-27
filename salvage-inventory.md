# NorthGuard — Salvage Inventory

**Date:** 2026-09-27 · **Scope:** read-only audit of `inputs/northGuard` for re-founding on a
locked HTML frontend. **Nothing was changed** except this file.

**Method:** ran the existing test suites, smoke-imported the services, checked ports/Ollama,
and read the lexicons/types. Results below are what actually happened on this machine today.

## Test results (this run)
| Suite | Command | Result |
|-------|---------|--------|
| Core (TypeScript engine) | `cd core && npm test` | **350 passed** (101 files) |
| Web (React SPA) | `cd web && npm test` | **88 passed** (26 files) |
| Recurring-work E7 (Python) | `python -m pytest recurring/` | **59 passed** |
| Type safety | `tsc --noEmit` in core + web | clean |

## The target API seam
`extractPolicy(file)` · `confirmProfile(areas)` · `inspectPrompt(text, profileId)` ·
`logAudit(entry)` · `getManagementStats(range)`.

The **gateway** (`gateway/server.ts`) already exposes almost exactly this seam over HTTP
(`/api/inspect`, `/api/forward`, `/api/report`, `/api/fp-queue`, `/api/briefing`,
`/api/health`) and is the natural adapter for the new frontend. The **core** TypeScript
package is the engine behind every seam function and is architecture-independent (no UI, no
provider SDK). The **React `web/` SPA is superseded** by the locked HTML frontend.

---

## 1. Module → seam mapping

Verdict key: **REUSABLE** = runs and fits as-is · **NEEDS-WORK** = runs but has a known gap ·
**DISCARD** = dead or superseded.

### → `extractPolicy(file)` — policy file to candidate protected areas
| Module | Path | Runs? | Verdict | Reason |
|--------|------|-------|---------|--------|
| Policy ingest | `core/src/features/policy/ingest/` (acceptPolicyInput, extractPdfText, normalizePolicyText, computePolicyHash) | yes (in core 350) | **NEEDS-WORK** | Logic tested; `extractPdfText` is a minimal deterministic extractor — swap a pinned PDF library for real PDFs. |
| Concept extraction | `core/src/features/policy/extract/` (requestConceptGraph, readCachedGraph, mapGraphToAreas) | yes (in core 350) | **NEEDS-WORK** | `mapGraphToAreas` emits graph-node slugs ≠ the canonical area ids the rules use; reconciliation is an open follow-up. |
| Stability + convergence | `core/src/features/policy/stability/`, `.../converge/` | yes (in core 350) | **NEEDS-WORK** | Gate + multi-pass convergence work; the stability index is tautological at temperature 0 (measures determinism, not extraction quality). |
| kg-gen sidecar | `kg_sidecar.py` (:8077) | import OK; needs Ollama | **NEEDS-WORK** | Runs, but on weak local models throws dspy `AdapterParseError` / clustering retry-storms; usable only with `KG_CLUSTER=0` + chunking on an excerpt. |
| (empty) sidecar dir | `sidecar/` | — | **DISCARD** | Empty directory. |

### → `confirmProfile(areas)` — confirm + activate the Schutzprofil
| Module | Path | Runs? | Verdict | Reason |
|--------|------|-------|---------|--------|
| Confirm / edit areas | `core/src/features/policy/confirm/` (buildAreaConfirmationModel, applyManualEdits, validateAreaSet) | yes (core 350) | **REUSABLE** | Pure, tested. |
| Area modes | `core/src/features/policy/modes/` | yes | **REUSABLE** | redact/block per area. |
| Guarded activation | `core/src/features/policy/activate/` | yes | **REUSABLE** | Activation is guarded + written to the ledger (NG-3/NG-12). |
| Baselined profile + change request | `core/src/features/policy/baseline/`, `.../change-request/`, `.../questions/` | yes | **REUSABLE** | Versioned configuration item (NG-22), Änderungsantrag flow, clarifying questions. |
| Onboarding script | `core/onboard_tenant.ts` | ran in Sprint 8 → `.tenant/policy.json` v1.0 | **REUSABLE** | CLI onboarding; there is no web upload flow (frontend concern). |
| Active-policy loader | `gateway/server.ts` `loadPolicy()` | live-proven | **REUSABLE** | Serves the active profile + hash to the seam. |

### → `inspectPrompt(text, profileId)` — inspect, redact, wire, rehydrate
| Module | Path | Runs? | Verdict | Reason |
|--------|------|-------|---------|--------|
| **Verdict core (entry point)** | `core/src/features/inspection/verdict/` (`assembleVerdict`) | yes (core 350) | **REUSABLE** | This *is* `inspectPrompt`: rules → backstop → decision → pseudonyms → placeholders → wire → ledger-before-reply (NG-5) → wire-isolation assert (NG-1). |
| Rules layer | `core/src/features/inspection/rules/` | yes; p95 < 1 ms | **REUSABLE** | Deterministic, no network; needs `lexicons/`. |
| LLM backstop | `core/src/features/inspection/backstop/` | yes | **REUSABLE** | Degrades to rules-only on timeout (NG-4); bounded 12 s. |
| Transcript engine | `core/src/features/inspection/transcript/` (pseudonym, placeholders, wire, rehydrate) | yes | **REUSABLE** | Placeholders + keyed pseudonyms + client-side rehydration (NG-9/10/11/14). |
| Backstop service | `backstop_service.py` (:8078) | import OK; needs Ollama | **REUSABLE** | Bridges core→model; clean 503 + degrade on timeout. Use a ≥7B model. |
| **HTTP gateway** | `gateway/server.ts` (:8080) | live-proven this project | **REUSABLE** | `/api/inspect` + `/api/forward` realise the seam; imports the core, no UI. |
| Forward-prompt builder | `web/src/forward/buildForwardMessages.ts` | yes (web 88) | **REUSABLE (relocate)** | The system-prompt rules (no fabrication F3, ⟨…⟩ blanks F5) are frontend-agnostic; the gateway already imports it — move it out of `web/` into a shared/core spot. |
| Chat UI (composer/mirror/reply/provider-view) | `web/src/composer,mirror,reply,report,provider-view/` | yes (web 88) | **DISCARD (superseded)** | Replaced by the locked HTML frontend. View-model builders + `renderMarkdown` + `ruleDisplayName` are reusable *reference* for rebuilding the same behaviour. |

### → `logAudit(entry)` — append to the hash-chained ledger
| Module | Path | Runs? | Verdict | Reason |
|--------|------|-------|---------|--------|
| Append writer | `core/src/features/ledger/append/` (`appendLedgerEntry`, `setLedgerPath`) | yes (core 350) | **REUSABLE** | This *is* `logAudit`: one hash-chained entry, written before reply (NG-5). |
| Entry builders | `core/src/features/ledger/governance/`, `.../request/` | yes | **REUSABLE** | Governance + request entries; actor pseudonymised (NG-19), reason mandatory (NG-12). |
| Query / export / verify / backup | `core/src/features/ledger/query,export,verify,backup/` | yes | **REUSABLE** | Read-back, CSV/evidence export (pseudonyms only, FR-25), chain recompute, durable backup (NG-17). |
| Dual-key unmask | `core/src/features/ledger/unmask/` | yes | **REUSABLE** | Vier-Augen interface (NG-20); the secret store is deferred to E8. |

### → `getManagementStats(range)` — read-models + recurring-work
| Module | Path | Runs? | Verdict | Reason |
|--------|------|-------|---------|--------|
| Weekly briefing | `core/src/features/management/briefing/` (`composeWeeklyBriefing`) | yes (core 350) | **REUSABLE** | Stats + themes over the ledger; non-attributable (NG-21). |
| Exposure / activity | `core/src/features/management/exposure/`, `.../activity/` | yes | **REUSABLE** | Area touches, trends, activity rows — no person column (NG-13). |
| FP review queue | `core/src/features/management/fp-queue/` (groupReportsByTrigger, …) | yes | **REUSABLE** | Grouped by trigger, wired to the ledger this sprint (F4). |
| Review cycle / context / export-view | `core/src/features/management/review,context,export-view/` | yes | **REUSABLE** | Änderungsantrag review, two-rooms context, export projection. |
| Recurring-work E7 | `recurring/` (features, minhash, resolve, semantic, synthesis, temporal, pipeline) | yes (**59 pytest**) | **NEEDS-WORK** | Pipeline proven, but over-clusters short German prompts at cosine 0.85; needs length-aware similarity + a labelled set, and the pinned embedder. |
| E7 bridge | `e7_bridge.py` (:8079) | import OK; needs embedder | **NEEDS-WORK** | Bridges E7 findings → briefing; requires `intfloat/multilingual-e5-base` loaded. |
| Management UI | `web/src/rooms/`, `web/src/status/` | yes (web 88) | **DISCARD (superseded)** | Replaced by the locked HTML frontend; the view-model builders are reusable reference. |

### → none (infrastructure / tooling / docs)
| Module | Path | Verdict | Reason |
|--------|------|---------|--------|
| Design system tokens | `web/src/design/` (color/type/radii/motion/ui) | **asset** | Nordic Clarity §4 tokens — reuse as the design spec for the new frontend. |
| i18n catalogue | `web/src/i18n/catalogue.ts` | **asset** | ~200 DE/EN UI strings (Handoff §3) — reuse verbatim. |
| Harness + gates | `web/src/harness/` | **DISCARD** | Tied to the React SPA (fidelity/orphan gates). |
| Config surface | `ng_config.py`, `.env(.example)` | **REUSABLE** | One env surface for the Python side. |
| Ops scripts | `scripts/` (run_all, health_check, smoke_test, generate_checksums, expand_query, experiments) | **REUSABLE (tooling)** | Bring-up + health + retrieval helpers; adapt `run_all`/`health_check` to the new frontend. |
| Bytecode | `__pycache__/` | **DISCARD** | Generated. |
| Specs / journey maps / prototype / *.md | `specs/`, `JOURNEY-MAPS/`, `prototype/`, root `*.md` | **asset** | Requirements, decisions, invariants, design reference — keep. |

---

## 2. Preflight — services, ports, models, credentials, tools
| Need | What it is | Check command | Status now |
|------|-----------|---------------|-----------|
| Ollama | Local LLM runtime (OpenAI-compatible) | `curl -s http://127.0.0.1:11434/api/tags` | **UP** |
| qwen2.5:7b-instruct | Forward + backstop model (≥7B needed for placeholders) | `ollama list \| grep qwen2.5` | **present** |
| gemma3:4b / gemma4:e4b | Small / alternate model (stability cross-check) | `ollama list \| grep gemma` | **present** |
| intfloat/multilingual-e5-base | Pinned E7 embedder (NG-15) | `python -c "import sentence_transformers"` | deps **import OK**; model fetched in Sprint 8 (recorded commit `d128…`) |
| backstop service | E3 model backstop | `curl -s http://127.0.0.1:8078/health` | **DOWN** (not started) — imports OK |
| kg-gen sidecar | E2 policy extraction | `curl -s http://127.0.0.1:8077/health` | **DOWN** — imports OK |
| e7 bridge | E7 → briefing | `curl -s http://127.0.0.1:8079/health` | **DOWN** — imports OK |
| gateway | HTTP seam | `curl -s http://127.0.0.1:8080/api/health` | **DOWN** — runs via `npx vite-node gateway/server.ts` |
| vite dev server | Old React SPA | `curl -s http://127.0.0.1:5173/` | **DOWN** — superseded by the locked frontend |
| Node 20 + npm + vitest | TS build/test | `cd core && npm test` | **OK** (350) |
| Python 3.13 + pytest + fastapi/uvicorn/requests/dspy/kg-gen/torch/sentence-transformers | E7 + services | `python -m pytest recurring/` | **OK** (59); all services import |
| Playwright + chromium | screenshots / journey script | `npx playwright --version` | installed (Sprint 9/10) |
| **Credentials** | `LOCAL_LLM_KEY` (=`not-required` for local), `NG_TENANT_SECRET` (pseudonym HMAC key — NG-10/17), key **separation** from the ledger | `cat .env` (gitignored) | `.env` present; demo defaults; **rotate the real key + keep it out of the ledger/backups/exports before any pilot** |
| Tenant state | onboarded policy + ledger | `ls .tenant/` (policy.json, ledger.jsonl) | present (v1.0, hash `cb0fcec`) |

**One-command bring-up:** `python scripts/run_all.py` (starts Ollama-dependent services + gateway + old web). For the re-founding, keep the gateway + Python services; drop the vite step. Use `LOCAL_LLM_MODEL=qwen2.5:7b-instruct` so Ollama keeps one model resident (no swap).

---

## 3. Domain assets (the hard-won content)
| Asset | What it is | Path |
|-------|-----------|------|
| 6 protected-area categories | Kundendaten · Quellcode & Repositories · Lieferanten & Konditionen · Preise & Margen · Projektcodenamen · Zugangsdaten | `lexicons/protected-areas-de.yml` |
| Rule families (DE/EN labels) | RULE-EMAIL (E-Mail-Adresse), RULE-CONTRACT (Vertragsnummer), RULE-PERCENT-PRICE (Prozentangabe im Preiskontext), RULE-REPO (Interner Repository-Name) | `lexicons/protected-areas-de.yml` |
| German entity-variant corpus | Brechtmann / Haltmayer / Nordwerk + legal-form & umlaut cases; the NG-18 normalisation acceptance fixture (groups that must unify + `distinct` pairs that must not) | `lexicons/de-entity-variants.yml` |
| Compliance lexicon (DE/EN) | reference vocabulary for retrieval | `lexicons-ref/compliance-de.yml` |
| Procurement lexicon (DE/EN) | reference vocabulary for retrieval | `lexicons-ref/procurement.yml` |
| Placeholder vocabulary | ⟨Vertragsnummer⟩ ⟨E-Mail-Adresse⟩ ⟨IBAN⟩ ⟨Steuernummer⟩ ⟨Handelsregisternummer⟩ ⟨Marge⟩ ⟨Repository⟩ ⟨Lieferant⟩ ⟨Preis⟩ ⟨Kundenname⟩ ⟨Projektcodename⟩ ⟨Zugangsdaten⟩ | `core/src/features/inspection/transcript/placeholders/classifyEntityType.ts` |
| UI string catalogue | ~200 user-facing strings, DE + EN at parity (Handoff §3) | `web/src/i18n/catalogue.ts` |
| Example policies | 3 real German AI-policy PDFs (GDD Musterrichtlinie, KI-Richtlinie Muster/Vorlage) | `test-corpus/policies/*.pdf` |
| Example prompts + invented tenants | demo prompts (clean/redact/block), Nordwerk/Brechtmann/Haltmayer (NG-23 — no real company names) | `web/src/harness/stateFixtures.ts`, `prototype/*.dc.html` |
| Design reference | Nordic Clarity design + click-through prototype + handoff spec (states, timings, tokens) | `prototype/NorthGuard Chat.dc.html`, `NorthGuard Prototyp.dc.html`, `NorthGuard Handoff.md` |
| Design tokens | colours, fonts (Fraunces/Inter Tight/JetBrains Mono), radii, motion timings | `web/src/design/` |
| Binding invariants | NG-1 … NG-25 + the CI-gate summary | `AGENT-RULES.md` |
| Locked decisions | stack, D1–D5, R1–R12, §8 A1–A6, Amendment B, §10 per-area echo, §11 attachment deferral | `DECISION-REGISTER.md` |
| Shared contract types | the seam's data shapes (Area, InspectionVerdict, LedgerEntry, BriefingInputs, TriggerGroup, …) | `core/lib/types.ts` |
| Runtime evidence | last journey run + per-step screenshots | `evidence/report.json`, `evidence/*.png`, `prototype/screenshots/*.png` |

---

## 4. Bottom line for the re-founding
- **Keep the whole engine:** `core/` (all four features), the `gateway/` HTTP seam, and the
  ledger/inspection/management logic are tested and map cleanly onto the five seam functions.
  The gateway is the adapter the locked HTML frontend should call.
- **Keep the backends, expect setup:** `backstop_service.py` (needs a ≥7B model),
  `kg_sidecar.py` (fragile on weak models), `e7_bridge.py` (needs the pinned embedder).
- **Discard the React frontend** (`web/src/**` UI) — superseded — but lift its **assets**:
  the i18n catalogue, design tokens, `buildForwardMessages`, `renderMarkdown`,
  `ruleDisplayName`, and the view-model builders as behaviour reference.
- **Move `buildForwardMessages` out of `web/`** so the gateway doesn't depend on the
  discarded frontend package.
- **Open gaps to schedule:** `mapGraphToAreas` → canonical area ids; E7 over-clustering
  (length-aware similarity + labelled set); a real PDF extractor; key rotation/separation
  before any pilot.
