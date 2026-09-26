// NorthGuard gateway — the InterceptionAdapter realised as a localhost HTTP service.
// It runs on customer infra: the browser sends the ORIGINAL prompt here (same trust
// domain) for in-network inspection; only the redacted WIRE is forwarded to the provider.
// The core stays untouched — the gateway imports and calls it. NG-5 (ledger before
// reply) and NG-1 (wire isolation) are enforced inside assembleVerdict.
//   Run: npx vite-node gateway/server.ts
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { assembleVerdict } from '../core/src/features/inspection/verdict'
import { loadRulesLayer } from '../core/src/features/inspection/rules'
import { setLedgerPath } from '../core/src/features/ledger/append'
import { composeWeeklyBriefing } from '../core/src/features/management/briefing'
import { buildForwardMessages } from '../web/src/forward/buildForwardMessages'
import type { ActivePolicy, InspectionRequest, KeyMaterial, RecurringWorkFinding, WireMessage } from '../core/lib/types'

const NG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TENANT_DIR = join(NG_ROOT, '.tenant')
const PORT = Number(process.env.GATEWAY_PORT ?? 8080)
const LLM_URL = process.env.LOCAL_LLM_URL ?? 'http://127.0.0.1:11434/v1'
// The forwarding path and the backstop have different requirements (Sprint 9 A/B): a >=7B
// instruct model reliably preserves placeholders, a 4B does not. The backstop (a separate
// service) can stay small; forwarding uses qwen2.5:7b-instruct by default.
const FORWARD_MODEL = process.env.FORWARD_MODEL ?? 'qwen2.5:7b-instruct'
const LLM_KEY = process.env.LOCAL_LLM_KEY ?? 'not-required'

const DEMO_POLICY: ActivePolicy = {
  policyVersion: 'demo', activatedAt: new Date().toISOString(), activatedBy: 'gateway-demo',
  areas: [
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact' },
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact' },
    { id: 'lieferanten-konditionen', label: 'Lieferanten & Konditionen', mode: 'redact' },
    { id: 'zugangsdaten', label: 'Zugangsdaten', mode: 'block', echoBlockedSpans: false }, // credential-class: never echo the value (S10 decision)
  ],
}
function loadPolicy(): ActivePolicy {
  const p = join(TENANT_DIR, 'policy.json') // written by onboarding (step 8)
  if (existsSync(p)) {
    const b = JSON.parse(readFileSync(p, 'utf8')) as { version?: string; areas: ActivePolicy['areas']; createdAt?: string; approver?: string }
    return { policyVersion: b.version ?? 'v1.0', areas: b.areas, activatedAt: b.createdAt ?? new Date().toISOString(), activatedBy: b.approver ?? 'onboarding' }
  }
  return DEMO_POLICY
}

const key: KeyMaterial = { secret: process.env.NG_TENANT_SECRET ?? 'tenant-demo-secret', keyEpoch: 1 }
mkdirSync(TENANT_DIR, { recursive: true })
setLedgerPath(join(TENANT_DIR, 'ledger.jsonl'))
loadRulesLayer(join(NG_ROOT, 'lexicons'))

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
}
function send(res: import('node:http').ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { 'content-type': 'application/json', ...CORS })
  res.end(JSON.stringify(body))
}
async function readBody(req: import('node:http').IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

// Forward the WIRE to the provider stand-in (local model). Only placeholders leave here.
// The system prompt is built by buildForwardMessages: it preserves placeholders WITHOUT
// seeding example tokens, and omits the placeholder instruction entirely on a clean wire
// (P1 contamination fix).
async function forwardToProvider(wire: WireMessage[]): Promise<string> {
  const messages = buildForwardMessages(wire)
  const r = await fetch(`${LLM_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${LLM_KEY}` },
    body: JSON.stringify({ model: FORWARD_MODEL, messages, temperature: 0.2, stream: false }),
  })
  if (!r.ok) throw new Error(`provider ${r.status}`)
  const data = (await r.json()) as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message.content ?? ''
}

const E7_BRIDGE_URL = process.env.NORTHGUARD_E7_BRIDGE_URL ?? 'http://127.0.0.1:8079/recurring-findings'
// Ask the Python E7 bridge (B4) for recurring-work findings over the tenant ledger.
// If the bridge is down, the briefing still renders (findings empty) — degrade, not fail.
async function fetchRecurringFindings(): Promise<RecurringWorkFinding[]> {
  try {
    const r = await fetch(E7_BRIDGE_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ledgerPath: join(TENANT_DIR, 'ledger.jsonl') }),
    })
    if (!r.ok) return []
    return ((await r.json()) as { findings: RecurringWorkFinding[] }).findings ?? []
  } catch {
    return []
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {})
    const url = req.url ?? '/'
    if (req.method === 'GET' && url === '/api/health') {
      const p = loadPolicy()
      return send(res, 200, { ok: true, policyVersion: p.policyVersion, areas: p.areas.length, forwardModel: FORWARD_MODEL })
    }
    if (req.method === 'POST' && url === '/api/inspect') {
      const body = await readBody(req)
      const policy = loadPolicy()
      const ireq: InspectionRequest = {
        conversationId: body.conversationId ?? 'web', turnIndex: body.turnIndex ?? 0,
        history: body.history ?? [], draftPrompt: String(body.draftPrompt ?? ''),
        locale: body.locale ?? 'de', policyVersion: policy.policyVersion,
      }
      const verdict = await assembleVerdict(ireq, policy, { key, userId: body.userId ?? 'web-user', provider: 'local-llm (test stand-in)', baselineVersion: policy.policyVersion })
      return send(res, 200, verdict)
    }
    if (req.method === 'POST' && url === '/api/forward') {
      const body = await readBody(req)
      const completion = await forwardToProvider(body.wire ?? [])
      return send(res, 200, { completion })
    }
    if (req.method === 'GET' && url.startsWith('/api/briefing')) {
      const findings = await fetchRecurringFindings()
      const { inputs, markdown } = await composeWeeklyBriefing('2000-01-01', '2999-12-31', 'KW-live', 5, findings)
      // Return the structured inputs so the SPA renders the briefing DOCUMENT via
      // buildBriefingView (not raw markdown) — one management surface (Sprint 10 F2).
      return send(res, 200, { markdown, inputs, sufficient: inputs.sufficient, findings: inputs.findings.length })
    }
    return send(res, 404, { error: 'not found' })
  } catch (err) {
    return send(res, 500, { error: String(err instanceof Error ? err.message : err) })
  }
})
server.listen(PORT, () => console.log(`NorthGuard gateway on http://127.0.0.1:${PORT} (policy: ${loadPolicy().policyVersion})`))
