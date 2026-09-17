# NorthGuard — Decision Register
**Project:** NorthGuard — LLM prompt governance gateway
**Owner:** Raja Aduri · Saatwika UG (ShiftNorth)
**Date:** 2026-09-13 · **Status:** LOCKED for decomposition

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
| E1 | Gateway | SLC E1 — **not decomposed**; specified as an adapter contract only |
| E2 | Policy Intake | SLC E2 — decomposed |
| E3 | Inspection & Decision + Redaction/Rehydration Engine | SLC E3, **absorbs the transcript engine logic** that would otherwise be trapped in E5 — decomposed |
| E4 | Audit Ledger | SLC E4, **absorbs ledger durability/backup** — decomposed |
| E5 | Chat Surface | SLC E5 — **not decomposed**; rendering shell, its logic lives in E3 core |
| E6 | Management View | SLC E6 **minus recurring-work** — decomposed |
| **E7** | **Recurring-Work Intelligence** | **NEW** — split out of SLC E6 FR-21 — decomposed |
| **E8** | **Operations** | **was SLC E7** — not decomposed (coupled to interception architecture) |

**Decomposed to file level (buildable SLC core):** E2, E3, E4, E6, E7.
**Deferred (architecture-dependent, contract/spec only):** E1, E5, E8.

---

## 2. The architecture-independence principle (why E1/E5/E8 are deferred)

The interception mechanism — an OpenAI-compatible API gateway **or** a browser
extension — is still under evaluation. That decision determines:

- **E1 Gateway**: how a prompt is captured and how the sanitised prompt is
  forwarded to the provider.
- **E5 Chat Surface**: whether the engineer UI is a bespoke SPA or an overlay
  injected into an existing tool's DOM.
- **E8 Operations**: the Docker Compose topology, health checks, and process
  layout all presuppose the answer.

Everything that does **not** depend on that answer is core and is built now. The
redaction/rehydration *logic* is pure and architecture-independent, so it is
pulled out of E5 and into the E3 core as a shared module (see §5).

---

## 3. Locked technical decisions

| Decision | Locked Value | Rationale |
|----------|--------------|-----------|
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
