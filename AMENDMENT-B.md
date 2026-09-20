# NorthGuard — Amendment B: the baselined Schutzprofil

*Apply after Sprint 5 lands. Paste to Claude Code as a specification amendment, then let it update DECISION-REGISTER, AGENT-RULES, specs, manifests and checksums before building.*

---

## Paste this

An amendment to E2, E4, E6 and E7 based on a product decision. Apply it the way Part A's amendments were applied — update the register, the rules, the affected specs, the manifests and the checksums, commit, then continue.

The decision in one line: **the protection profile is the customer's own model of their business, baselined once and changed only through a reviewed change request with stated business justification.**

This is ASPICE change control applied to a data policy. It is the most defensible thing in the product, and it replaces the current implicit behaviour where extraction could run again and quietly produce a different map.

### B1 · The profile is a baselined configuration item — NG-22

Today E2 extracts, a human confirms, and the policy activates. From now on the confirmed result is a **baseline** with a version, a date, and a named approver, and it does not change on its own.

- **NG-22:** the active protection profile is immutable between baselines. No extraction, inference, or background process may alter an active profile. The only path to a new baseline is an approved change request.
- Each baseline carries: version, created date, approver, the change request that produced it (null for the initial baseline), and the full area set with modes.
- Superseding a baseline is a governance event in the ledger. The previous version remains readable — history is evidence.
- A briefing or export whose window spans a baseline change carries a coverage note, in the same way a key-epoch crossing does.

**Consequence for the stability gate:** the 0.80 index stops being a per-activation gate and becomes a **convergence signal during onboarding only**. A low index means the passes have not yet settled — keep reading, or ask the user a question. Once a baseline is set, stability is irrelevant because nothing re-extracts. Update NFR-07 accordingly; do not delete the measurement.

### B2 · Multi-pass convergence at onboarding — AF-207

Reading a policy once yields a shallow map. Re-reading deepens it, the way a person understands a document better on the third pass than the first.

- Extraction runs repeatedly over the same policy, each pass proposing additions or refinements to the working set.
- **A stopping rule is required.** Converge when a pass adds nothing above a materiality threshold, or at a hard pass ceiling. Record how many passes ran and what the last one added.
- Show convergence to the user as a fact — *three passes, the last added nothing new*. That is what makes the baseline feel earned rather than arbitrary.
- The working set is never active. Nothing enforces until the baseline is approved.

### B3 · Clarifying questions — AF-208

Where passes leave a genuine ambiguity, ask the user rather than guessing.

- Questions are **generated from ambiguities the extraction actually hit**, never from a fixed questionnaire. "Your policy says *Kundendaten* — does that include supplier contacts?" is worth asking; anything that could have been a static checkbox is not.
- Hard budget: **five to eight questions**. If onboarding runs past roughly twenty minutes, a 60-person supplier abandons it and there is no product.
- Every answer is recorded with the baseline as part of its provenance — an auditor should see why an area is defined the way it is.
- Questions must be answerable by a quality lead without consulting anyone.

### B4 · The review cycle — AF-609

Evidence accumulates between reviews; proposals are made at the review, never applied automatically.

- **Cadence decays:** fortnightly for the first quarter, then monthly, then quarterly. Configurable, with those defaults.
- A review produces a **Review-Vorschlag**: proposals, each with its evidence and its stated business value, ordered by priority.
- **A review must be able to propose nothing.** "Nothing to propose this period" is a valid and healthy outcome, held to the same discipline as the quiet-week briefing. A review that always finds something is a review nobody reads.
- Approving a proposal creates a change request; approving the change request creates the next baseline. Both are ledger entries with the approver and the justification.

**Proposal types to detect:**

| Type | Evidence it rests on |
|---|---|
| Synonym or abbreviation extension | A short form recurring in traffic that a known area does not recognise — the highest-value type in German engineering, where much of the vocabulary is abbreviated |
| Coverage gap | Repeated prompts touching a concept no area covers |
| Dormant area | An area with no hits over a long window — either nobody discusses it, or recognition is failing; both readings are useful and the proposal should say so |
| Mode mismatch | An area set to block that keeps generating false-positive reports → propose redact, with the report count as evidence |
| New business activity | A supplier, product or project appearing in traffic that the profile has never seen — the profile noticing the business changed |

Every proposal states the evidence in numbers and period. Never a bare recommendation.

### B5 · The business-event record — replaces "rule-hit features", NG-23

The record is not that a rule fired on someone's prompt. It is **what the business was trying to do when it reached a boundary.**

Per inspection event, store: the area, the rule or layer that decided it, the **structural features** that decided it (percentage present, price term in sentence, and so on — features, never text), and the **work topic**.

- The features make rule-narrowing measurable without retaining prompt text. `previewRuleNarrowing` can then return a real before/after count instead of `measured:false`.
- The work topic makes the record legible as business activity rather than employee behaviour.
- **NG-23:** the inspection record is structured around what the business was doing, not who did it. One record serves both E6 narrowing preview and E7 recurring-work — never two parallel stores.

A record organised this way is materially easier to defend in a Betriebsvereinbarung than a person-level log that is aggregated after the fact. That is the point, not a side effect.

### B6 · Language

Customer-facing language never says "the model suggests" or names a graph. The artefact is the customer's **Schutzprofil**; the periodic output is a **Review-Vorschlag**; a change is a **Änderungsantrag** against the current baseline. Apply this to every user-visible string in both languages.

### What to produce

Decompose B1–B5 into the existing hierarchy — new app functions under E2 (convergence, questions, baseline) and E6 (review cycle, change request), an amended ledger schema in E4, and the shared business-event record feeding E7. Flag anything that contradicts an existing invariant rather than resolving it silently.
