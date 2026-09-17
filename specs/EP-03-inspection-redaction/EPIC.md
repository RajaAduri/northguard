# EP-03: Inspection & Decision + Redaction/Rehydration Engine
**Status:** DECOMPOSED — the correctness core of the product.

## Business Context
Every prompt passes through here before anything leaves the building. Two concerns
live together because they share the placeholder/span model:

- **Detection & Decision (FT-3.1–3.3):** deterministic rules first (DE+EN, no
  network, <50 ms), an LLM backstop only when rules are inconclusive, then a
  verdict with span-level attribution and per-area block/redact modes. Never fails
  open — if the backstop is down, coverage is recorded, not hidden.
- **Redaction & Transcript Engine (FT-3.4–3.7):** a **pure, stateless** module
  that turns spans into semantic indexed placeholders, derives keyed pseudonyms,
  builds the wire transcript and asserts two-transcript isolation, and rehydrates
  replies client-side with declension tolerance and a strict never-guess rule.

## Detection rebalance — the model is the detector, rules are a latency strategy (§8 A4)
Directional benchmarking (PIIBench and vendor-adjacent sources) puts rule engines
near **F1 ≈ 0.14 with ~17% recall on contextual entities**, versus **~0.99** for a
fine-tuned small language model and **~0.94** for a quantised Gemma-2B. Rules-first
stays correct for the <50 ms deterministic path (NFR-01, NG-7) — but the rules layer
catches almost nothing *contextual*, so **the backstop model is the detector, not the
fallback.** Consequences for this epic:

- **Build order (R12):** German lexicons (SF-3011/3013) and backstop-model
  integration (AF-302) come **before** regex breadth (SF-3012). Do not spend the
  sprint perfecting patterns that contribute a small fraction of recall.
- **German is hard for detection specifically:** compound nouns break whitespace
  tokenisation; declension across four cases defeats English-trained NER; German
  identifiers need real validation — **IBAN (MOD-97 checksum), *Steuernummer*
  (format varies across the sixteen Bundesländer), *Handelsregisternummer* (standard
  form).** These are the acceptance targets for the rules layer, and NG-18's corpus
  must exercise the compound-noun and four-case declension behaviour.
- **Degradation is now more visible, not less:** with the model as the detector,
  `coverage:'rules-only'` (NG-4) means recall drops materially — the degraded banner
  (E5) must say so plainly, not treat rules-only as near-parity.

## The transcript engine is pure and stateless (NG-14)
It accepts `(text, spans, key, mapping?)` and returns `(wireText,
displayPlaceholders, pseudonyms)`. **It owns no state and persists nothing. There
is no server-side mapping store anywhere in NorthGuard.** The reversible
placeholder→original mapping is built from `displayPlaceholders` and held
**client-side only**, discarded when the conversation closes (FR-08e). The
pseudonym is a one-way keyed hash — not the mapping — and is the only entity
token that may reach the ledger (NG-10).

## Scope
- **In scope:** rules layer, backstop invocation + degradation, verdict assembly,
  placeholder generation, pseudonym derivation, wire-transcript construction +
  isolation assertion, client-side rehydration matcher.
- **Out of scope:** provider egress/streaming (E1 adapter); rendering (E5);
  storing the mapping anywhere (forbidden, NG-14); file/image inspection (cut C2).

## Features
| ID | Feature | Stories | App Functions |
|----|---------|---------|---------------|
| FT-3.1 | Rules Layer (DE+EN, <50 ms, no network) | US-006 | AF-301 |
| FT-3.2 | LLM Backstop (only when inconclusive) + degradation | US-007 | AF-302 |
| FT-3.3 | Verdict Assembly (span attribution, per-area mode, coverage) | US-008 | AF-303 |
| FT-3.4 | Semantic Placeholder Generation | US-009 | AF-304 |
| FT-3.5 | Pseudonym Derivation | US-010 | AF-305 |
| FT-3.6 | Wire Transcript & Two-Transcript Invariant | US-011 | AF-306 |
| FT-3.7 | Rehydration Engine (declension-tolerant, never-guess) | US-012 | AF-307 |

## Success Metrics
| Metric | Target |
|--------|--------|
| Rules layer p95 | < 50 ms (NFR-01) |
| Full inspection p95 (before provider) | < 800 ms (NFR-02) |
| Contextual-entity recall | Carried by the model (AF-302), not the rules layer (§8 A4) |
| German identifier validation | IBAN MOD-97 valid/invalid distinguished; Steuernummer per-Bundesland; Handelsregisternummer standard form |
| Wire-isolation over 10 turns | 0 originals in any outbound payload |
| Rehydration wrong-substitution rate | 0 (never guess) |
