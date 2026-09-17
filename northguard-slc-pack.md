# NorthGuard — SLC Build Pack
**Owner:** Raja Aduri · Saatwika UG (ShiftNorth) · v1.0 · 11 Sep 2026

---

## TLDR

- **Build one lane, completely.** LLM prompt governance for DACH SMBs and Tier 2/3 suppliers. Humanoid and CNC lanes stay on the thesis slide, out of the codebase.
- **SLC, not MVP.** A gateway that half-works is worse than none — it teaches employees to route around it on day one. Narrow the scope brutally; finish what's in it.
- **The lovable moment is the redacted reply**, not the block. Watching a real LLM answer a sanitised prompt proves work continues. The block alone proves only that you're in the way.
- **Sell to the risk owner, prove value to management.** Exposure map closes the compliance case; the weekly briefing on what engineering is stuck on is what renews it.
- **Compliance expertise leads the pitch.** 15+ years ASPICE/ISO 26262 in regulated automotive is why anyone believes a one-person company can build governance infrastructure. Lead with it before any AI framing.
- **Beta recruitment starts Tuesday 15 Sep** with the public demo link, not a waitlist page. Target: 5 design partners by 31 Oct.
- **Hard kill signal:** if 3 of the first 5 design partners can't produce a written data policy within a week of asking, the product has no input and the market isn't ready.

---

## 1. Why SLC, and what it forbids

MVP logic says ship a skeleton and learn. That logic is actively dangerous here. A gateway sits in the critical path of someone's work. If it is slow, wrong, or opaque, the employee opens ChatGPT in another tab and your product is dead — not rejected, *bypassed*, silently, while the dashboard still shows green.

So the discipline for v1:

| | Meaning for NorthGuard |
|---|---|
| **Simple** | One lane (prompt governance). One provider integration. One policy per deployment. One team, one tenant. No SSO, no billing, no multi-region. |
| **Lovable** | Three moments: the policy becoming a visible map of what's protected; the redacted prompt still getting a useful answer; the Monday briefing that tells a manager something they didn't know. |
| **Complete** | Everything in scope works for a real 20-person team for a real month. Audit log is queryable and exportable. Failures are handled. Latency budget is met. Nothing is a stub. |

**What "Complete" forbids:** no "coming soon" panels, no analytics that only count, no policy editor that can't handle a real 3-page policy, no audit log you can't hand an auditor.

**What "Simple" forbids:** no second lane, no local-LLM tier, no fine-tuning, no browser extension, no Slack bot, no role hierarchy.

---

## 2. Target customer profile

### 2.1 Firmographic — the buying organisation

- **Size:** 20–250 employees. Below 20, no one owns risk. Above 250, procurement and an enterprise Microsoft agreement take over.
- **Geography:** DACH first. Germany primarily, Austria and German-speaking Switzerland as natural spread.
- **Sector priority:**
  1. Automotive Tier 2/3 suppliers (your home turf, ASPICE vocabulary already shared)
  2. MedTech suppliers under ISO 13485 (adjacent regulatory reflex, existing ShiftNorth angle)
  3. Engineering services and Konstruktionsbüros handling customer IP under NDA
  4. Mittelstand machine builders with proprietary process know-how
- **Qualifying condition:** they hold IP or customer data that is contractually protected, and they have *no* enterprise data-processing agreement with an LLM provider. This is the wedge. If they already have an enterprise Copilot agreement, they are not the buyer — yet.

### 2.2 The three people in the room

**The Buyer — Risk Owner**
Managing Director, Head of Quality, Compliance Lead, or an IT lead wearing the risk hat. In a 60-person supplier this is often one person wearing three hats.

- *Fears:* a customer audit asking "where does your engineering data go?" and having no answer. An NDA breach traced to a pasted prompt. A Tier 1 customer's supplier questionnaire arriving with an AI-usage section they can't fill in.
- *Currently does:* issues a policy banning AI tools, knows it isn't followed, has no way to verify either way.
- *Buys when:* the cost of not knowing exceeds the cost of finding out.
- *Language that lands:* audit trail, evidence, traceability, supplier questionnaire, Nachweisbarkeit.
- *Language that repels:* "AI-powered", "transformation", "leverage", anything that sounds like a pitch deck.

**The Champion — Engineering Lead**
Wants their team to use AI, has quietly concluded the ban is unenforceable, and dislikes being the person who has to enforce it.

- *Wins when:* NorthGuard converts a ban into a permission. They get to say yes.
- *Kills the deal when:* latency hurts, or the tool blocks legitimate work. Their tolerance is roughly one false block per week before they stop defending it.

**The User — Engineer**
Does not want a governance product. Wants an answer to their question.

- *Adopts when:* the path through NorthGuard is no harder than the path around it, and the answers are as good.
- *This is the whole adoption question.* Everything else is secondary.

### 2.3 Anti-profile — do not sell to

- Companies with an existing enterprise LLM agreement (the pain is already contracted away)
- Regulated firms who will demand full on-prem before v1 is proven
- Anyone who wants to govern a tool you don't yet support
- Organisations with no written policy and no intention of writing one — there is no input to the system

---

## 3. USP

### 3.1 The one-line positioning

> **NorthGuard turns a written data policy into an enforced boundary — and gives you the audit trail to prove it.**

### 3.2 The three-layer claim

1. **Compliance first.** Built by an engineer with 15+ years in ASPICE and ISO 26262 change control. The audit log is designed as evidence, not telemetry — hash-chained, append-only, exportable for a customer audit or supplier questionnaire.
2. **Enforcement, not advice.** Most "AI governance" products are policy documents, training decks, or dashboards that observe. NorthGuard sits in the path. A policy that isn't the path isn't a control.
3. **Insight, not just interdiction.** The prompts your team writes are the most honest record of where the work is hard. NorthGuard is the only governance layer that hands management that signal instead of just a violation count.

### 3.3 What we are NOT claiming

Deliberate restraint — each of these would be faster to sell and impossible to defend:

- Not "100% leak prevention." Detection is probabilistic. Claim *coverage and evidence*, never certainty.
- Not a DLP replacement.
- Not legal compliance certification for the EU AI Act or anything else. We provide evidence; we do not certify.
- Not cheaper than the status quo. It costs more than the ChatGPT subscriptions people are already expensing. Sell on risk and insight, never on price.

> **Regulatory note:** the EU AI Act is a strong tailwind for this positioning, but do not publish specific article numbers, obligation dates, or applicability claims without verifying current text first. Content-integrity rule applies: hypothetical framings ("imagine your customer's supplier questionnaire asks…") rather than asserted regulatory fact.

### 3.4 The moat, stated honestly

kg-gen is MIT-licensed and public; the architecture is guessable. The defensible parts are:

- **The compliance ontology** — protected-concept taxonomy for ASPICE/ISO 26262/13485 contexts. Closed, paid IP.
- **Bilingual DE/EN detection lexicons** — German engineering vocabulary is where generic English-trained detection fails. Directly tied to the DACH wedge.
- **The stability gate** — a governance product whose protection map drifts between runs is not a control. The ≥0.80 stability index is a genuine differentiator, and competitors using naive LLM extraction have this bug without knowing it.
- **Domain credibility.** Not copyable.

---

## 4. User journeys

### 4.1 Buyer journey (first touch → paid)

| Stage | What happens | What must be true |
|---|---|---|
| **Trigger** | Sees a LinkedIn post about shadow AI in regulated engineering; or a customer questionnaire asks about AI data handling | Post uses a hypothetical, not a claimed anecdote |
| **Self-test** | Opens the public demo, pastes *their own* policy and a fake sensitive prompt | Works in under 30s with no signup |
| **Recognition** | Sees their own policy rendered as protected areas, sees their prompt collide with it | This is the conversion moment — not the copy above it |
| **Contact** | Requests a design-partner slot | One-field form. No demo-booking funnel. |
| **Scoping call** | 30 min: their policy, their tools, their audit exposure | Raja qualifies on the anti-profile list |
| **Pilot** | 2 weeks, one team, their real policy | Deployed inside their network, not ShiftNorth's |
| **Evidence review** | Exposure report + briefing + audit-log export | The export is the artefact that closes it |
| **Convert** | Annual licence | — |

### 4.2 Engineer journey (daily use)

1. Opens the NorthGuard chat surface — same habit shape as the tool they were already using.
2. Types the question they actually have, including the customer name and contract number, because that's the real question.
3. Sees inline, *before* sending: two fields will be redacted, here they are.
4. Sends anyway. Gets a useful answer.
5. Learns, without a training session, which categories are protected.

**Design principle:** the redaction must be visible *before* send, not explained after. Pre-send transparency turns a block into a choice; post-hoc explanation turns it into an obstacle.

**Failure mode to instrument:** if usage declines week over week while the team is still working, they've routed around you. Track it as the primary health metric.

### 4.3 Management journey (weekly)

1. Monday: opens the briefing.
2. Reads three recurring themes behind last week's prompts.
3. Reads where the exposure concentrated — which protected areas the team keeps needing.
4. Reads the policy-fit note: is the policy matched to the work, or blocking legitimate tasks?
5. Acts on one of them — a tooling gap, a training need, or a policy amendment.

**The renewal mechanic:** step 5. A tool that only reports violations gets cancelled in the first budget round. A tool that changed a decision gets renewed.

---

## 5. Product requirements

### 5.1 Problem statement

Small and mid-sized regulated engineering firms have employees using public LLM tools with company IP, customer data, and contractual secrets, in violation of policies that exist on paper and are unenforceable in practice. These firms cannot negotiate enterprise data-processing terms, cannot verify what has already left, and cannot answer a customer audit about AI data handling.

### 5.2 Goals

- **G1** Make the written policy the actual enforcement path for LLM traffic.
- **G2** Produce audit-grade evidence of what was sent, what was caught, and what was redacted.
- **G3** Keep the governed path as fast and useful as the ungoverned one.
- **G4** Convert governed traffic into a management signal about where work is hard.

### 5.3 Non-goals (v1)

Explicitly out of scope, and out of the codebase:

- Humanoid command authorization and CNC G-code validation (thesis lanes, not v1)
- Local/on-site LLM inference tier
- Multi-tenant SaaS, SSO, billing, role hierarchies
- Browser extension, IDE plugin, Slack/Teams integration
- File and image upload inspection (text prompts only)
- Outbound DLP beyond the LLM path
- Automatic policy authoring
- **Per-prompt approval workflow.** No request-release, no manager sign-off on an individual prompt. NorthGuard is the backstop for what the individual didn't do themselves; it does not put a human in the loop on a colleague's question. An approval queue would contradict structural aggregation, hand a works council the objection the design avoids, and create exactly the wait that makes people bypass the tool. Rule changes are notified, not gated.

### 5.4 Scope — epics

**E1 · Gateway** — receive prompt, apply verdict, forward to provider, return reply. OpenAI-compatible endpoint so existing tools can be repointed. Streaming supported. Provider failure handled explicitly.

**E2 · Policy Intake** — ingest a policy document (paste or file), extract protected concepts via kg-gen sidecar, run the stability gate, present the extracted areas for human confirmation and manual editing. *Human confirmation is mandatory — never auto-activate an extracted policy.*

**E3 · Inspection & Decision** — rules layer (regex/lexicon, deterministic, DE+EN) runs first; LLM backstop runs second and only when rules are inconclusive. Produce: touched areas, violation boolean, redacted variant, confidence, caught-by attribution. Modes: block / redact-and-route, configurable per protected area.

**E4 · Audit Ledger** — append-only, hash-chained JSONL event record. One entry per request: timestamp, user, prompt hash, touched areas, verdict, mode, caught-by, provider, latency. Queryable by date and area. Exportable as CSV and as a signed evidence bundle.

**E5 · Chat Surface** — the engineer-facing UI. Pre-send redaction preview. Conversation history. Visible protected-area indicator.

**E6 · Management View** — exposure concentration across protected areas over time; weekly briefing (themes, friction, policy-fit); activity log; export.

**E7 · Operations** — config, deployment (Docker Compose, single host), health checks, provider key management, log rotation, backup of the ledger.

### 5.5 Functional requirements (selected, testable)

| ID | Requirement |
|---|---|
| FR-01 | Gateway exposes an OpenAI-compatible `/v1/chat/completions` endpoint |
| FR-02 | Every request produces exactly one ledger entry, written before the reply returns |
| FR-03 | Policy extraction runs once per policy version, keyed by content hash; never per request |
| FR-04 | Policy activation requires explicit human confirmation of extracted areas |
| FR-05 | Extracted policy graph below the stability threshold is surfaced as unstable and blocked from activation until confirmed |
| FR-06 | Rules layer executes with no network call |
| FR-07 | LLM backstop invoked only when rules are inconclusive |
| FR-08 | Redaction preview is shown to the user before send, rendered as a read-only mirror of exactly what the provider will receive |
| FR-08a | Redaction placeholders are semantically descriptive (`⟨Lieferant⟩`, `⟨Vertragsnummer⟩`), never opaque tokens. The model must be able to reason about the category it cannot name, and the reply must preserve the same placeholders so the engineer substitutes locally |
| FR-08b | Each redacted span carries its own attribution: the protected area, the layer that caught it (rule vs LLM backstop), and the specific rule identifier where applicable. Verdict-level attribution alone is insufficient — span-level is what makes a false-positive report actionable |
| FR-08c | Replies are rehydrated locally: placeholders in the provider's response are substituted back to original values client-side, so the engineer never does it by hand |
| FR-08d | **Two transcripts are maintained and must never cross.** The *wire transcript* (redacted) is the only content ever transmitted, including as conversation history on every subsequent turn. The *local transcript* (rehydrated) is display-only. A rehydrated span must never be sent upstream |
| FR-08e | The placeholder→original mapping is held client-side only. Never transmitted, never written to the ledger, discarded when the conversation closes |
| FR-08f | Placeholders are unique per entity within a conversation; colliding entities of the same type are indexed (`⟨Lieferant 1⟩`, `⟨Lieferant 2⟩`) |
| FR-08g | Rehydration tolerates inflection and declension (German case endings on placeholder tokens). Where a placeholder cannot be matched with confidence, it remains visible as a placeholder — an approximate or wrong substitution is never made silently |
| FR-08h | Rehydrated spans are visibly marked as locally restored, so the engineer can always distinguish what left the building from what was reinstated |
| FR-09 | Per-area mode configuration (block vs redact) |
| FR-10 | Ledger is append-only; each entry carries the hash of its predecessor |
| FR-11 | Ledger export produces a verifiable chain, CSV and JSONL |
| FR-12 | Prompts are stored as hashes plus redacted text by default; full-text retention is opt-in per deployment |
| FR-13 | Weekly briefing generated from the ledger, regenerable on demand |
| FR-14 | Provider outage returns a clear error and still writes a ledger entry |
| FR-15 | All UI and detection lexicons available in German and English |
| FR-16 | Any blocked or redacted span can be reported as a false positive by the engineer in a single action, with context captured automatically |
| FR-17 | False-positive reports surface in a review queue with repeat-frequency per rule; resolution actions are narrow rule, exclude term, change area mode, or dismiss with reason |
| FR-18 | Rule tuning and report dismissals are written to the ledger as governance decisions — system tuning is never an off-the-record edit |
| FR-19 | Engineer and management views are visually unmistakable from each other at a glance, with no ambiguity about which context is active |
| FR-20 | Individual-level prompt behaviour is not exposed in the engineer's own surface; frequency and exposure data appear only in the management view, aggregated |
| FR-21 | **Recurring-work detection.** The briefing identifies duplicated effort across the team — the same document summarised by several people, near-verbatim repeated requests — and names the artefact that would remove it (a stored extract, a phrasing kit). Reported in hours saved, not violations caught. This is the product's only value-creating rather than loss-preventing output, and the strongest line in a sales conversation |

### 5.6 Non-functional requirements

| ID | Requirement | Rationale |
|---|---|---|
| NFR-01 | Rules layer adds < 50 ms p95 | Invisible to the user |
| NFR-02 | Full inspection adds < 800 ms p95 before provider call | Above ~1 s people route around it |
| NFR-03 | Streaming replies begin within 1.5 s p95 end to end | Perceived parity with direct use |
| NFR-04 | Single-host deployment, ≤ 8 GB RAM | Fits a Mittelstand server closet |
| NFR-05 | No prompt content leaves customer infrastructure except to the configured provider | The entire value proposition |
| NFR-06 | Ledger survives process restart with no gap | Evidence integrity |
| NFR-07 | Policy stability index ≥ 0.80 before activation | A drifting control is not a control |
| NFR-08 | Graceful degradation: if the backstop is unavailable, rules-only with the reduced coverage recorded in the ledger | Never fail open silently |

### 5.7 Architecture

```
Engineer → Chat Surface (E5)
              ↓
        Gateway  (Node + Express, E1)
              ↓
   ┌──────────┴───────────┐
   │  Inspection (E3)     │  rules → LLM backstop
   │  Policy cache (E2)   │  ← kg-gen sidecar (Python/FastAPI, localhost)
   └──────────┬───────────┘
              ↓
       Audit Ledger (E4, JSONL hash-chained)
              ↓
   Management View (E6) ← reads ledger only
              ↓
      External LLM provider (only sanitised traffic)
```

**Deployment:** Docker Compose on customer infrastructure. Node gateway + Python kg-gen sidecar + static frontend. No external dependencies beyond the configured LLM provider.

### 5.8 Acceptance criteria for "Complete"

v1 ships when all of these are true:

- [ ] A 3-page real policy in German extracts, passes the stability gate, and is confirmed by a human in under 10 minutes
- [ ] 20 engineers use it for 2 weeks with no bypass observed and no unhandled error
- [ ] p95 added latency is within NFR-02
- [ ] A month of ledger exports and verifies as an unbroken chain
- [ ] **Wire-transcript isolation verified:** across a 10-turn conversation containing redactions, no original value appears in any outbound payload — asserted by an automated test, not by inspection
- [ ] A weekly briefing produces at least one insight the manager did not already know (assessed by asking them)
- [ ] False-block rate under 1 per user per week
- [ ] Everything in the UI works; nothing is labelled "coming soon"

### 5.9 Open decisions

| # | Decision | Needed by |
|---|---|---|
| D1 | Provider for v1 — single (Anthropic or OpenAI) or aisuite abstraction from the start | Before E1 |
| D2 | Pricing model — per-seat annual vs flat site licence; API cost passthrough vs customer's own key | Before first pilot |
| D3 | Customer-key vs ShiftNorth-key. *Recommendation: customer's own provider key.* Removes cost passthrough, removes you from the data path, simplifies the DPA conversation | Before first pilot |
| D4 | Prompt retention default — hash-only vs full text | Before E4 |
| D5 | German language coverage depth for v1 lexicons | Before E3 |

---

## 6. engineering-prd input block

> Paste as the product input. Verify the skill version first: `grep -rn "Phase 8\|RETRIEVER\|expand_query" --include=*.md ~/dev/dev-blueprint` — if empty, sync before running.

```
PRODUCT: NorthGuard — LLM prompt governance gateway

ONE-LINER: Turns a written company data policy into an enforced boundary on
employee LLM traffic, with an audit-grade evidence trail.

BLUEPRINT TYPE: Micro Tool
(no auth, tenant, or billing epics — single-tenant, single-team deployment)

FRAMEWORK: SLC (Simple, Lovable, Complete) — not MVP. Every epic in scope
ships production-complete. No stubs, no placeholder UI.

STACK:
  - Gateway: Node + Express (OpenAI-compatible endpoint, streaming)
  - Policy extraction: Python FastAPI sidecar wrapping kg-gen (localhost only)
  - Ledger: append-only hash-chained JSONL
  - Frontend: static SPA, Nordic Clarity design system
    (navy #0B1220, teal #3FBFB0, amber #F5A623; JetBrains Mono, Fraunces, Inter Tight)
  - Deployment: Docker Compose, single host, customer infrastructure

EPICS:
  E1 Gateway          — receive, decide, forward, return; streaming; provider failure handling
  E2 Policy Intake    — ingest policy, kg-gen extraction, stability gate, human confirmation, manual edit
  E3 Inspection       — deterministic rules (DE+EN lexicons) first, LLM backstop second;
                        per-area block/redact modes; semantic placeholders (never opaque tokens);
                        span-level attribution (area + layer + rule id); per-entity indexed placeholders
  E4 Audit Ledger     — append-only hash-chained event record; query; CSV + evidence-bundle export;
                        records rule tuning and report dismissals as governance decisions
  E5 Chat Surface     — engineer UI; submission mirror showing exactly what the provider receives;
                        client-side rehydration of replies (two-transcript model: wire transcript is
                        the ONLY thing ever transmitted, including as history on later turns);
                        one-action false-positive reporting; no individual-level frequency data
  E6 Management View  — exposure concentration over time, weekly briefing, activity log, export,
                        false-positive review queue; visually distinct from the engineer surface;
                        recurring-work detection (cross-conversation clustering + entity resolution
                        + temporal patterns — this is the deepest component in the build, NOT a
                        report generator; decompose it accordingly)
  E7 Operations       — config, compose deployment, health checks, key management, ledger backup

KEY CONSTRAINTS:
  - Rules layer: < 50 ms p95, no network call
  - Full inspection: < 800 ms p95 added latency
  - Policy extraction runs once per policy version (content-hash keyed), never per request
  - Policy stability index >= 0.80 required before activation
  - No prompt content leaves customer infrastructure except to the configured provider
  - Ledger is append-only and must verify as an unbroken chain
  - Never fail open silently — degraded coverage is recorded, not hidden
  - Bilingual DE/EN throughout

OUT OF SCOPE (do not decompose):
  humanoid command authorization; CNC G-code validation; local LLM inference tier;
  multi-tenant/SSO/billing; browser extension; IDE plugin; Slack/Teams; file and
  image inspection; outbound DLP beyond the LLM path; automatic policy authoring
```

---

## 7. Beta recruitment campaign

**Objective:** 5 design partners under pilot by 31 Oct 2026.
**Funnel:** LinkedIn post → public demo → design-partner request → scoping call → pilot.
**Cadence:** Tuesday 08:00 CET. Links in first comment. No hashtags. No product mentions in others' comment threads; DM only after two to three public exchanges.
**Integrity rule:** no invented anecdotes, client stories, or outcomes. Hypothetical framings only. No OEM named, no OEM-competitor commentary.

### 7.1 What "design partner" means — use this framing

Not "beta tester." Design partner: they bring a real policy and a real team, you bring the build, and they get the roadmap influence plus a permanent licence discount. Free during the pilot. The ask is their attention, not their budget — which is also what makes it a genuine test. Someone who won't give two hours of attention will never give €12k.

### 7.2 Post sequence (six weeks, one per Tuesday)

| Date | Angle | Purpose |
|---|---|---|
| **15 Sep** | *Your AI policy is a document, not a control.* The gap between a written policy and an enforced one. No product mention. | Establish the problem; find who nods |
| **22 Sep** | *Is your data yours?* Continues the planned series — what a company generates isn't fully theirs while it depends on commercial tools. | Deepen; attract the risk owner |
| **29 Sep** | *Imagine your customer's supplier questionnaire adds an AI section.* Hypothetical audit walkthrough: what evidence could you actually produce? | Make the pain concrete and dated |
| **6 Oct** | **Demo launch.** "I built the thing I kept describing. Paste your own policy, watch it become an enforced boundary. No signup." | Traffic spike; self-qualification |
| **13 Oct** | *What the prompts revealed.* The insight angle — prompts as an honest record of where work is hard. | Reframe fear → insight; reaches the manager |
| **20 Oct** | **Design-partner call.** Five slots, named criteria, what they get and what you need. | Convert |

### 7.3 The demo launch post — draft

> For three months I've been writing here about the gap between a policy and a control.
>
> A policy says: don't paste customer data into AI tools.
> A control means it can't happen without someone knowing.
>
> Most companies I talk to have the first. Almost none have the second — not because they don't care, but because the enforcement layer doesn't exist at their size. A 60-person supplier can't negotiate the data terms an OEM can.
>
> So I built it.
>
> NorthGuard takes your written data policy, turns it into a set of protected areas, and checks every prompt against them before it reaches an external model. Blocked or redacted — your choice, per area. Every decision written to an audit trail you could hand to a customer.
>
> There's a public demo in the first comment. Paste your own policy. Paste a prompt with something in it you wouldn't want leaving the building. Watch what happens.
>
> It runs in your browser — nothing you type is stored. In a real deployment it runs inside your network, which is rather the point.
>
> I'm looking for five design partners. Details next week, or message me if you can't wait.

**Why this works:** it opens with your own published track record (verifiable), states the mechanism plainly, makes the demo a dare rather than a request, and pre-empts the obvious objection about the demo's own data handling.

### 7.4 Direct outreach — 20 named targets

Parallel to the posts, not instead of them. Build a list of 20 DACH Tier 2/3 suppliers and MedTech firms, 20–250 employees. For each, find the Head of Quality, the Compliance Lead, or the MD.

**DM shape** (after two or three public exchanges, per your rule):

> [Name] — you mentioned [specific thing they said publicly] last week. I've been building a governance gateway for exactly that problem: the enforcement layer between a written AI policy and what employees actually paste. There's a demo you can try without signing up: [link]. I'm taking on five design partners and I'd rather they came from [their sector] than from anywhere else. Worth 20 minutes?

**What is NOT in that message:** no pitch deck, no calendar link in the first message, no claimed customer count.

### 7.5 Qualification checklist for the scoping call

Six questions. Three yeses and no anti-profile hit → design partner.

1. Do you have a written data or IP policy? *Can you send it?* ← the real test
2. Do you know, today, whether employees use public AI tools with company data?
3. Has a customer ever asked how you handle AI and data?
4. Who signs off on a tool that touches engineering data?
5. Do you have an enterprise agreement with an AI provider? *(yes → disqualify for now)*
6. Can you commit one team for two weeks?

### 7.6 What to measure

| Metric | Target by 31 Oct | Signal |
|---|---|---|
| Demo sessions | 300 | Message resonance |
| Demo → request conversion | > 4% | Whether the demo sells or just entertains |
| Scoping calls | 15 | Pipeline health |
| Design partners signed | 5 | The actual goal |
| Policies actually received | ≥ 4 of 5 | **The most important number in this table** |

---

## 8. Proceed and kill signals

### Proceed

- Risk owners engage on posts 1–3 before any demo exists — the problem is felt, not manufactured
- Design partners send their policy within a week of asking
- In pilot: engineers keep using it after week one without prompting
- Management acts on at least one briefing insight
- Someone asks about the audit-log export unprompted — that's a buying question

### Kill or pivot

- **3 of 5 design partners can't produce a written policy** → no input exists, market isn't ready. *Pivot: sell policy authoring first.*
- **Engineers bypass within two weeks** → latency or false-block problem. Fix before selling anything.
- **Buyers want it only as a report, not a gateway** → they want assessment, not enforcement. *Pivot: a paid AI exposure assessment, which is a real consulting product but not this product.*
- **Every conversation turns into "can it run fully offline"** → the local-LLM tier is the actual product, and v1 scope is wrong.
- **Demo traffic is high but requests are near zero** → interesting toy, not felt pain. Re-examine the buyer.
- **False-block rate can't get under 1/user/week** without gutting detection → the core technical bet doesn't hold at this scope.

### Watch, don't panic

- Enterprise AI agreements moving down-market faster than expected shrinks the wedge over time. Not a v1 kill signal, but it sets the clock.
- Providers shipping their own governance features — likely, and mostly single-provider, which leaves the cross-provider audit story intact.

---

## 9. First seven days

| When | Action |
|---|---|
| Today | Verify engineering-prd skill version; sync repo if stale |
| Today | Run §6 input block through the skill, generate PRD + hierarchy + manifests |
| Sat–Sun | E1 + E3 skeleton via goal-and-loop on the Geekom; kg-gen sidecar installed and stability gate measured on a real policy |
| Mon 14 Sep | Draft post 1; build the 20-name target list |
| **Tue 15 Sep 08:00** | **Post 1 live** |
| Wed–Fri | E4 ledger; begin dogfooding with own developers |
| Following week | E5 chat surface; first scoping calls from post-1 engagement |
