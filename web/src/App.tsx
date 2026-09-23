import { useState } from 'react'
import { inspect, forward, briefing } from './apiClient'
import { formatMessage } from './i18n'
import { color } from './design'
import { buildMirrorModel } from './mirror'
import { buildWireTranscriptView } from './provider-view'
import { rehydrateReply } from '../../core/src/features/inspection/transcript/rehydrate'
import type { InspectionVerdict, WireMessage, PlaceholderMapping } from './types'

// The governed chat surface + the management room. The chat loop: type → inspect
// (customer-side) → mirror (what the provider gets) → forward the WIRE → reply →
// rehydrate LOCALLY (AF-307, mapping built in-browser, never sent) → provider view
// shows only placeholders (NG-1).
const L = 'de' as const

interface Turn {
  original: string
  verdict: InspectionVerdict
  wireUser: string
  providerReply: string // placeholder form (what came back over the wire)
  restored: string // local rehydration (this browser only)
  blocked: boolean
}

// Build the client-side placeholder→original mapping from the original prompt + spans.
// Held in the browser only (NG-14); it never crosses the wire.
function mappingFrom(original: string, v: InspectionVerdict): PlaceholderMapping {
  const m: PlaceholderMapping = {}
  for (const s of v.spans) m[s.placeholder] = original.slice(s.offset, s.offset + s.length)
  return m
}

export function App() {
  const [room, setRoom] = useState<'workspace' | 'management'>('workspace')
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: color.ink, background: color.bgCanvas, minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${color.line}` }}>
        <strong>NorthGuard</strong>
        <button type="button" onClick={() => setRoom(room === 'workspace' ? 'management' : 'workspace')}
          style={{ border: `1px solid ${color.line}`, background: 'transparent', color: color.ink, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
          {room === 'workspace' ? formatMessage('threshold.enter', L) : formatMessage('mgmt.to_workspace', L)}
        </button>
      </header>
      {room === 'workspace' ? <Workspace /> : <Management />}
    </div>
  )
}

function Workspace() {
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const [showProvider, setShowProvider] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wireHistory: WireMessage[] = turns.flatMap((t) => t.blocked ? [] : [
    { role: 'user' as const, content: t.wireUser },
    { role: 'assistant' as const, content: t.providerReply },
  ])

  async function onSend() {
    if (!draft.trim() || busy) return
    setBusy(true); setError(null)
    try {
      const v = await inspect(draft, wireHistory, 'web-1', turns.length)
      if (v.verdict === 'block') {
        setTurns((ts) => [...ts, { original: draft, verdict: v, wireUser: v.redactedPrompt, providerReply: '', restored: '', blocked: true }])
        setDraft(''); return
      }
      const nextWire: WireMessage[] = [...wireHistory, { role: 'user', content: v.redactedPrompt }]
      const reply = await forward(nextWire)
      const restored = rehydrateReply({ providerText: reply, mapping: mappingFrom(draft, v), locale: L }).restoredText
      setTurns((ts) => [...ts, { original: draft, verdict: v, wireUser: v.redactedPrompt, providerReply: reply, restored, blocked: false }])
      setDraft('')
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    } finally {
      setBusy(false)
    }
  }

  const wireView = buildWireTranscriptView(wireHistory)

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: color.muted }}>
          <input type="checkbox" checked={showProvider} onChange={(e) => setShowProvider(e.target.checked)} />{' '}
          {formatMessage('header.view_provider', L)}
        </label>
      </div>

      {showProvider ? (
        <section data-testid="provider-view" style={{ border: `1px solid ${color.line}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: color.muted, marginBottom: 8 }}>{formatMessage('footnote.provider_view', L)}</div>
          {wireView.turns.map((t, i) => (
            <div key={i} style={{ margin: '6px 0', color: t.role === 'user' ? color.ink : color.muted }}><b>{t.role}:</b> {t.content}</div>
          ))}
          {wireView.turns.length === 0 ? <em style={{ color: color.muted }}>{formatMessage('composer.status_nothing_sent', L)}</em> : null}
        </section>
      ) : (
        <section>
          {turns.map((t, i) => <TurnView key={i} turn={t} />)}
        </section>
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${color.line}`, paddingTop: 12 }}>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Nachricht …"
          style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${color.line}`, fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: color.muted }}>{formatMessage('footnote.default', L)}</span>
          <button type="button" onClick={onSend} disabled={busy || !draft.trim()}
            style={{ background: busy ? color.line : color.teal, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: busy ? 'default' : 'pointer' }}>
            {busy ? formatMessage('composer.status_inspecting', L) : formatMessage('composer.send_redacted', L)}
          </button>
        </div>
        {error ? <div style={{ color: color.red, fontSize: 13, marginTop: 6 }}>{error}</div> : null}
      </div>
    </main>
  )
}

function TurnView({ turn }: { turn: Turn }) {
  const mirror = buildMirrorModel(turn.verdict)
  return (
    <div style={{ margin: '14px 0', borderBottom: `1px solid ${color.line}`, paddingBottom: 14 }}>
      <div style={{ fontSize: 13, color: color.muted }}>Sie: {turn.original}</div>
      <div style={{ marginTop: 6, padding: 10, background: color.bgRaised, borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: color.muted }}>{formatMessage('mirror.title', L)} · {mirror.summary.count} · {mirror.summary.areas.join(', ') || '—'}</div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginTop: 4 }}>{mirror.wireText}</div>
      </div>
      {turn.blocked
        ? <div style={{ marginTop: 8, color: color.red }}><b>{formatMessage('block.title', L)}</b> — {formatMessage('block.no_approval', L)}</div>
        : <div style={{ marginTop: 8 }}><b>Antwort (lokal eingesetzt):</b><div>{turn.restored}</div></div>}
    </div>
  )
}

function Management() {
  const [md, setMd] = useState<string>('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  async function load() {
    setState('loading')
    try { const b = await briefing(); setMd(b.markdown); setState('done') } catch { setState('error') }
  }
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px', fontFamily: 'Fraunces, Georgia, serif' }}>
      <div style={{ fontSize: 13, color: color.muted }}>{formatMessage('threshold.body', L, { n: 5 })}</div>
      <h2 style={{ fontFamily: 'inherit' }}>{formatMessage('mgmt.nav.briefing', L)}</h2>
      {state !== 'done'
        ? <button type="button" onClick={load} disabled={state === 'loading'}
            style={{ border: `1px solid ${color.line}`, background: 'transparent', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>
            {state === 'loading' ? '…' : 'Briefing laden'}
          </button>
        : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{md}</pre>}
      {state === 'error' ? <div style={{ color: color.red }}>Briefing nicht erreichbar.</div> : null}
    </main>
  )
}
