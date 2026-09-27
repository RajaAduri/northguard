import type { BriefingInputs, FpReportPayload, InspectionVerdict, TriggerGroup, WireMessage } from './types'

// Talks to the gateway via the Vite /api proxy. The ORIGINAL prompt goes to /inspect
// (customer-side, same trust domain); only the wire goes to /forward.
export async function inspect(draftPrompt: string, history: WireMessage[], conversationId: string, turnIndex: number): Promise<InspectionVerdict> {
  const r = await fetch('/api/inspect', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ draftPrompt, history, conversationId, turnIndex, locale: 'de' }),
  })
  if (!r.ok) throw new Error(`inspect ${r.status}`)
  return (await r.json()) as InspectionVerdict
}

export async function forward(wire: WireMessage[]): Promise<string> {
  const r = await fetch('/api/forward', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ wire }),
  })
  if (!r.ok) throw new Error(`forward ${r.status}`)
  return ((await r.json()) as { completion: string }).completion
}

export interface HealthStatus {
  ok: boolean
  backstop: boolean
  sidecar: boolean
  forwardModel?: string
  policyVersion?: string
  areas?: number
  fpOpen?: number // open false-positive reports (for the management badge)
}

// F4 — submit a false-positive report. The gateway writes it as a governance ledger entry
// (FR-18, NG-12). The payload has already had context withheld unless the reporter opted in.
export async function report(payload: FpReportPayload): Promise<{ faId: string }> {
  const r = await fetch('/api/report', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`report ${r.status}`)
  return (await r.json()) as { faId: string }
}

// F4 — the false-positive review queue, grouped by trigger not by reporter (NG-13).
export async function fpQueue(): Promise<{ groups: TriggerGroup[]; count: number }> {
  const r = await fetch('/api/fp-queue')
  if (!r.ok) throw new Error(`fp-queue ${r.status}`)
  return (await r.json()) as { groups: TriggerGroup[]; count: number }
}

// Backend reachability + the backstop/sidecar probes the gateway performs. A throw means
// the backend itself is unreachable (the status bar shows everything down).
export async function health(): Promise<HealthStatus> {
  const r = await fetch('/api/health')
  if (!r.ok) throw new Error(`health ${r.status}`)
  return (await r.json()) as HealthStatus
}

export async function briefing(): Promise<{ markdown: string; inputs: BriefingInputs; sufficient: boolean; findings: number }> {
  const r = await fetch('/api/briefing')
  if (!r.ok) throw new Error(`briefing ${r.status}`)
  return (await r.json()) as { markdown: string; inputs: BriefingInputs; sufficient: boolean; findings: number }
}
