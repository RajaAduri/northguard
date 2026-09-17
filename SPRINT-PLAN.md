# NorthGuard — Sprint Plan

Sequencing rule: dependencies first (chain order), correctness core early, risk
early. The ledger (E4) and policy intake (E2) come first because everything writes
to the ledger and inspection needs an active policy. The transcript engine (E3)
is Sprint 2 because it carries the load-bearing correctness test. Management (E6)
and recurring-work (E7) follow once the ledger has shape and data.

| Sprint | Goal | Stories | Why this order | Est. agent hours |
|--------|------|---------|----------------|------------------|
| **1** | Ledger + Policy Intake foundation | US-013, US-015, US-018, US-001, US-002, US-003, US-004, US-005 | Ledger append/governance/durability underpin every write (NG-5). Policy intake produces the active policy inspection needs. | 6–8 |
| **2** | Inspection + Transcript Engine (correctness core) | US-006, US-007, US-008, US-009, US-010, US-011, US-012 | Rules → backstop → verdict → placeholders → pseudonyms → wire → rehydrate. US-011 wire-isolation is the load-bearing test. | 7–9 |
| **3** | Ledger query/export + dual-key unmask + Management read-models | US-016, US-017, **US-031**, US-019, US-021, US-023 | Needs ledger data (S1) + request entries (S2). Export closes the sale. **US-031 (AF-408 dual-key unmask, NG-20)** reuses the governance writer + pseudonym HMAC and makes the Betriebsvereinbarung signable (§8 A3). | 6–7 |
| **4** | Briefing + FP loop + Recurring-work Stage 1 | US-022, US-024, US-025, US-026, US-020(partial) | FP loop drives the <1 false-block/user/week metric. E7 feature extraction + MinHash blocking. | 6–8 |
| **5** | Recurring-work Stage 2 + synthesis + briefing complete | US-027, US-028, US-029, US-030, US-020(complete) | Pinned embeddings, pseudonym resolution, temporal patterns, hours-saved synthesis feed the briefing headline. **Non-attributability gate (NG-21).** | 6–8 |
| **6** | Governed Chat Surface (E5) | US-037, US-036, US-032, US-033, US-034, US-035, US-038, US-039 | Now decomposed (§8 A1). React SPA over the solved E3 core: tokens + i18n first, then composer → mirror → reply → provider-view → FP-report → two-rooms. The E1 extension decomposes after this. | 8–10 |

**Deferred (contract only):** US-C1 (E1 browser extension — interception decided; adapter conformance now, extension impl after E5), US-C3 (E8 ops — incl. dual-key secret store + role binding). *US-C2 retired — E5 is decomposed as US-032…US-039.*

## Dependency notes
- US-013 (ledger append) blocks US-015, US-018, US-014, and every governance write.
- US-005 (activation) blocks all of E3 (no active policy → no inspection).
- US-011 (wire isolation) and US-014 (request entry) together satisfy the §8 acceptance test — schedule the wire-isolation integration test at the end of Sprint 2.
- E7 (Sprints 4–5) depends on request entries carrying span pseudonyms (US-010, US-014).
- The briefing (US-020) is split: structure in Sprint 4 (ledger stats), headline recurring-work themes complete in Sprint 5 once E7 lands.
- US-013 (Sprint 1) now carries the NG-19 actor-pseudonym guard — it lands before any writer, so no ledger entry can ever hold a plaintext user id.
- US-031 (Sprint 3) depends on the governance writer (US-015) and the pseudonym HMAC (US-010); its secret store + role binding stay deferred to E8.
- E5 (Sprint 6) depends on the whole E3 core (Sprint 2) and the E6 read-models (Sprints 3–4); build its tokens (US-037) + i18n (US-036) first, as everything else imports them.

## Manifest coverage
Individual `US-*.manifest.json` files are provided for the Sprint 1 and Sprint 2
critical path, the highest-dependency stories, plus **US-031 (dual-key unmask)** and
**US-032 (E5 composer state machine)** as templates for their sprints. Sprint
manifests (`sprint-N.manifest.json`, now sprints 1–6) sequence every sprint.
Manifests for the remaining Sprint 3–6 stories follow the same template (see any
existing manifest) and are generated per story at session start from the specs,
which already carry file lists, signatures, and test cases.
