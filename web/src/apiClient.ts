import type { BriefingInputs, InspectionVerdict, WireMessage } from './types'

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
