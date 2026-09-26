import type { JSX } from 'react'
import type { Locale } from '../types'
import { Msg, Content } from '../i18n'
import { color, text } from '../design'
import type { BriefingFixture } from './managementFixtures'

// SF-5096 — the weekly briefing as a DOCUMENT (Handoff rule 15 / §4 management layout): one
// 720px column, Fraunces headline, hairline section rules, caps-mono table head, no zebra,
// almost no colour. No person column, no ranking (NG-21) — observations name topics and
// artefacts. Estimates carry their rule (rule 12).
export interface BriefingDocumentProps {
  fixture: BriefingFixture
  locale: Locale
}

const hairlineSection = { borderTop: `1px solid ${color.line}`, paddingTop: 22, marginTop: 26 }

export function BriefingDocument({ fixture, locale }: BriefingDocumentProps): JSX.Element {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '44px 40px 40px' }}>
      <Msg
        k="briefing.meta"
        locale={locale}
        p={{ kw: fixture.kw, range: fixture.range, p: fixture.people, r: fixture.requests }}
        as="p"
        style={{ ...text.capsLabel, color: color.muted, margin: 0 }}
      />
      <Msg k="briefing.duplicate_work" locale={locale} as="h1" style={{ ...text.brief, color: color.ink, margin: '12px 0 4px' }} />
      <Msg k="briefing.duplicate_estimate" locale={locale} p={{ range: fixture.estimateRange }} as="p" style={{ ...text.section, color: color.teal, margin: '0 0 18px', fontSize: 22 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) 150px minmax(0,1fr)', gap: 20 }}>
        <Msg k="briefing.col_observation" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
        <Msg k="briefing.col_scope" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
        <Msg k="briefing.col_artefact" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
        {fixture.duplicate.map((r, i) => (
          <Content key={i} as="div" style={{ display: 'contents' }}>
            <Content as="div" style={{ ...text.message, color: color.ink, borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>{r.observation}</Content>
            <Content as="div" style={{ ...text.monoMeta, color: color.muted, borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>{r.scope}</Content>
            <Content as="div" style={{ ...text.message, color: color.ink, borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>{r.artefact}</Content>
          </Content>
        ))}
      </div>

      <Msg k="briefing.estimate_note" locale={locale} as="p" style={{ ...text.explain, color: color.muted, ...hairlineSection }} />

      <div style={{ display: 'flex', gap: 28, ...hairlineSection }}>
        <Stat n={fixture.stats.requests} k="briefing.stat_requests" locale={locale} />
        <Stat n={fixture.stats.redacted} k="briefing.stat_redacted" locale={locale} />
        <Stat n={fixture.stats.blocked} k="briefing.stat_blocked" locale={locale} />
        <Stat n={fixture.stats.duplicate} k="briefing.stat_duplicate" locale={locale} />
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
