# NorthGuard — Product Requirements Document
**Version:** 1.0
**Date:** 2026-09-13
**Owner:** Raja Aduri · Saatwika UG (ShiftNorth)
**Status:** REVIEW
**Tech Stack:** TypeScript (Node 20, ESM) core · Python 3.11/FastAPI kg-gen sidecar + local embeddings · hash-chained JSONL ledger · static SPA (Nordic Clarity, deferred)

> Generated with the dev-blueprint methodology. This PRD decomposes the
> **architecture-independent core** (E2, E3, E4, E6, E7) **and the governed chat
> surface (E5)** to file level. **Amended 2026-09-17 (DECISION-REGISTER §8):** the
> interception architecture is decided — a **browser extension (block-and-warn, E1)
> plus a governed chat surface (E5, the full experience)**. E5 is now decomposed; E1
> stays a contract (decompose after E5); E8 Operations stays deferred. See
> `DECISION-REGISTER.md` for the epic renumber and locked decisions, and
> `AGENT-RULES.md` for binding invariants (NG-1…**NG-23**, incl. NG-19 actor
> pseudonymisation, NG-20 dual-key unmask, NG-21 E7 non-attributability, **NG-22
> baselined Schutzprofil, NG-23 business-event record** — Amendment B, §9, spec only).

---

## 2. TLDR

- **What:** A governance layer that turns a written company data policy into an enforced boundary on employee LLM traffic, with an audit-grade evidence trail. The lovable moment is the *redacted reply that still answers the question*, not the block.
- **Who:** DACH SMBs and automotive/MedTech Tier 2/3 suppliers (20–250 people) holding contractually protected IP with no enterprise LLM agreement.
- **Why it matters:** A policy that isn't the path isn't a control. These firms can't negotiate enterprise data terms, can't verify what already left, and can't answer a customer audit about AI data handling.
- **Differentiator:** Compliance-grade, hash-chained, exportable evidence + the only governance layer that returns a *management signal* (recurring-work detection) instead of a violation count.
- **This document's scope:** the buildable core. Everything decomposed ships production-complete (SLC, not MVP). Interception and UI shell are deferred behind precise contracts so the core is not rebuilt when that decision lands.

---

## 3. Problem Statement

Small and mid-sized regulated engineering firms have employees using public LLM
tools with company IP, customer data, and contractual secrets, in violation of
policies that exist on paper and are unenforceable in practice.

- **Who experiences it:** the risk owner (MD / Head of Quality / Compliance lead) who has issued an AI ban they know isn't followed; the engineering lead who quietly concluded the ban is unenforceable; the engineer who just wants an answer.
- **Cost of inaction:** an NDA breach traced to a pasted prompt; a customer audit or supplier questionnaire with an AI-data-handling section they cannot fill in; silent, un-auditable leakage of engineering IP.
- **Why existing solutions fall short:** "AI governance" products are mostly policy documents, training decks, or dashboards that *observe*. None sit in the path. DLP tools don't understand the LLM path or German engineering vocabulary. Enterprise Copilot agreements are unavailable at this firm size.

**The adoption knife-edge:** if the governed path is slower, wronger, or more opaque than opening ChatGPT in another tab, the employee routes around it and the product is *bypassed, silently, while the dashboard shows green*. Every requirement below is subordinate to this.

---

## 4. Product Vision

For **regulated DACH engineering SMBs** who **must prove where their engineering data goes but cannot negotiate enterprise LLM terms**, **NorthGuard** is a **prompt-governance layer** that **turns their written policy into an enforced, audit-traceable boundary while keeping the governed path as fast and useful as the ungoverned one**. Unlike observe-only governance dashboards, NorthGuard **sits in the path, redacts rather than merely blocks, and returns a management signal about where the work is actually hard.**

---

## 5. Target Users & Personas

| Field | Risk Owner (Buyer) | Engineering Lead (Champion) | Engineer (User) |
|-------|--------------------|-----------------------------|-----------------|
| Role | MD / Head of Quality / Compliance / IT-with-risk-hat | Team/engineering lead | Individual engineer |
| Goal | Answer "where does our engineering data go?" with evidence | Convert an unenforceable ban into a permission | Get a good answer to the real question |
| Pain | A customer audit with no answer; an NDA breach via a pasted prompt | Being the enforcer of a ban nobody follows | Governance friction that slows the real work |
| Tech comfort | Medium | High | High |
| Usage frequency | Weekly (briefing, exports) | Weekly (false-positive queue) | Daily (chat) |
| Language that lands | audit trail, evidence, Nachweisbarkeit, supplier questionnaire | "you get to say yes" | "as fast as the tab I was going to open anyway" |

---

## 6. User Stories

IDs are sequential (`US-0NN`). Every story links to its Feature (FT) and App
Functions (AF). Full acceptance criteria for the load-bearing stories are given;
the rest carry their primary criteria (complete Given/When/Then sets live in each
Feature spec under `specs/`).

### Epic E2 · Policy Intake  *(decomposed)*

#### FT-2.1 Policy Ingest
**US-001 — Ingest a policy document**
As a **risk owner**, I want to paste or upload (PDF) our data policy so that NorthGuard has something to protect against.
- AC-1: GIVEN a 3-page German policy pasted as text WHEN I submit it THEN it is normalised and a content hash is computed and shown.
- AC-2: GIVEN a PDF policy WHEN I upload it THEN text is extracted; if extraction yields no text THEN I get a clear error, not a silent empty policy.
- AC-3: GIVEN the same policy submitted twice THEN the same content hash results (idempotent).
**Priority:** P0 · **Sprint:** 1 · **App Functions:** AF-201

#### FT-2.2 Concept Extraction · FT-2.3 Stability Gate
**US-002 — Extract protected concepts once per policy version**
As a **risk owner**, I want the policy turned into a set of protected areas so that I can see what will be enforced.
- AC-1: GIVEN a policy hash not seen before WHEN extraction runs THEN the kg-gen sidecar is called and the graph is cached by hash (NG-6).
- AC-2: GIVEN the same policy hash again WHEN I re-open intake THEN the cached graph is served with no new extraction (FR-03).
- AC-3: GIVEN extraction completes THEN a stability index is computed over `STABILITY_RUNS` runs and returned.
**Priority:** P0 · **Sprint:** 1 · **App Functions:** AF-202, AF-203

**US-003 — Block activation of an unstable extraction**
As a **risk owner**, I want an unstable extraction blocked from activation so that a drifting control is never trusted (NFR-07, NG-3).
- AC-1: GIVEN SI < 0.80 WHEN I view the extracted areas THEN they are marked *unstable* and the activate action is disabled.
- AC-2: GIVEN SI ≥ 0.80 THEN activation becomes possible only after human confirmation (US-005).
- AC-3: GIVEN an unstable graph WHEN I attempt to force activation via the API THEN the activation guard rejects it.
**Priority:** P0 · **Sprint:** 1 · **App Functions:** AF-203, AF-206

#### FT-2.4 Area Confirmation & Manual Edit
**US-004 — Confirm and edit extracted areas**
As a **risk owner**, I want to review, rename, merge, split, or remove suggested areas so that the protected set matches our actual policy before anything is enforced.
- AC-1: GIVEN suggested areas WHEN I rename/merge/split/remove THEN the edited set is validated (no empty set, no duplicate labels).
- AC-2: GIVEN edits made THEN nothing is active until I explicitly confirm (NG-3).
**Priority:** P0 · **Sprint:** 1 · **App Functions:** AF-204

#### FT-2.5 Area Mode Assignment & Activation
**US-005 — Assign per-area mode and activate**
As a **risk owner**, I want to set each area to block or redact and then activate so that enforcement begins on my explicit decision.
- AC-1: GIVEN a confirmed, stable area set WHEN I set each area's mode and confirm THEN the policy version activates and a governance event is written to the ledger (NG-12).
- AC-2: GIVEN no confirmed areas THEN no prompt is forwarded (fresh-install lock from the design).
**Priority:** P0 · **Sprint:** 1 · **App Functions:** AF-205, AF-206

### Epic E3 · Inspection & Decision + Redaction/Rehydration Engine  *(decomposed)*

**US-006 — Deterministic rules detection (DE+EN, <50 ms, no network)**
As the **system**, I must run the rules layer first with no network call so that clean prompts are invisible to the user (NFR-01, NG-7).
- AC-1: GIVEN a clean prompt WHEN inspected THEN rules complete in <50 ms p95 and report no hits.
- AC-2: GIVEN "Zielmarge von 34 %" WHEN inspected THEN the percentage-in-price-context rule matches and maps to *Preise & Margen*.
- AC-3: GIVEN a rules module WHEN imported THEN it has no network dependency (static check).
- AC-4: GIVEN a German compound term in the lexicon THEN it matches in both DE and EN corpora (FR-15, NG-16).
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-301

**US-007 — LLM backstop only when inconclusive; degrade gracefully**
As the **system**, I must invoke the backstop only when rules are inconclusive and record reduced coverage if it's unavailable (FR-07, NFR-08, NG-4).
- AC-1: GIVEN rules are conclusive THEN the backstop is not called.
- AC-2: GIVEN rules inconclusive AND backstop reachable THEN it runs and its findings carry `layer:'llm'`.
- AC-3: GIVEN the backstop unreachable THEN inspection returns rules-only with `coverage:'rules-only'` and the ledger records it (never fail open).
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-302

**US-008 — Assemble verdict with span-level attribution and per-area mode**
As the **system**, I must produce touched areas, a verdict (clean/redact/block), and per-span attribution so that a false-positive report is actionable (FR-08b, FR-09, NG-8).
- AC-1: GIVEN hits in an area set to *block* THEN verdict is `block` and no redacted variant is offered.
- AC-2: GIVEN hits only in *redact* areas THEN verdict is `redact` with spans carrying `{area, layer, ruleId?}`.
- AC-3: GIVEN both rule and LLM hits on the same span THEN caught-by is `rules + LLM`.
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-303

**US-009 — Generate semantic, indexed placeholders**
As the **system**, I must replace sensitive spans with descriptive, indexed placeholders so the model can still reason and the reply stays useful (FR-08a, FR-08f, NG-11).
- AC-1: GIVEN a supplier name WHEN redacted THEN it becomes `⟨Lieferant⟩`, never `[REDACTED]`.
- AC-2: GIVEN two distinct suppliers in one conversation THEN they become `⟨Lieferant 1⟩` / `⟨Lieferant 2⟩`.
- AC-3: GIVEN the same entity twice THEN it maps to the same placeholder.
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-304

**US-010 — Derive keyed pseudonyms per entity**
As the **system**, I must derive `HMAC(customerKey, normalize(value))` per entity so the same entity resolves across conversations without storing the original (R4, NG-10).
- AC-1: GIVEN the same supplier value in two conversations THEN the same pseudonym results (given the same key epoch).
- AC-2: GIVEN inflected forms of the same value WHEN normalised THEN they yield the same pseudonym.
- AC-3: GIVEN a pseudonym THEN it carries its `keyEpoch`; the original never appears in the pseudonym output.
- AC-4: GIVEN the German entity-variant corpus (Brechtmann GmbH / Brechtmann / "Brechtmann GmbH & Co. KG" / brechtmann gmbh) WHEN normalised THEN every group collapses to one pseudonym and distinct entities never collide (FR-24, NG-18).
- AC-5: GIVEN the key material THEN it is never written to the ledger, a ledger backup, or an evidence export (FR-23, NG-17).
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-305

**US-011 — Build wire transcript and enforce two-transcript isolation**
As the **system**, I must ensure the wire transcript is the only content ever transmitted, including as history on later turns (FR-08d, NG-1).
- AC-1: GIVEN a 10-turn conversation with redactions WHEN each turn is sent THEN no original value appears in any outbound payload (asserted by test — §8).
- AC-2: GIVEN prior turns THEN history sent upstream is the wire (redacted) transcript only.
- AC-3: GIVEN `assertWireIsolation()` WHEN an original leaks into a wire message THEN it throws.
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-306

**US-012 — Rehydrate replies locally, declension-tolerant, never guess**
As an **engineer**, I want the provider's placeholders substituted back to originals in my view so I don't do it by hand, and I want it to never guess (FR-08c, FR-08g, FR-08h, NG-9, NG-14).
- AC-1: GIVEN a reply containing `⟨Lieferant⟩` and a client-held mapping THEN the original is restored and visibly marked as locally restored.
- AC-2: GIVEN a German-inflected placeholder (`Lieferants`) that matches with confidence THEN it is restored; the balance line reports values restored.
- AC-3: GIVEN a placeholder that cannot be matched with confidence THEN it stays a visible placeholder and is counted as unresolved — no approximate substitution (NG-9).
- AC-4: GIVEN the rehydration module THEN it is pure and stateless; the mapping is passed in, never owned (NG-14).
**Priority:** P0 · **Sprint:** 2 · **App Functions:** AF-307

### Epic E4 · Audit Ledger  *(decomposed)*

**US-013 — Append-only hash-chained entry writer (+ actor-pseudonym guard)** — AF-401 · P0 · Sprint 1
- AC-1: each entry carries `prevHash`; append is atomic and survives process restart with no gap (NG-5, NFR-06).
- AC-2: **the append refuses any entry carrying a plaintext user identifier** — only `actorPseudonym` (+`actorEpoch`) is permitted (`assertNoPlaintextActor`, NG-19). This lands here, in the first ledger story, before any writer can populate the field.

**US-014 — One request entry per request, written before reply** — AF-402 · P0 · Sprint 2
- AC: exactly one entry per request, written before the reply returns, containing timestamp, **actor pseudonym** (derived from the raw userId; the raw id never lands on the entry — NG-19), prompt hash, touched areas, verdict, mode, caught-by, provider, latency, coverage, and span pseudonyms — never original text (FR-02, NG-2, NG-10, NG-19).

**US-015 — Governance-event writer** — AF-403 · P0 · Sprint 1
- AC: activations, rule tuning, dismissals, exports, and key rotations are appended as governance entries with actor, timestamp, reason (FR-18, NG-12).

**US-016 — Query ledger by date and area** — AF-404 · P1 · Sprint 3
- AC: filter by date range and area; management projection strips fields not permitted in the management context (NG-13).

**US-017 — Export a verifiable evidence bundle** — AF-405, AF-406 · P0 · Sprint 3
- AC-1: export produces CSV + JSONL with a recomputable, unbroken hash chain and a SHA-256 bundle checksum; export itself is a logged governance event; the bundle excludes prompt/response text (FR-11, FR-12).
- AC-2: **the bundle shows pseudonyms, never entity names** (`⟨Lieferant:a3f9⟩`) — a stated design position: it proves decisions and policy application, not what the data was (FR-25, R8).
- AC-3: no key material and no pseudonym preimage appears anywhere in the bundle (FR-23, NG-17).

**US-018 — Ledger durability and backup** — AF-407 · P0 · Sprint 1
- AC-1: a month of entries exports and verifies as an unbroken chain across at least one process restart and one backup/restore cycle (NFR-06).
- AC-2: the pseudonym key is excluded from every ledger backup — the backup contains no key material (FR-23, NG-17).

**US-031 — Dual-key actor unmask (Vier-Augen-Prinzip)** — AF-408 · P0 · Sprint 3
- AC-1: recovering the person behind an `actorPseudonym` requires two named authorisers in **distinct** roles (IT security + works-council rep); a single authoriser, or two in the same role, is rejected (NG-20).
- AC-2: a valid unmask writes its own `govKind:'unmask'` ledger entry recording both authorising parties, timestamp, reason, and the target pseudonym — never the recovered identity; the identity is returned to the authorised callers only (NG-19, NG-20).
- AC-3: the ledger entry is written **before** the identity is returned — an unmask off the record is impossible (mirrors NG-5). Secret storage + role binding are an E8 concern; this story specifies the interface + ledger semantics only (R11).

### Epic E6 · Management View  *(decomposed)*

**US-019 — Exposure concentration over time (no person column)** — AF-601 · P0 · Sprint 3
- AC: per-area touch counts and trend over a range, aggregated across the team with no user dimension anywhere in the model (FR-20, NG-13).

**US-020 — Weekly briefing composition (regenerable)** — AF-602 · P0 · Sprint 4
- AC: a briefing with recurring themes (from E7), a friction read, and a policy-fit note, plus footnote stats; regenerable on demand from the ledger (FR-13). Prose is generated; the *inputs* are deterministic.

**US-021 — Aggregated activity log** — AF-603 · P1 · Sprint 3
- AC: activity rows aggregated; no per-person breakdown in this surface (NG-13).

**US-022 — False-positive review queue and resolutions** — AF-604 · P0 · Sprint 4
- AC: reports grouped by trigger, sorted by repeat frequency; resolutions (narrow rule / exclude term / change area mode / dismiss-with-reason) each write a governance event and notify the reporter; rule-narrowing shows a 30-day impact preview (FR-16, FR-17, FR-18).

**US-023 — Evidence export view** — AF-605 · P0 · Sprint 3
- AC: management can request an export with a stated reason, delegating to AF-405; the document is monospace, checksummed, per-page.

**US-024 — Two-rooms context distinctness** — AF-606 · P1 · Sprint 4
- AC: the management view is visually unmistakable from the engineer surface, entered via a named, dated threshold, not a tab (FR-19).

### Epic E7 · Recurring-Work Intelligence  *(decomposed — the deepest component)*

**US-025 — Content feature extraction over the redacted corpus** — AF-701 · P0 · Sprint 4
- AC: features are built from redacted text + attached pseudonyms only; no original value is ever read from storage (NG-10).

**US-026 — Near-duplicate blocking (MinHash-LSH, Stage 1)** — AF-702 · P0 · Sprint 4
- AC: near-verbatim repeated requests are surfaced as candidate pairs; the stage is deterministic given fixed shingle/permutation parameters.

**US-027 — Semantic clustering (pinned local embeddings, Stage 2)** — AF-703 · P0 · Sprint 5
- AC: prompts about the same document phrased differently cluster together; the pinned model version and cosine threshold are recorded in the audit record; two runs over the same window produce identical clusters (NG-15).

**US-028 — Pseudonym-based entity resolution across conversations** — AF-704 · P0 · Sprint 5
- AC-1: the same pseudonym links occurrences across conversations within a key epoch; clustering never crosses a `keyEpoch`; a window spanning a rotation is flagged with a coverage caveat (R5).
- AC-2: resolution correctness is gated on the German entity-variant corpus (FR-24, NG-18) — because a broken normaliser produces empty clusters that are indistinguishable from a genuinely quiet week.

**US-029 — Temporal pattern detection** — AF-705 · P1 · Sprint 5
- AC: per-cluster trend (rising/steady/falling), weekly cadence (the Friday-CI pattern), and cessation ("no request since Wednesday — likely solved") are detected deterministically.

**US-030 — Hours-saved and artefact synthesis** — AF-706 · P0 · Sprint 5
- AC-1: each finding reports estimated duplicated effort in *hours saved* and names the artefact that would remove it (a stored extract, a phrasing kit); findings are ranked. This is the briefing's headline.
- AC-2: **findings are non-attributable by construction** — no person dimension, no per-individual score/rank, no sentiment/tone field; `assert_non_attributable` (SF-7065) fails the synthesis if one appears (NG-21, AI Act posture — see §10 risks).

### Epic E5 · Governed Chat Surface  *(now decomposed — DECISION-REGISTER §8 A1)*

The full redact-and-continue experience: a React SPA over the E3 core. Behaviour,
timings, and strings follow `prototype/NorthGuard Handoff.md` (§8 A6). Full
file-level decomposition in `specs/EP-05-chat-surface/APP-FUNCTIONS.md`.

**US-032 — Composer state machine** — AF-501 · P0 · Sprint 6
- AC: the §1.1 state inventory (idle→typing→inspecting→clean/touched/blocked/report/report-done/degraded/locked) is implemented as a pure reducer with the §2 timings (600 ms debounce, inspection sweep ≥ 400 ms); Send during typing auto-sends on `clean` but stops on a finding; `locked` until E2 areas confirmed (NG-3); `degraded` overlays and is never hidden (NG-4).

**US-033 — Submission mirror view-model** — AF-502 · P0 · Sprint 6
- AC: the mirror renders a **byte-identical read-only mirror of `redactedPrompt`** (FR-08) with per-span attribution (placeholder · layer · area · report); the blocked variant offers no send, quotes detected spans, and states there is no per-prompt approval (Handoff rule 7).

**US-034 — Reply rehydration view** — AF-503 · P0 · Sprint 6
- AC: consumes E3 `AF-307`; renders full/partial/not-rendered states; unmatched placeholders stay visible with an explicit insert/leave choice — **never guessed** (NG-9); restored content is display-only and never re-enters the wire (NG-1); copy warns of real customer data and offers a redacted copy (Handoff rule 13).

**US-035 — Provider-view toggle + wire transcript** — AF-504 · P0 · Sprint 6
- AC: the "Anbietersicht" toggle appears from the first sent message and shows **only the wire transcript** — including as history (NG-1); footnote copy is state-dependent (§1.4).

**US-036 — i18n catalogue + three-level language** — AF-505 · P0 · Sprint 6
- AC: DE/EN catalogues with 100% key parity (NG-16), DE default; UI copy follows the person, area/rule names follow the policy, wire placeholders + evidence export follow the tenant (fixed at setup — Handoff rule 11).

**US-037 — Motion & design tokens** — AF-506 · P0 · Sprint 6
- AC: the Handoff §2 timing table is encoded as typed tokens driving every animation (fidelity test); §4 colours only (no green, no gradient except the inspection sweep); the system-says-Mono / humans-read-Inter type rule holds.

**US-038 — False-positive report flow** — AF-507 · P0 · Sprint 6
- AC: the report form replaces the mirror in place; context is shared only on an explicit opt-in (Handoff `report.privacy`); submit bridges to E6 `AF-604`; report-done states the rule stays active with a path forward; every report gets a quiet in-conversation reply — even a reasoned "no" (rules 7/8/13).

**US-039 — Two-rooms threshold + management shell** — AF-508 · P1 · Sprint 6
- AC: a named, dated threshold (320 ms fade, no slide) separates the workspace (tool) from the management view (720 px document); the management surface has **no person column** (NG-13); estimates carry a "≈" range and their formula (rule 12); the briefing names pseudonymised clusters + areas, never a person or an original entity (C1, NG-21).

### Amendment B · Baselined Schutzprofil  *(§9 — spec only, NOT built in this pass)*

**US-040 — Multi-pass extraction convergence (onboarding)** — AF-207 · P0 · Amendment B
- AC: extraction re-runs over the same policy version until a pass adds nothing above a materiality threshold (or a pass ceiling); passes run + last-added are recorded and shown to the user; the working set is never active (NG-6 amended — F2).

**US-041 — Clarifying questions (onboarding)** — AF-208 · P0 · Amendment B
- AC: 5–8 questions generated from real ambiguities (never a fixed questionnaire), answerable by a quality lead alone; each answer recorded with the baseline as provenance.

**US-042 — Baseline the Schutzprofil (configuration item)** — AF-209 · P0 · Amendment B
- AC: the confirmed profile is a baseline (version/date/approver/change-request/area-set+modes), immutable between baselines (NG-22); a supersede writes a `govKind:'baseline'` event and the prior stays readable. ⚠ Supersedes built `publishActivePolicy` (F4); stability gates the initial baseline only (F1).

**US-043 — Review cycle → Review-Vorschlag** — AF-609 · P0 · Amendment B
- AC: a periodic review (cadence fortnightly→monthly→quarterly, configurable) produces prioritised proposals (synonym / coverage-gap / dormant-area / mode-mismatch / new-activity), each with numeric evidence + period; **it may propose nothing**; nothing is applied automatically.

**US-044 — Change request → next baseline (Änderungsantrag)** — AF-610 · P0 · Amendment B
- AC: approving a proposal opens a change request (approver + justification, logged); approving the change request creates the next baseline (AF-209) — the only path that changes an active profile (NG-22).

*Amendment B also amends built stories:* **US-014** (request entry gains `features`+`workTopic`+`baselineVersion`, NG-23), **US-022** (`previewRuleNarrowing` returns a real before/after from `features`, F3), **US-025** (E7 loader reads the same business-event record), **US-036** (E5 strings use Schutzprofil/Review-Vorschlag/Änderungsantrag, B6). These are re-opened at the Amendment-B build, not now.

### Deferred epics (contract/spec only — NOT decomposed)

- **US-C1 (E1 Gateway — browser extension, block-and-warn)** — interception surface **decided** (§8 A1): a browser extension. The Interception Adapter Contract (`submitForInspection` / `forwardToProvider`, request/verdict types, failure→ledger rule) lives in `core/lib/types.ts`; **the extension implementation is a contract for now and decomposes after E5 ships.** See `specs/EP-01-gateway-adapter/EPIC.md`.
- **US-C3 (E8 Operations)** — Compose topology, health checks, key storage, log rotation, **and the dual-key unmask secret store + role binding** (NG-20 interface is in E4; storage is here). Deferred; ledger durability/backup moved to E4. See `specs/EP-08-operations/EPIC.md`.

*(US-C2 (E5 Chat Surface) is retired: E5 is now decomposed as US-032…US-039 above.)*

---

## 7. Non-Functional Requirements

| ID | Requirement | Category | Verification |
|----|-------------|----------|--------------|
| NFR-01 | Rules layer adds < 50 ms p95 | Performance | Benchmark in `AF-301` test |
| NFR-02 | Full inspection adds < 800 ms p95 before provider call | Performance | Inspection benchmark |
| NFR-03 | Streaming replies begin within 1.5 s p95 end-to-end | Performance | Deferred to E1 (adapter) |
| NFR-04 | Single host, ≤ 8 GB RAM (incl. local embedding model) | Deployment | Memory profile of sidecar + embeddings |
| NFR-05 | No prompt content leaves customer infra except to the provider (wire only) | Security | `wire-isolation` egress test (NG-1/NG-2) |
| NFR-06 | Ledger survives process restart with no gap | Data | `US-018` restart test |
| NFR-07 | Policy stability index ≥ 0.80 — **Amendment B (§9 B1): an onboarding convergence signal, not a per-activation gate.** Gates the initial baseline; a change-request baseline is approval-gated (NG-22). Measurement kept, not deleted. | Correctness | `activation-guard` test (NG-3) — onboarding baseline; ⚠ F1 to reconcile at the Amendment-B build |
| NFR-08 | Graceful degradation: backstop down → rules-only, coverage recorded | Reliability | `degradation-recorded` test (NG-4) |
| NFR-09 | Recurring-work results reproducible: same input → same clusters | Correctness | `resolution-determinism` test (NG-15) |
| NFR-10 | Bilingual DE/EN throughout (UI + lexicons) | i18n | Lexicon completeness check (NG-16) |

**Additional functional requirements (from scoping):**

| ID | Requirement | Verification |
|----|-------------|--------------|
| FR-23 | Key separation: the pseudonym key never shares storage or backups with the ledger; excluded from ledger backups and evidence exports | `key-separation` test (NG-17) + E8 storage-separation deployment check |
| FR-24 | German normalisation is validated against a maintained entity-variant corpus; silent under-clustering is a defect | `de-entity-normalisation` corpus test (NG-18), part of E7 acceptance |
| FR-25 | Evidence export shows pseudonyms, not entity names (stated design position) | Export schema test: pseudonyms present, no entity-name preimage (R8) |
| FR-26 | Actor pseudonymisation: the ledger stores `actorPseudonym`, never a plaintext user id — even in an export (BAG *objektive Eignung*, §87(1) Nr. 6 BetrVG) | `actor-pseudonymisation` test (NG-19); `assertNoPlaintextActor` at append |
| FR-27 | Dual-key actor unmask: recovering a person requires the Vier-Augen-Prinzip (two distinct-role authorisers) and is itself a logged ledger entry | `unmask-dual-authorisation` test (NG-20); interface in E4 (AF-408), secret store in E8 |
| FR-28 | Recurring-work intelligence is aggregate and non-attributable — no person dimension, scoring, ranking, or sentiment (AI Act posture; open legal risk) | `e7-non-attributable` test (NG-21); `assert_non_attributable` gates synthesis |
| FR-29 | The protection profile is a **baselined configuration item** (version/date/approver/change-request/area-set), immutable between baselines; the only change path is an approved Änderungsantrag (Amendment B §9 B1) | `baseline-immutability` test (NG-22) |
| FR-30 | Onboarding **converges over multiple passes** and asks **5–8** clarifying questions generated from real ambiguities; convergence is shown to the user; answers are baseline provenance (§9 B2/B3) | AF-207/AF-208 tests; onboarding < ~20 min |
| FR-31 | A periodic **review** produces a Review-Vorschlag (evidence in numbers + period, may propose nothing); proposals become an Änderungsantrag → next baseline (§9 B4) | AF-609/AF-610 tests; cadence fortnightly→monthly→quarterly |
| FR-32 | The inspection record is a **business-event record** (features + work topic, never who) serving both the E6 narrowing preview and E7 — one store (§9 B5) | `business-event-record` test (NG-23) |

---

## 8. Success Metrics & the "Complete" bar

v1 ships when all are true (SLC pack §5.8):

- [ ] A 3-page real German policy extracts, passes the stability gate, and is human-confirmed in < 10 minutes.
- [ ] 20 engineers use it for 2 weeks with no bypass observed and no unhandled error.
- [ ] p95 added latency within NFR-02.
- [ ] A month of ledger exports and verifies as an unbroken chain.
- [ ] **Wire-transcript isolation verified** across a 10-turn conversation with redactions — asserted by an automated test, not inspection (the load-bearing correctness test).
- [ ] A weekly briefing produces at least one insight the manager did not already know.
- [ ] False-block rate < 1 per user per week.
- [ ] Everything in the UI works; nothing labelled "coming soon".

| Metric | Target | Measured By | When |
|--------|--------|-------------|------|
| Human-confirm time for a 3-page policy | < 10 min | Pilot observation | Pilot |
| Added p95 latency (full inspection) | < 800 ms | Benchmark harness | CI + pilot |
| Ledger chain verification | 100% unbroken over a month | `verifyChain` | Continuous |
| False-block rate | < 1 / user / week | FP queue + ledger | Weekly |
| Briefing insight rate | ≥ 1 novel insight / week | Manager interview | Weekly |

---

## 9. Constraints & Assumptions

- **Constraints:** solo founder; single host ≤ 8 GB; customer infrastructure deployment; DACH data residency; no auth/tenant/billing.
- **Assumptions:** the customer can produce a written policy (the hard kill signal if not); the customer holds their own provider key (D3); a local embedding model fits alongside the backstop within NFR-04.
- **Dependencies:** `kg-gen` (MIT); a pinned local embedding model; the interception decision (blocks E1/E5/E8 only).

---

## 10. Risks

| Risk | Impact | Prob. | Mitigation |
|------|--------|-------|------------|
| **AI Act Annex III (high-risk) applies to recurring-work detection (E7/FR-21)** | **H** | **M** | **OPEN LEGAL RISK (§8 A5) — not resolved in code.** E7 constrained to topics/artefacts, non-attributable, no scoring/ranking/sentiment (NG-21), to keep the Art. 6(3) reading available; no AI-Act effective-date stated anywhere until verified. Escalate to counsel before GA. |
| Profile drifts silently as extraction re-runs | H | M | **Amendment B (§9 B1):** the profile is a baselined configuration item, immutable between baselines (NG-22); the only change path is a reviewed Änderungsantrag. |
| Onboarding too long → a 60-person supplier abandons it | H | M | Multi-pass convergence shown as earned (AF-207); 5–8 questions from real ambiguities, onboarding < ~20 min (AF-208, §9 B3). |
| A person-level log undermines the Betriebsvereinbarung | M | M | **Amendment B (§9 B5):** the record is a business-event record (features + work topic, never who — NG-23), materially easier to defend than an aggregated-after-the-fact person log. |
| Works-council co-determination (§87(1) Nr. 6 BetrVG) blocks deployment | H | M | Actor pseudonymisation (NG-19) + dual-key unmask (NG-20) make the Betriebsvereinbarung signable; co-determination is not avoidable (*objektive Eignung*), so the design makes it easy to agree to (§8 A2/A3) |
| Interception surface (extension) can't do in-place redaction | M | M–H | **Decided (§8 A1):** E5 governed chat surface delivers the full experience; the E1 extension is block-and-warn coverage — "use ours and it's better; go elsewhere and we still catch you" |
| Interception decision changes the surface | L | L | Now decided (browser extension + E5); core stays architecture-independent, so a later change is contained |
| False-block rate can't get under 1/user/week | H | M | FP loop (US-022), rule narrowing with impact preview, span-level attribution for actionability |
| Recurring-work resolution weak without originals | M | M | Keyed pseudonyms (NG-10) enable cross-conversation linking without full text; two-stage similarity catches semantic duplicates |
| Local embedding model breaks NFR-04 (RAM) | M | M | Pin a small model; cache vectors; MinHash Stage 1 reduces embedding volume |
| Extraction drift undermines trust | H | L | Stability gate ≥ 0.80, blocked activation (NG-3) |
| Key rotation orphans historical clusters | L | L | `keyEpoch` scoping + coverage caveat in briefing (R5) — intended behaviour, documented |
| Customer runs routine annual key rotation and silently loses recurring-work history | M | M | Deployment guidance (E8): rotation is compromise-response, not scheduled hygiene; the analytics cost is stated up front, not discovered by a confused quality lead (R5) |
| Pseudonym reversed via dictionary attack (low-entropy names) | H | L | Key separation from ledger/backups/exports (FR-23, NG-17) — the pseudonym's only privacy |
| Loose normalisation → empty clusters mistaken for a quiet week | M | M | German entity-variant corpus gates E7 acceptance (FR-24, NG-18) |

---

## 11. Release Strategy & Cuts

**Sprint sequencing** (full detail in `SPRINT-PLAN.md`):

1. **Sprint 1 — Ledger + Policy Intake foundation** (E4 writer incl. actor-pseudonym guard/durability/governance, E2 ingest/extract/stability/confirm/activate)
2. **Sprint 2 — Inspection + Transcript Engine** (E3 all AFs; the correctness core; model-first detection per §8 A4)
3. **Sprint 3 — Ledger query/export + dual-key unmask + Management read-models** (E4 query/export/**AF-408 unmask (US-031)**, E6 exposure/activity/export view)
4. **Sprint 4 — Briefing + FP loop + Recurring-work Stage 1** (E6 briefing/FP/context, E7 features + MinHash)
5. **Sprint 5 — Recurring-work Stage 2 + synthesis** (E7 embeddings/resolution/temporal/synthesis; non-attributability gate NG-21)
6. **Sprint 6 — Governed Chat Surface (E5)** (US-032…US-039: composer/mirror/reply/provider-view/i18n/tokens/FP-report/two-rooms — React SPA over the solved core). *The E1 browser extension decomposes after this.*

**Cuts made to hold the SLC "Complete" standard** (see `DECISION-REGISTER.md` §7):

- **C1 — No naming of *original* entity identities in the briefing.** Originals aren't in the ledger by design. The briefing names the *pseudonymised cluster* and the *area* ("4 people, same supplier document, area Lieferanten & Konditionen"), not "Brechtmann GmbH". This is complete behaviour under the privacy model, not a partial feature. If identity-level naming is later deemed essential, the only honest route is per-deployment full-text opt-in — a governance choice, never a default (NG-10).
- **C2 — File/image prompt inspection removed** (SLC pack §5.3): text prompts only.
- **C3 — Per-prompt approval / request-release workflow removed** (SLC pack §5.3): contradicts structural aggregation and creates the wait that causes bypass.

No decomposed feature ships as a stub.

---

## 12. Appendix: Functional Hierarchy Summary

Full traceability matrix (US → FT → AF → SF → file → test) is generated in
Phase 6 and lives in `manifests/traceability-matrix.md`. Epic-level summary:

| Epic | Status | Features | App Functions | ~SW Functions |
|------|--------|----------|---------------|---------------|
| E1 Gateway (browser extension, block-and-warn) | Decided; contract only (decompose after E5) | — | — (interface only) | — |
| E2 Policy Intake (+ baselined Schutzprofil, §9) | Decomposed | 8 | AF-201…209 (9; AF-207/208/209 spec'd, not built) | ~29 |
| E3 Inspection + Transcript | Decomposed | 7 | AF-301…307 (7) | ~28 |
| E4 Audit Ledger | Decomposed | 7 | AF-401…408 (8) | ~29 |
| E5 Chat Surface (governed) | **Decomposed** | 8 | AF-501…508 (8) | ~35 |
| E6 Management View (+ review cycle, §9) | Decomposed | 8 | AF-601…610 (8; AF-609/610 spec'd, not built) | ~30 |
| E7 Recurring-Work | Decomposed | 6 | AF-701…706 (6) | ~23 |
| E8 Operations | Deferred | — | — | — |

Per-epic decomposition with SW-Function signatures, test cases, and dependencies
is in `specs/EP-0N-*/`. Runtime flow is in `FUNCTION-CHAINS.md`.
