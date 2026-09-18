import type { FootnoteStats, PolicyFitNote, Theme } from '../../../../lib/types'

// SF-6026 — render the short letter (KW header + themes + friction + policy-fit +
// footnote). Deterministic → the same inputs render the same letter (a PDF export is
// the same content, FR-13). No themes → the quiet-week ("Betriebsruhe") variant.
export function renderBriefingMarkdown(
  header: { week: string; people: number },
  themes: Theme[],
  friction: string,
  fit: PolicyFitNote,
  foot: FootnoteStats,
): string {
  const lines: string[] = [`# Briefing · ${header.week} · ${header.people} Personen`, '']
  if (themes.length === 0) {
    lines.push('## Betriebsruhe', 'In dieser Woche keine erkennbare Wiederholung.', '')
  } else {
    lines.push('## Wiederkehrende Themen')
    for (const t of themes) {
      lines.push(`- **${t.title}** — ${t.signal}${t.artefact ? ` · Abhilfe: ${t.artefact}` : ''}`)
    }
    lines.push('')
  }
  lines.push('## Reibung', friction, '')
  lines.push('## Passt die Richtlinie zur Arbeit?', fit.verdict, '')
  lines.push(
    `_${foot.requests} Anfragen · ${foot.redactedForwarded} maskiert weitergeleitet · ${foot.blocked} blockiert · ${foot.rulesOnlyRequests} nur Regeln._`,
  )
  return lines.join('\n')
}
