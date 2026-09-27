import type { JSX } from 'react'
import type { Locale, TriggerGroup } from '../types'
import { ruleDisplayName } from '../mirror/ruleDisplayName'
import { Msg, Content } from '../i18n'
import { color, radius, text } from '../design'

// SF-6045 (F4) — the false-positive review queue in the management room (AF-604). Grouped by
// TRIGGER (layer + area + rule), never by reporter (NG-13); the reporter is a pseudonym.
export interface FpQueueViewProps {
  groups: TriggerGroup[]
  locale: Locale
}

export function FpQueueView({ groups, locale }: FpQueueViewProps): JSX.Element {
  return (
    <section data-testid="fp-queue">
      <Msg k="mgmt.nav.false_positives" locale={locale} as="h1" style={{ ...text.brief, color: color.ink, margin: '0 0 4px' }} />
      <Msg k="queue.grouping_note" locale={locale} as="p" style={{ ...text.explain, color: color.muted, margin: '0 0 18px' }} />
      {groups.length === 0 ? (
        <Msg k="queue.empty" locale={locale} as="p" style={{ ...text.explain, color: color.muted }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((g) => (
            <div key={g.key} data-trigger={g.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'baseline', borderTop: `1px solid ${color.line}`, padding: '13px 0' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
                <Content style={{ ...text.message, color: color.ink }}>{g.area}</Content>
                <Msg k={g.layer === 'rule' ? 'mirror.layer_rule' : 'mirror.layer_ai'} locale={locale} p={{ name: ruleDisplayName(g.ruleId, locale) }} style={{ ...text.monoMeta, color: color.muted }} />
              </div>
              <Msg k="queue.reports" locale={locale} p={{ n: g.count }} style={{ ...text.monoMeta, color: color.amber }} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
