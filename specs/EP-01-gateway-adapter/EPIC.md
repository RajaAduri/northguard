# EP-01: Gateway — Interception Adapter Contract (browser extension, block-and-warn)
**Status:** DECIDED as a browser extension (2026-09-17, DECISION-REGISTER §8 A1) —
**contract only for now; decompose after E5 ships.**

## Why this epic is a contract (and why it is a browser extension)

The interception question is resolved: **a browser extension, not an API gateway.**
A network proxy cannot see a prompt typed into a web AI tool at the point it is
composed, and an API gateway sees none of the shadow-AI traffic that is the
product's whole premise — the leak happens in the browser (§8 A1).

The extension, however, cannot deliver in-place redaction reliably: React, Vue and
Svelte serialise internal component state on submit, so mutating `element.value`
from a content script transmits the *original* unless a fragile synthetic-event
sequence is dispatched. So E1 is the **block-and-warn coverage surface**, and the
full redact-and-continue experience is **E5 (the governed chat surface)**. Both
implement the same `InterceptionAdapter`. E1 stays a contract until E5 ships; then
it is a later, contained project against the seam below.

### E1 (extension) responsibilities in v1 — block-and-warn only
Intercept the host tool's send action on supported AI sites; hold the submission;
call the local inspection service (the core, on customer infra); on a touch, show
the violation and a **sanitised string the user can copy** into the input. **No
in-place DOM redaction in v1.** Positioning: *use ours (E5) and it is better; go
elsewhere and we still catch you.*

## The adapter contract

The interception mechanism is the only component that touches raw provider I/O.
It has exactly two responsibilities and no others: submit a prompt for inspection,
and forward the sanitised (wire) transcript to the provider. It never inspects,
never redacts, never writes the ledger, never rehydrates — it delegates all of
that to the core. This keeps the fragile, architecture-specific plumbing thin.

```ts
// core/lib/types.ts — the shared contract (single source of truth, never duplicated)

export type Locale = 'de' | 'en'
export type Verdict = 'clean' | 'redact' | 'block'
export type Layer = 'rule' | 'llm'
export type Coverage = 'full' | 'rules-only'
export type AreaMode = 'block' | 'redact'

export interface WireMessage {          // the ONLY shape ever transmitted upstream
  role: 'user' | 'assistant' | 'system'
  content: string                       // redacted; contains semantic placeholders only
}

export interface RedactionSpan {
  offset: number
  length: number
  area: string                          // protected area id/label
  layer: Layer                          // which layer caught it
  ruleId?: string                       // present when layer === 'rule'
  placeholder: string                   // e.g. "⟨Lieferant 1⟩"  (NG-11)
  pseudonym: string                     // HMAC(customerKey, normalize(value)) (NG-10)
  keyEpoch: number
}

export interface AreaAttribution { area: string; mode: AreaMode; layers: Layer[] }

export interface InspectionRequest {
  conversationId: string
  turnIndex: number
  history: WireMessage[]                 // prior turns, ALREADY redacted (wire transcript)
  draftPrompt: string                    // the new prompt, ORIGINAL text (customer-side only)
  locale: Locale
  policyVersion: string                  // content hash of the active, confirmed policy
}

export interface InspectionVerdict {
  verdict: Verdict
  touchedAreas: AreaAttribution[]
  spans: RedactionSpan[]
  redactedPrompt: string                 // wire text with semantic, indexed placeholders
  displayPlaceholders: DisplayPlaceholder[] // client uses these to build the LOCAL mapping
  confidence: number
  caughtBy: string | null                // "rules" | "LLM backstop" | "rules + LLM" | null
  coverage: Coverage
  ledgerEntryId: string                  // E4 entry is written BEFORE this returns (NG-5)
}

export interface DisplayPlaceholder {    // NOTE: carries NO original value — mapping is built client-side
  placeholder: string
  area: string
  layer: Layer
  index: number
}

export interface ProviderChunk { delta: string; done: boolean }

// ── The contract ──────────────────────────────────────────────────────────────
export interface InterceptionAdapter {
  submitForInspection(req: InspectionRequest): Promise<InspectionVerdict>
  forwardToProvider(wire: WireMessage[], opts: { stream: boolean }): AsyncIterable<ProviderChunk>
}
```

### Binding rules on any implementation

1. `submitForInspection` MUST call the core inspection entry point (E3 `AF-303`) and
   MUST NOT transmit `draftPrompt` anywhere except into the core (which runs on
   customer infra). The original never reaches the provider.
2. `forwardToProvider` MUST transmit only `WireMessage[]` — the redacted wire
   transcript — including as history on later turns (NG-1). It preserves
   placeholders in the stream so the client can rehydrate (E3 `AF-307`).
3. On provider failure, the adapter MUST surface a typed error AND the core MUST
   already have written the ledger entry (NG-5, FR-14). The adapter never
   suppresses the ledger write.
4. The reversible placeholder→original mapping is built and held **client-side**
   from `displayPlaceholders`; the adapter never sees or forwards it (NG-14).
5. Streaming (NFR-03) is the adapter's concern; the core is streaming-agnostic.
6. **Actor identity (NG-19):** the adapter passes the raw `userId` into the core
   (customer-side, via `RequestMeta` on the inspection call) and **never persists it
   itself**. The core derives `actorPseudonym = HMAC(customerKey, normalize(userId))`
   before the ledger write; the plaintext id never reaches the ledger. Recovering a
   person from a pseudonym is the dual-key unmask (NG-20, E4 `AF-408`), never the
   adapter's job.

### What a gateway implementation would add (later, out of scope now)
OpenAI-compatible `/v1/chat/completions`, request parsing, provider SDK, SSE
streaming, key handling (D3). — **not built.**

### What the browser-extension (block-and-warn) implementation adds — later, after E5
DOM hook on the host tool's send action; hold submission; local call to the
inspection service; render the violation + a copyable sanitised string; **no
in-place DOM redaction in v1**. Because the extension does not redact in place, its
conformance target is narrower than E5's: it must never forward on a `block`/`redact`
touch, and it must surface the sanitised string rather than silently mutate the
input. — **not built yet; decompose after E5.**

## Scope
- **In scope (now):** the contract types in `core/lib/types.ts`; a conformance
  test suite every interceptor must pass (wire-isolation, ledger-before-reply,
  degrade-don't-fail-open) — E5 passes it now; the extension passes it later.
- **Out of scope (now):** the extension implementation (decompose after E5). E5, the
  other implementer of this contract, **is** decomposed — see `specs/EP-05-chat-surface/`.
