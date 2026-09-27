import { useEffect, useState, type JSX } from 'react'
import type { Locale } from '../types'
import { health } from '../apiClient'
import { Msg } from '../i18n'
import { color, radius, text } from '../design'

// SF-5101 — a small status bar in the sidebar showing whether the backend (gateway), the
// backstop (E3 AI check) and the sidecar (kg-gen) are reachable. It polls /api/health, whose
// gateway probes the two services. A dead service is now visible in the UI instead of only
// surfacing as a stalled inspection — which is exactly what the operator needs to see.
type Reach = 'up' | 'down' | 'checking'

const dotColor = (r: Reach): string => (r === 'up' ? color.teal : r === 'down' ? color.red : color.muted)
const stateKey = (r: Reach): string => (r === 'up' ? 'status.reachable' : r === 'down' ? 'status.unreachable' : 'status.checking')

export function StatusBar({ locale }: { locale: Locale }): JSX.Element {
  const [s, setS] = useState<{ backend: Reach; backstop: Reach; sidecar: Reach }>({ backend: 'checking', backstop: 'checking', sidecar: 'checking' })

  useEffect(() => {
    let alive = true
    const check = async (): Promise<void> => {
      try {
        const h = await health()
        if (alive) setS({ backend: h.ok ? 'up' : 'down', backstop: h.backstop ? 'up' : 'down', sidecar: h.sidecar ? 'up' : 'down' })
      } catch {
        if (alive) setS({ backend: 'down', backstop: 'down', sidecar: 'down' }) // gateway itself unreachable
      }
    }
    void check()
    const id = setInterval(() => void check(), 15000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // A step the journey harness could not run for real is driven with ?mock=<pieces>; surface
  // it loudly so a mocked run is never mistaken for a real one (never fail silently).
  let mock: string | null = null
  try {
    mock = new URLSearchParams(window.location.search).get('mock')
  } catch {
    mock = null
  }

  const rows: [string, Reach][] = [['status.backend', s.backend], ['status.backstop', s.backstop], ['status.sidecar', s.sidecar]]
  return (
    <div data-testid="status-bar" style={{ borderTop: `1px solid ${color.line}`, paddingTop: 10, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {mock ? (
        <div data-testid="mock-label" style={{ ...text.capsLabel, color: color.bgSurface, background: color.red, borderRadius: radius.smallButton, padding: '3px 8px', textAlign: 'center' }}>
          {`MOCK · ${mock}`}
        </div>
      ) : null}
      <Msg k="status.title" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
      {rows.map(([k, r]) => (
        <div key={k} data-service={k} data-reach={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: radius.smallButton, background: dotColor(r), flex: '0 0 auto' }} />
          <Msg k={k} locale={locale} style={{ ...text.monoMeta, color: color.muted }} />
          <span style={{ flex: 1 }} />
          <Msg k={stateKey(r)} locale={locale} style={{ ...text.monoMeta, color: dotColor(r) }} />
        </div>
      ))}
    </div>
  )
}
