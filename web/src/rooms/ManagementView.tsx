import type { JSX } from 'react'
import type { BriefingView, Locale, MgmtTab, ThresholdView } from '../types'
import { buildManagementShell } from './buildManagementShell'
import { Msg, Content } from '../i18n'
import { color, radius, text, sendButton } from '../design'

// SF-5084 — the ONE management-room surface (Handoff rule 15): the document register — a
// 720px Fraunces column, hairline sections, caps-mono table head, no zebra, NO person
// column (NG-13). ThresholdGate is the named, dated step onto it. Both consume the tested
// view-models (buildThresholdModel / buildBriefingView); this is the only management surface
// the app and the screenshots render (Sprint 10 F2 — the earlier three were collapsed here).

export interface ThresholdGateProps {
  model: ThresholdView
  locale: Locale
  onEnter?: () => void
}

export function ThresholdGate({ model, locale, onEnter }: ThresholdGateProps): JSX.Element {
  return (
    <section data-testid="threshold" style={{ maxWidth: 720, margin: '0 auto', padding: '64px 40px', textAlign: 'center' }}>
      <Msg k={model.kickerKey} locale={locale} p={{ kw: model.week }} data-testid="threshold-kicker" style={{ ...text.capsLabel, color: color.teal }} />
      <Msg k={model.headlineKey} locale={locale} as="h1" style={{ ...text.empty, color: color.ink, margin: '16px 0' }} />
      <Msg k={model.bodyKey} locale={locale} p={{ n: model.people }} as="p" data-testid="threshold-body" style={{ ...text.explain, color: color.muted, maxWidth: 520, margin: '0 auto 24px' }} />
      <button type="button" onClick={onEnter} style={sendButton('teal')}>
        <Msg k={model.enterKey} locale={locale} />
      </button>
    </section>
  )
}

export interface ManagementViewProps {
  activeTab: MgmtTab
  locale: Locale
  briefing?: BriefingView
  range?: string
  onBack?: () => void
}

const hairlineSection = { borderTop: `1px solid ${color.line}`, paddingTop: 22, marginTop: 26 }
const fmtHours = (low: number, high: number): string => (low === high ? `${high} h` : `${low}–${high} h`)

export function ManagementView({ activeTab, locale, briefing, range, onBack }: ManagementViewProps): JSX.Element {
  const shell = buildManagementShell(activeTab)
  return (
    <main
      data-testid="management-view"
      data-person-column={String(shell.hasPersonColumn)}
      style={{ maxWidth: shell.maxWidthPx, margin: '0 auto', padding: '44px 40px 40px', fontFamily: shell.typeface }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {shell.navKeys.map((k) => (
            <Msg key={k} k={k} locale={locale} data-testid={undefined} style={{ ...text.capsLabel, color: k === `mgmt.nav.${activeTab === 'false-positives' ? 'false_positives' : activeTab}` ? color.ink : color.muted }} />
          ))}
        </nav>
        {onBack ? (
          <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: color.muted, cursor: 'pointer', ...text.capsLabel }}>
            <Msg k="mgmt.to_workspace" locale={locale} />
          </button>
        ) : null}
      </header>

      {activeTab === 'briefing' && briefing ? <Briefing briefing={briefing} locale={locale} range={range} /> : null}
    </main>
  )
}

function Briefing({ briefing, locale, range }: { briefing: BriefingView; locale: Locale; range?: string }): JSX.Element {
  return (
    <article data-testid="briefing-document">
      <Msg
        k="briefing.meta"
        locale={locale}
        p={{ kw: briefing.week, range: range ?? briefing.week, p: briefing.people, r: briefing.requests }}
        as="p"
        style={{ ...text.capsLabel, color: color.muted, margin: 0 }}
      />
      <Msg k="briefing.duplicate_work" locale={locale} as="h1" style={{ ...text.brief, color: color.ink, margin: '12px 0 4px' }} />
      <Msg k="briefing.duplicate_estimate" locale={locale} p={{ range: fmtHours(briefing.estimate.low, briefing.estimate.high) }} as="p" style={{ ...text.section, color: color.teal, margin: '0 0 18px' }} />

      {briefing.rows.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) 150px minmax(0,1fr)', gap: 20 }}>
          <Msg k="briefing.col_observation" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
          <Msg k="briefing.col_scope" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
          <Msg k="briefing.col_artefact" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
          {briefing.rows.map((r, i) => (
            <Content key={i} as="div" style={{ display: 'contents' }}>
              <Content as="div" style={{ ...text.message, color: color.ink, borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>{r.observation}</Content>
              <Content as="div" style={{ ...text.monoMeta, color: color.muted, borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>{r.scope}</Content>
              <Content as="div" style={{ ...text.message, color: color.ink, borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>{r.artefact}</Content>
            </Content>
          ))}
        </div>
      ) : (
        <Msg k="briefing.duplicate_none" locale={locale} as="p" style={{ ...text.explain, color: color.muted }} />
      )}

      <Msg k="briefing.estimate_note" locale={locale} as="p" style={{ ...text.explain, color: color.muted, ...hairlineSection }} />

      <div style={{ display: 'flex', gap: 28, ...hairlineSection }}>
        <Stat n={briefing.stats.requests} k="briefing.stat_requests" locale={locale} />
        <Stat n={briefing.stats.redactedForwarded} k="briefing.stat_redacted" locale={locale} />
        <Stat n={briefing.stats.blocked} k="briefing.stat_blocked" locale={locale} />
        <Stat n={briefing.duplicateRequests} k="briefing.stat_duplicate" locale={locale} />
      </div>
    </article>
  )
}

function Stat({ n, k, locale }: { n: number; k: string; locale: Locale }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Content style={{ fontFamily: text.brief.fontFamily, fontSize: 24, color: color.ink }}>{n}</Content>
      <Msg k={k} locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
    </div>
  )
}
