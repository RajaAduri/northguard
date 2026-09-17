# EP-01: Gateway — Interception Adapter Contract
**Status:** DEFERRED — contract only, no implementation built.

## Why this epic is not decomposed

The interception mechanism is under evaluation and may be an **API gateway** (an
OpenAI-compatible endpoint existing tools are repointed at) **or a browser
extension** (which hooks the host tool's send action). That choice determines the
implementation of both this epic and E5 (Chat Surface). Rather than build to a
guess, E1 is specified as the **seam** every interceptor must satisfy. The core
(E2–E4, E6–E7) is built against this contract; either implementation is a later,
contained project.

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

### What a gateway implementation would add (later, out of scope now)
OpenAI-compatible `/v1/chat/completions`, request parsing, provider SDK, SSE
streaming, key handling (D3). — **not built.**

### What a browser-extension implementation would add (later, out of scope now)
DOM hook on the host tool's send action, in-page rendering of the E5 states,
local call to the inspection service. — **not built.**

## Scope
- **In scope (now):** the contract types in `core/lib/types.ts`; a conformance
  test suite the eventual implementation must pass (wire-isolation, ledger-before-
  reply, degrade-don't-fail-open).
- **Out of scope (now):** any implementation of either interceptor.
