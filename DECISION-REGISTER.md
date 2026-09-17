# NorthGuard — Decision Register
**Project:** NorthGuard — LLM prompt governance gateway
**Owner:** Raja Aduri · Saatwika UG (ShiftNorth)
**Date:** 2026-09-13 · **Amended:** 2026-09-17 (architecture research — see §8) · **Status:** LOCKED for decomposition

> Phase 0 of the dev-blueprint methodology. Every decision a coding agent might
> otherwise have to guess is answered here. No `TBD` entries are permitted; if a
> value below reads `TBD`, decomposition is not ready. This register resolves the
> five open decisions D1–D5 from the SLC pack and the architectural refinements
> agreed during scoping.

---

## 1. Epic numbering (stated once, applies everywhere)

The SLC pack numbered seven epics E1–E7. During scoping the decomposition was
restructured. **E1–E6 keep their original SLC-pack meaning.** Two changes:

| New ID | Name | Origin |
|--------|------|--------|
| E1 | Gateway (browser extension — block-and-warn coverage) | SLC E1 — interception surface **decided** (§8 A1): browser extension. **Contract only for now; decompose after E5 ships.** |
| E2 | Policy Intake | SLC E2 — decomposed |
| E3 | Inspection & Decision + Redaction/Rehydration Engine | SLC E3, **absorbs the transcript engine logic** that would otherwise be trapped in E5 — decomposed |
| E4 | Audit Ledger | SLC E4, **absorbs ledger durability/backup**; **now carries actor pseudonymisation (NG-19) + dual-key unmask (NG-20)** — decomposed |
| E5 | Chat Surface (governed chat surface — the full experience) | SLC E5 — **now DECOMPOSED to file level** (§8 A1): our DOM, in-place redaction, the reply that proves work continues. Logic still comes from the E3 core. |
| E6 | Management View | SLC E6 **minus recurring-work** — decomposed |
| **E7** | **Recurring-Work Intelligence** | **NEW** — split out of SLC E6 FR-21 — decomposed. **AI Act exposure flagged (§8 A5).** |
| **E8** | **Operations** | **was SLC E7** — not decomposed (coupled to interception architecture; holds dual-key secret storage + role binding) |

**Decomposed to file level (buildable SLC core + governed surface):** E2, E3, E4, E5, E6, E7.
**Deferred (architecture-dependent, contract/spec only):** E1 (browser extension — decided, decompose after E5), E8.

---

## 2. The interception architecture — DECIDED (2026-09-17)

The interception question is resolved by the deep-research reports (§8 A1). It is
**a browser extension, not an API gateway** — a network proxy cannot see a prompt
typed into a web AI tool at the point it is composed, and an API gateway sees none
of the shadow-AI traffic that is the product's whole premise. The leak happens in
the browser.

But an extension cannot deliver our designed in-place-redaction experience: React,
Vue and Svelte serialise internal component state on submit, so mutating
`element.value` from a content script transmits the *original* text unless a fragile
synthetic-event sequence is dispatched — which is why most commercial AI-DLP
products ship block-and-warn rather than in-place redaction. So the product has
**two interception surfaces, both implementing `InterceptionAdapter`:**

- **E5 — governed chat surface (the full experience), now DECOMPOSED.** Submission
  mirror, semantic placeholders, redact-and-route, local rehydration, the reply
  that proves work continues. Our DOM, our rules.
- **E1 — browser extension (block-and-warn coverage), contract for now.** Intercepts
  on supported AI sites, holds submission, shows the violation and a sanitised
  string the user can copy in. **No in-place DOM redaction in v1.** Decompose after
  E5 ships. Positioning: *use ours and it is better; go elsewhere and we still catch you.*

**E8 Operations stays deferred** — Docker Compose topology, health checks, process
layout, key storage, and dual-key role binding presuppose the deployment shape and
are built once the surfaces land.

The redaction/rehydration *logic* remains pure and architecture-independent in the
E3 core (see §5); E5 is pixels over that solved core, and the eventual E1 extension
calls the same core.

---

## 3. Locked technical decisions

| Decision | Locked Value | Rationale |
|----------|--------------|-----------|
| Interception architecture | **Browser extension (block-and-warn) + governed chat surface (E5, full experience)** — see §2 and §8 A1 | A proxy/API gateway cannot see prompts at composition and misses shadow-AI traffic; the extension is where the leak is. In-place DOM redaction is unreliable across React/Vue/Svelte, so the extension is block-and-warn and E5 is the full redaction experience. |
| Chat-surface framework (E5) | **React SPA (Vite), TS strict**, local component state + one conversation store, Nordic Clarity design system | Matches the prototype (`northguard-demo.jsx`) and the locked "no global framework" decision (§3 below); view-model logic is pure and Vitest-testable, rendering is React over the E3 core |
| Core language | **TypeScript** (Node 20 LTS, ESM, `strict`) for E3/E4/E6/E7 | Keeps the <50 ms rules path (NFR-01) in-process with the eventual Node gateway; lets the rehydration module be **shared verbatim** between inspection-side and any client surface — the strongest guard against the wire-isolation leak (§8 acceptance test) |
| Extraction sidecar language | **Python 3.11 + FastAPI** wrapping `kg-gen` | kg-gen is a Python library; prototype `kg_sidecar.py` already exists and works. Localhost-only. |
| Similarity/embedding language (E7) | **Python 3.11** (same runtime family as sidecar; local embedding model) | Local embedding inference has better tooling in Python; runs on the backstop host |
| Ledger format | **Append-only hash-chained JSONL** | SLC pack §5.4/§5.7; each line carries `prevHash`; verifiable as an unbroken chain |
| Frontend (deferred E5) | Static SPA, **Nordic Clarity** design system (navy `#0B1220`, teal `#3FBFB0`, amber `#F5A623`; JetBrains Mono, Fraunces, Inter Tight) | From SLC pack §6 and the design PDFs; deferred but design system is fixed so E5 does not re-litigate it |
| TS test framework | **Vitest** | Fast, ESM-native, TS-first |
| Python test framework | **pytest** | Standard; already implied by the sidecar |
| State management (E5, deferred) | Local component state + a single conversation store; no global framework | Micro-tool scope; no Redux/Zustand needed |
| Monorepo vs single | **Single repo, multi-package** (`core/` TS, `sidecar/` Python, `recurring/` Python, `lexicons/` YAML shared) | One deployable unit; matches single-host constraint (NFR-04) |
| Auth / tenant / billing | **None** | Micro Tool blueprint; single-tenant, single-team (SLC pack §1) |

---

## 4. Resolution of open decisions D1–D5

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| **D1** | Provider for v1 — single vs abstraction | **Single provider behind a thin `ProviderClient` seam**, configured per deployment for an **EU-hosted endpoint**. The seam lives behind the E1 adapter (deferred), so the core never imports a provider SDK. | Cross-provider abstraction is premature; the seam costs nothing and preserves the option. EU hosting serves the DACH data-residency wedge. |
| **D2** | Pricing model | **Out of codebase.** Recorded as a commercial decision, not a build input. | No billing epic (Micro Tool). |
| **D3** | Customer-key vs ShiftNorth-key | **Customer's own provider key**, held on customer infrastructure. | SLC pack recommendation D3: removes cost passthrough, removes ShiftNorth from the data path, simplifies the DPA. Key handling is an E8 (deferred) concern behind an interface. |
| **D4** | Prompt retention default | **Hash + redacted text by default. Full-text retention is opt-in per deployment and is NEVER the default** (AGENT-RULES NG-10). | Central privacy claim. Full text is a per-deployment governance choice, not a product default. |
| **D5** | German lexicon depth for v1 | **v1 ships DE+EN lexicons for the six seeded protected areas** (Kundendaten, Quellcode & Repositories, Lieferanten & Konditionen, Preise & Margen, Projektcodenamen, Zugangsdaten) plus the rule families evidenced in the design (email, contract number, percentage-in-price-context, internal repository name). Extensible via `lexicons/*.yml`. | Matches the example deployment in the design PDFs; bounded and complete rather than open-ended. |

---

## 5. Refinement decisions agreed during scoping

| # | Decision | Locked Value | Rationale |
|---|----------|--------------|-----------|
| R1 | Transcript engine placement | In **E3 core**, as a **pure, stateless** module. Accepts a mapping as input; never owns or persists one. **No server-side mapping store anywhere.** | Keeps the hardest correctness requirement (wire isolation) buildable and headless-testable now; honours FR-08e. |
| R2 | Recurring-work similarity | **Two-stage deterministic pipeline**: Stage 1 MinHash-LSH over token shingles (near-verbatim blocking); Stage 2 **pinned local embedding model** (fixed version, cached vectors, fixed cosine threshold, deterministic inference) for semantic clustering. | MinHash alone misses the headline case (same document, different words). Embeddings are deterministic when pinned + cached + fixed-threshold; the 0.80 gate addresses LLM *generation* variance, not vector similarity. |
| R3 | Embedding model | **Pinned local model, version-recorded, runs on the backstop host, no sampling.** Exact model configurable via env; default recorded in `recurring/config`. | Determinism + reproducibility; respects NFR-04 (≤8 GB, single host) and NFR-05 (nothing leaves customer infra). |
| R4 | Cross-conversation entity resolution | **Keyed per-entity pseudonyms**: `pseudonym = HMAC(customerKey, normalize(entityValue))`. Same entity → same token across conversations; ledger stores only the one-way token. | Enables the headline "N people, same supplier" finding **without** full-text retention. NG-10. |
| R5 | Pseudonym key lifecycle | Key lives on **customer infrastructure, never leaves**. Storage/rotation trigger behind a `KeyProvider` interface (physical storage deferred to E8). **Derivation function + rotation semantics are core.** Pseudonyms carry a `keyEpoch`; clustering never crosses epochs; rotation is a logged governance event; briefings spanning a rotation carry a coverage caveat. **Rotation is destructive to analytics: it permanently blanks recurring-work history and fractures any briefing window spanning it.** Therefore rotation is documented (deployment guidance, E8) as **compromise-response, not scheduled hygiene** — a customer whose corporate policy mandates routine annual key rotation must be told, up front, that doing so resets duplicated-work history every year. The coverage caveat on spanning briefings is the mechanism; the deployment guidance is the part that stops a confused quality lead discovering it the hard way. | Re-linking across a rotation is impossible without originals — the privacy guarantee working as designed — but the analytics cost must be stated out loud, not discovered. |
| R6 | SF spec consolidation | SW-Function signatures (file path, interface, signature, 3–5 test cases, dependencies) are authored **inline within each `APP-FUNC.md`** rather than one file per SF. | Keeps the package reviewable; manifests still reference `sf_id` + file path, so traceability is unaffected. Per-SF explosion remains possible later. |
| R7 | Key separation (FR-23, NG-17) | The pseudonym key **never shares storage or backups with the ledger**. It is excluded from ledger backups (`AF-407`) and never appears in an evidence export (`AF-405`). Written as a rule now, even though physical secret storage is deferred to E8. | HMAC over low-entropy values (supplier/customer names) is dictionary-attackable by anyone holding the key. The pseudonym's privacy rests **entirely** on key separation — co-locating key and ledger silently voids it. This must be a build-time invariant, not an E8 afterthought. |
| R8 | Evidence export shows pseudonyms, not entity names (FR-25) | **Stated design position:** an evidence export contains `⟨Lieferant:a3f9⟩`-style pseudonyms and decision metadata, never raw entity names. The export proves *decisions were made and policy was applied*, not *what the data was*. | Correct for the privacy model and consistent with NG-2/NG-10 — but better declared here than discovered by an auditor mid-review. Confirmed intentional. |
| R9 | German normalisation corpus (FR-24, NG-18) | `normalizeEntityValue` (SF-3051) folds German legal forms (GmbH/AG/KG/mbH/e.K./"GmbH & Co. KG"), umlaut/transliteration variance (Müller/Mueller), casing, and dropped-legal-form casual reference. Validated against a maintained corpus, `lexicons/de-entity-variants.yml`, as part of **E7 acceptance**. | Normalisation is where E7 succeeds or fails. Too loose → distinct entities conflate; too aggressive is safer than too loose, but silent under-clustering looks identical to "no duplicated work this week." The corpus makes the failure mode testable, not silent. |
| R10 | Actor pseudonymisation in the ledger (NG-19, §8 A2) | The ledger stores a **pseudonymous actor token**, never a plaintext user id: `actorPseudonym = HMAC(customerKey, normalize(userId))` with the same `keyEpoch` lifecycle and key-separation rule (NG-17) as entity pseudonyms. Lands in **US-013**, the first Sprint-1 story. | Under BAG precedent §87(1) Nr. 6 BetrVG turns on *objektive Eignung* — a system capable of collecting behavioural data triggers co-determination regardless of intent. Anonymising only in the UI (NG-13) does not change the position while per-user ids sit in the tables. Pseudonymising the actor makes the Betriebsvereinbarung signable; co-determination is not avoidable, so make it easy to agree to. |
| R11 | Dual-key de-anonymisation (NG-20, §8 A3) | Unmasking an actor requires the **Vier-Augen-Prinzip**: simultaneous authorisation by two named parties in distinct roles (IT security **and** a works-council representative); neither can unmask alone. The unmask is itself a ledger entry recording both parties, timestamp and reason. **Interface + ledger semantics specified in E4 now (AF-408); secret storage + role binding sit in E8, deferred.** | This is the mechanism that makes a works agreement signable and is directly legible to an ASPICE buyer — a feature, not a constraint. |
| R12 | E3 detection rebalance (§8 A4) | **The model is the detector; rules are a latency/determinism strategy, not the detection strategy.** Build order for E3: German lexicons + backstop-model integration **before** regex breadth. German identifiers get real validation: IBAN (MOD-97), *Steuernummer* (per-Bundesland), *Handelsregisternummer* (standard form). | Published benchmarking (PIIBench, directional) puts rule engines near F1 ≈ 0.14 / ~17% recall on contextual entities vs ~0.99 for fine-tuned SLMs and ~0.94 for a quantised Gemma-2B. Rules-first stays right for the <50 ms path (NFR-01), but perfecting patterns spends a sprint on a small fraction of recall. |

---

## 6. What "Complete" forbids (carried from SLC pack §1, binding on every decomposed epic)

- No "coming soon" panels, no count-only analytics, no policy editor that can't
  handle a real 3-page policy, no audit log you can't hand an auditor.
- If an epic's scope is too large to ship production-complete, **cut a feature
  rather than ship it partial**, and record the cut in the PRD "Cuts" section.

---

## 7. Cuts made to hold the SLC standard (see PRD §11 for detail)

| Cut | What was removed | Why it is a cut, not a stub |
|-----|------------------|-----------------------------|
| C1 | Cross-conversation resolution of **original** entity identities (e.g., naming "Brechtmann GmbH" in the briefing) | Originals are not in the ledger by design. Resolution runs on **pseudonyms**; the briefing names the *pseudonymised cluster* and the *area*, not the raw entity. This is complete behaviour under the privacy model, not a partial feature. |
| C2 | File/image prompt inspection | Explicitly out of scope (SLC pack §5.3); text prompts only |
| C3 | Per-prompt approval / request-release workflow | Explicitly out of scope (SLC pack §5.3); contradicts structural aggregation |

No decomposed feature ships as a stub. Anything that could not meet the Complete
bar was removed above rather than half-built.

---

## 8. Amendments from architecture research (2026-09-17)

Three deep-research reports (Gemini, ChatGPT, Perplexity) on the interception
question. These amendments were applied to the decomposition **before** any code
was written. They supersede the pre-decision framing in §1/§2 where they conflict.

### A1 · Interception architecture decided — browser extension AND governed chat surface
Conclusive: a network proxy cannot see prompts at composition; an API gateway sees
no shadow-AI traffic. The extension is where the leak is — but in-place DOM
redaction is unreliable across React/Vue/Svelte (component state serialised on
submit; mutating `element.value` transmits the original unless a fragile synthetic-
event sequence is dispatched). Hence two surfaces: **E5 governed chat surface (full
experience, now decomposed)** and **E1 browser extension (block-and-warn coverage,
contract for now, decomposed after E5)**. See §2. Locked as R-none/decision in §3.

### A2 · Actor pseudonymisation in the ledger — NG-19 (a correction)
Aggregating the management view (NG-13) is **not** sufficient for German
works-council purposes. Under BAG precedent the test is *objektive Eignung*:
§87(1) Nr. 6 BetrVG triggers if a system is objectively capable of collecting
behavioural data, regardless of intent. Per-user ledger rows meet that test even
if the UI aggregates. Response (R10, NG-19): store a **pseudonymous actor token**,
never a plaintext user id — same HMAC + `keyEpoch` + key-separation construction as
entity pseudonyms. Lands in **US-013** (first Sprint-1 story), before the code exists.

### A3 · Dual-key de-anonymisation — NG-20
Unmasking an actor requires the **Vier-Augen-Prinzip**: simultaneous authorisation
by two named parties in distinct roles (IT security + works-council rep); neither
alone. The unmask is itself a ledger entry (both parties, timestamp, reason).
Response (R11, NG-20, E4 `AF-408`): specify the interface + ledger semantics now;
secret storage + role binding deferred to E8. A signability feature, not a constraint.

### A4 · E3 rebalance — rules are a latency strategy, not a detection strategy
Directional benchmarking (PIIBench and vendor-adjacent sources): rule engines
≈ F1 0.14 / ~17% recall on contextual entities vs ~0.99 (fine-tuned SLM), ~0.94
(quantised Gemma-2B). Rules-first stays correct for latency/determinism, but the
model is the detector, not the backstop. Response (R12): E3 build order is German
**lexicons + model integration before regex breadth**; German identifiers get real
validation (IBAN MOD-97, *Steuernummer* per-Bundesland, *Handelsregisternummer*);
NG-18's corpus exercises compound-noun tokenisation and four-case declension. Do
not spend the sprint perfecting patterns that contribute a small fraction of recall.

### A5 · AI Act exposure on E7 — OPEN LEGAL RISK (not resolved in code)
The EU AI Act's **Annex III** classifies AI systems that monitor or evaluate
employee performance or behaviour as **high-risk**. Article 6(3) exempts narrow
procedural tasks that do not profile or evaluate workers. A DLP classifier that
only flags policy violations plausibly sits outside high-risk. **Recurring-work
detection (E7/FR-21) plausibly does not** — it analyses what a team is doing and
produces management insight about their behaviour.

This is recorded as an **open legal risk, not an engineering decision.** It is not
resolved here. E7's design is constrained so the safer reading stays available
(binding as **NG-21**):
- E7 reports on **work topics and artefacts, never on people.**
- **No scoring, ranking, or evaluation** of individuals or their output.
- **No inference of sentiment, tone, or emotional state** — separately prohibited
  in workplace settings.
- Output is **aggregate and non-attributable by construction.**

Sources conflict on when Annex III obligations take full effect. **Do not put any
date in code comments, documentation, or user-facing copy** until verified against
the regulation text.

### A6 · Design specification for E5
The authoritative behavioural spec is `prototype/NorthGuard Handoff.md` (state
inventory, timings, the complete DE/EN string list, spacing and type scale). The
working prototypes `NorthGuard Prototyp.dc.html` and `NorthGuard Chat.dc.html` (+
`support.js`) carry the pacing. **Where the Handoff and the HTML disagree, the
Handoff wins for behaviour, the HTML for pacing.** The prototype timings are part
of the specification — E5 matches them, not just the appearance. EP-05 is
decomposed against this spec.

### Amendment log
| Amendment | New invariants | New/changed AFs | Stories | Status |
|-----------|----------------|-----------------|---------|--------|
| A1 Interception decided | — | E5 decomposed (AF-501…508); E1 stays contract | US-032…US-039 (E5); US-C1 (E1) | Applied |
| A2 Actor pseudonymisation | NG-19 | E4 `LedgerEntry.actorPseudonym`; AF-401 guard SF-4015; AF-402 derivation | US-013 | Applied |
| A3 Dual-key unmask | NG-20 | E4 `AF-408 unmaskActor` (FT-4.7) | US-031 | Applied (E8 storage deferred) |
| A4 E3 rebalance | — (R12) | E3 build-order note; AF-301 German-identifier cases | US-006/007 | Applied |
| A5 AI Act exposure | NG-21 | E7 non-attributability guard (SF-7065); open legal risk logged | US-030 | **Open legal risk** |
| A6 E5 design spec | — | EP-05 decomposed against the Handoff | US-032…US-039 | Applied |
