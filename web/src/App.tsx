import { useEffect, useRef, useState } from 'react'
import { inspect, forward, briefing } from './apiClient'
import { Msg, Content, formatMessage } from './i18n'
import { color, radius, text, secondaryButton, tertiaryButton } from './design'
import { motion } from './design/motionTokens'
import { Composer } from './composer/Composer'
import { AreaMenuButton } from './composer/AreaMenuButton'
import { ReplyMessage } from './reply'
import { buildWireTranscriptView } from './provider-view'
import { rehydrateReply } from '../../core/src/features/inspection/transcript/rehydrate'
import { stripUnmappedPlaceholders } from './reply/stripUnmappedPlaceholders'
import type { ComposerState, InspectionVerdict, WireMessage, PlaceholderMapping, RehydrateResult, Locale } from './types'

// The governed chat surface + the management room, rendered through the real §1.1
// components (Handoff). The chat loop: type → inspect (customer-side) → mirror (what the
// provider gets) → forward the WIRE → reply → rehydrate LOCALLY (AF-307, mapping built
// in-browser, never sent). Provider view shows only placeholders (NG-1). Two rooms
// (rule 15): workspace = tool, management = document.
const L: Locale = 'de'
const DEMO_AREA_COUNT = 6

interface Turn {
  original: string
  verdict: InspectionVerdict
  wireUser: string
  providerReply: string
  rehydrate: RehydrateResult
  mapping: PlaceholderMapping
}

// Client-side placeholder→original mapping (NG-14): held in the browser only, never sent.
function mappingFrom(original: string, v: InspectionVerdict): PlaceholderMapping {
  const m: PlaceholderMapping = {}
  for (const s of v.spans) m[s.placeholder] = original.slice(s.offset, s.offset + s.length)
  return m
}

export function App() {
  const [room, setRoom] = useState<'workspace' | 'management'>('workspace')
  return (
    <div style={{ minHeight: '100vh', background: room === 'workspace' ? color.bgSurface : color.bgCanvas, color: color.ink, fontFamily: text.prompt.fontFamily }}>
      {room === 'workspace' ? <Workspace onEnterManagement={() => setRoom('management')} /> : <ManagementRoom onBack={() => setRoom('workspace')} />}
    </div>
  )
}

function Workspace({ onEnterManagement }: { onEnterManagement: () => void }) {
  const [draft, setDraft] = useState('')
  const [state, setState] = useState<ComposerState>('idle')
  const [verdict, setVerdict] = useState<InspectionVerdict | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [showProvider, setShowProvider] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingSend = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wireHistory: WireMessage[] = turns.flatMap((t) => [
    { role: 'user' as const, content: t.wireUser },
    { role: 'assistant' as const, content: t.providerReply },
  ])
  const degraded = verdict?.coverage === 'rules-only'

  useEffect(() => {
    if (!draft.trim()) {
      setState('idle')
      return
    }
    setState('typing')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void runInspect(), motion.typingPause.ms)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  async function runInspect() {
    setState('inspecting')
    setError(null)
    try {
      const v = await inspect(draft, wireHistory, 'web-1', turns.length)
      setVerdict(v)
      const next: ComposerState = v.verdict === 'clean' ? 'clean' : v.verdict === 'redact' ? 'touched' : 'blocked'
      setState(next)
      if (pendingSend.current && v.verdict === 'clean') {
        pendingSend.current = false
        void doSend(v)
      } else {
        pendingSend.current = false
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
      setState('typing')
    }
  }

  async function doSend(v: InspectionVerdict) {
    try {
      const nextWire: WireMessage[] = [...wireHistory, { role: 'user', content: v.redactedPrompt }]
      const reply = await forward(nextWire)
      const mapping = mappingFrom(draft, v)
      const rehydrate = rehydrateReply({ providerText: stripUnmappedPlaceholders(reply, mapping), mapping, locale: L })
      setTurns((ts) => [...ts, { original: draft, verdict: v, wireUser: v.redactedPrompt, providerReply: reply, rehydrate, mapping }])
      setDraft('')
      setVerdict(null)
      setState('idle')
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    }
  }

  function onSend() {
    if (state === 'clean' || state === 'touched') {
      if (verdict) void doSend(verdict)
    } else if (state === 'typing' || state === 'idle') {
      pendingSend.current = true
      if (timer.current) clearTimeout(timer.current)
      void runInspect()
    }
  }

  const areaMenu = degraded
    ? { labelKey: 'header.rules_only', n: 0 }
    : state === 'touched' && verdict
      ? { labelKey: verdict.touchedAreas.length === 1 ? 'header.areas_touched_one' : 'header.areas_touched', n: verdict.touchedAreas.length }
      : { labelKey: 'header.areas_protected', n: DEMO_AREA_COUNT }

  const title = turns[0] ? turns[0].original.replace(/⟨[^⟩]*⟩/g, '').split(/\s+/).slice(0, 6).join(' ') : null
  const wireView = buildWireTranscriptView(wireHistory)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
      <Sidebar onEnterManagement={onEnterManagement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 57, padding: '14px 28px', borderBottom: `1px solid ${color.line}` }}>
          {title ? <Content style={{ ...text.headerTitle, color: color.ink }}>{title}</Content> : <Msg k="header.new_title" locale={L} style={{ ...text.headerTitle, color: color.ink }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {turns.length > 0 ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => setShowProvider(false)} style={{ ...secondaryButton, borderColor: showProvider ? color.line : color.teal, color: showProvider ? color.muted : color.ink }}>
                  <Msg k="header.view_own" locale={L} />
                </button>
                <button type="button" onClick={() => setShowProvider(true)} style={{ ...secondaryButton, borderColor: showProvider ? color.teal : color.line, color: showProvider ? color.ink : color.muted }}>
                  <Msg k="header.view_provider" locale={L} />
                </button>
              </div>
            ) : null}
            <AreaMenuButton labelKey={areaMenu.labelKey} n={areaMenu.n} locale={L} />
          </div>
        </header>

        <main style={{ flex: 1, width: '100%', maxWidth: 820, margin: '0 auto', padding: '24px 28px 0', boxSizing: 'border-box' }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 18 }}>
            {showProvider
              ? <ProviderView wireView={wireView} />
              : turns.map((t, i) => <TurnView key={i} turn={t} />)}
          </section>

          <Composer state={state} verdict={verdict} degraded={degraded} locale={L} draft={draft} editable onDraftChange={setDraft} onSend={onSend} />
          <Msg k={turns.length > 0 ? 'footnote.restored' : 'footnote.default'} locale={L} as="p" style={{ ...text.footnote, color: color.muted, textAlign: 'center', margin: '10px 0 24px' }} />
          {error ? <Content style={{ ...text.explain, color: color.red, display: 'block', textAlign: 'center' }}>{error}</Content> : null}
        </main>
      </div>
    </div>
  )
}

function Sidebar({ onEnterManagement }: { onEnterManagement: () => void }) {
  return (
    <aside style={{ background: color.bgSurface, borderRight: `1px solid ${color.line}`, padding: '18px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...text.capsLabel, color: color.teal, padding: '0 6px' }}>NorthGuard</div>
      <button type="button" style={{ ...secondaryButton, textAlign: 'left' }}>
        <Msg k="sidebar.new_conversation" locale={L} />
      </button>
      <Msg k="sidebar.today" locale={L} style={{ ...text.capsLabel, color: color.muted, padding: '8px 6px 0' }} />
      <Msg k="sidebar.history_empty" locale={L} as="p" style={{ ...text.explain, color: color.muted, margin: '0 6px' }} />
      <div style={{ flex: 1 }} />
      <button type="button" onClick={onEnterManagement} style={{ ...tertiaryButton, textAlign: 'left' }}>
        <Msg k="mgmt.label" locale={L} />
      </button>
    </aside>
  )
}

function TurnView({ turn }: { turn: Turn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: color.bgRaised, border: `1px solid ${color.line}`, borderRadius: radius.bubble, padding: '12px 16px' }}>
        <Content style={{ ...text.message, color: color.ink }}>{turn.original}</Content>
        <Msg
          k={turn.verdict.spans.length ? 'msg.transmitted_redacted' : 'msg.transmitted_plain'}
          locale={L}
          p={{ n: turn.verdict.spans.length, areas: turn.verdict.touchedAreas.map((a) => a.area).join(', ') }}
          as="div"
          style={{ ...text.monoMeta, color: color.muted, marginTop: 6 }}
        />
      </div>
      <ReplyMessage result={turn.rehydrate} locale={L} providerText={turn.providerReply} mapping={turn.mapping} />
    </div>
  )
}

function ProviderView({ wireView }: { wireView: ReturnType<typeof buildWireTranscriptView> }) {
  return (
    <section data-testid="provider-view" style={{ background: color.bgRaised, border: `1px solid ${color.line}`, borderRadius: radius.mirror, padding: 16 }}>
      <Msg k="footnote.provider_view" locale={L} as="p" style={{ ...text.monoAttribution, color: color.muted, margin: '0 0 10px' }} />
      {wireView.turns.map((t, i) => (
        <Content key={i} as="div" style={{ ...text.monoWire, color: t.role === 'user' ? color.ink : color.muted, margin: '4px 0' }}>
          {t.content}
        </Content>
      ))}
      {wireView.turns.length === 0 ? <Msg k="composer.status_nothing_sent" locale={L} style={{ ...text.monoStatus, color: color.muted }} /> : null}
    </section>
  )
}

function ManagementRoom({ onBack }: { onBack: () => void }) {
  const [md, setMd] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  async function load() {
    setPhase('loading')
    try {
      const b = await briefing()
      setMd(b.markdown)
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 40px 40px' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
        <Msg k="mgmt.label" locale={L} style={{ ...text.capsLabel, color: color.muted }} />
        <button type="button" onClick={onBack} style={tertiaryButton}>
          <Msg k="threshold.back" locale={L} />
        </button>
      </header>
      <Msg k="threshold.headline" locale={L} as="h1" style={{ ...text.brief, color: color.ink, margin: '0 0 16px' }} />
      <Msg k="threshold.body" locale={L} p={{ n: 5 }} as="p" style={{ ...text.explain, color: color.muted, margin: '0 0 26px' }} />
      {phase !== 'done' ? (
        <button type="button" onClick={load} disabled={phase === 'loading'} style={secondaryButton}>
          <Msg k="mgmt.nav.briefing" locale={L} />
        </button>
      ) : (
        <Content as="pre" style={{ whiteSpace: 'pre-wrap', ...text.reply, color: color.ink }}>{md}</Content>
      )}
      {phase === 'error' ? <Msg k="briefing.duplicate_none" locale={L} as="p" style={{ ...text.explain, color: color.red }} /> : null}
    </div>
  )
}
