import type { JSX } from 'react'
import type { Locale } from '../types'
import { Msg } from '../i18n'
import { color, radius, text } from '../design'
import { motion } from '../design/motionTokens'

// SF-5016 — the header area-menu button (Handoff rule 1 / §1.3). It relabels itself —
// "{n} Bereiche geschützt" → "{n} Bereiche berührt" → "Nur Regeln aktiv" — instead of
// holding a list open. Amber when touched or rules-only; quiet otherwise. Text changes
// hard, colour/border over 200ms (§2 areaMenuRelabel). No green, no checkmarks.
export interface AreaMenuButtonProps {
  labelKey: string
  n: number
  locale: Locale
}

export function AreaMenuButton({ labelKey, n, locale }: AreaMenuButtonProps): JSX.Element {
  const accent = labelKey === 'header.areas_protected' ? color.muted : color.amber
  const border = labelKey === 'header.areas_protected' ? color.line : color.touchedBorder
  return (
    <button
      type="button"
      data-testid="area-menu-button"
      style={{
        background: 'transparent',
        border: `1px solid ${border}`,
        borderRadius: radius.headerButton,
        padding: '6px 12px',
        color: accent,
        cursor: 'pointer',
        transition: `color ${motion.areaMenuRelabel.ms}ms ${motion.areaMenuRelabel.curve}, border-color ${motion.areaMenuRelabel.ms}ms ${motion.areaMenuRelabel.curve}`,
        ...text.capsLabel,
      }}
    >
      <Msg k={labelKey} locale={locale} p={{ n }} />
    </button>
  )
}
