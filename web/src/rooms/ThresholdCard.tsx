import type { JSX } from 'react'
import type { Locale } from '../types'
import { Msg } from '../i18n'
import { color, radius, text, sendButton } from '../design'
import type { ThresholdFixture } from './managementFixtures'

// SF-5097 — the threshold between the two rooms (Handoff rule 15 / §2 threshold): a named,
// dated step onto the management document. It states the structural, no-names aggregation
// (NG-13) before the person crosses. Document register: Fraunces headline, quiet colour.
export interface ThresholdCardProps {
  fixture: ThresholdFixture
  locale: Locale
}

export function ThresholdCard({ fixture, locale }: ThresholdCardProps): JSX.Element {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 40px', textAlign: 'center' }}>
      <Msg k="threshold.kicker" locale={locale} p={{ kw: fixture.kw }} style={{ ...text.capsLabel, color: color.teal }} />
      <Msg k="threshold.headline" locale={locale} as="h1" style={{ ...text.empty, color: color.ink, margin: '16px 0' }} />
      <Msg k="threshold.body" locale={locale} p={{ n: fixture.people }} as="p" style={{ ...text.explain, color: color.muted, maxWidth: 520, margin: '0 auto 24px' }} />
      <button type="button" style={{ ...sendButton('teal'), borderRadius: radius.button }}>
        <Msg k="threshold.enter" locale={locale} />
      </button>
    </div>
  )
}
