import type { CSSProperties } from 'react'
import { color } from './colorTokens'
import { font } from './typeScale'
import { radius } from './radii'

// SF-5067 — reusable style objects built from §4 tokens only. Components compose these so
// no raw hex / non-token font / non-token radius reaches the DOM (the token-fidelity gate
// scans every rendered element's inline style). §4 register rule: system text = Mono,
// human text = Inter Tight, titles + management = Fraunces.

// ── Text roles (family · size · line-height · weight · tracking) ────────────────
export const text = {
  prompt: { fontFamily: font.ui, fontSize: 15, lineHeight: 1.55 } as CSSProperties,
  reply: { fontFamily: font.ui, fontSize: 14.5, lineHeight: 1.7 } as CSSProperties,
  message: { fontFamily: font.ui, fontSize: 14.5, lineHeight: 1.6 } as CSSProperties,
  explain: { fontFamily: font.ui, fontSize: 12.5, lineHeight: 1.55 } as CSSProperties,
  footnote: { fontFamily: font.ui, fontSize: 11, lineHeight: 1.4 } as CSSProperties,
  headerTitle: { fontFamily: font.ui, fontSize: 14, fontWeight: 600 } as CSSProperties,
  // System register — JetBrains Mono.
  monoStatus: { fontFamily: font.mono, fontSize: 11.5 } as CSSProperties,
  monoWire: { fontFamily: font.mono, fontSize: 13, lineHeight: 1.9 } as CSSProperties,
  monoMeta: { fontFamily: font.mono, fontSize: 11 } as CSSProperties,
  monoAttribution: { fontFamily: font.mono, fontSize: 11, lineHeight: 1.4 } as CSSProperties,
  monoSubhead: { fontFamily: font.mono, fontSize: 10.5 } as CSSProperties,
  capsLabel: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as CSSProperties,
  chip: { fontFamily: font.mono, fontSize: 12.5, fontWeight: 500 } as CSSProperties,
  // Title register — Fraunces.
  brief: { fontFamily: font.serif, fontSize: 34, fontWeight: 400, letterSpacing: -0.6 } as CSSProperties,
  section: { fontFamily: font.serif, fontSize: 22, fontWeight: 400 } as CSSProperties,
  empty: { fontFamily: font.serif, fontSize: 27, fontWeight: 400, letterSpacing: -0.3 } as CSSProperties,
} as const

// ── Buttons (§4 Knöpfe) ─────────────────────────────────────────────────────────
export type SendTone = 'teal' | 'amber' | 'disabled'

export function sendButton(tone: SendTone): CSSProperties {
  const bg = tone === 'teal' ? color.teal : tone === 'amber' ? color.amber : color.line
  return {
    background: bg,
    color: tone === 'disabled' ? color.muted : color.bgSurface, // ink-dark #0B1220
    border: 'none',
    borderRadius: radius.button,
    padding: '9px 18px',
    fontFamily: font.ui,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: tone === 'disabled' ? 'not-allowed' : 'pointer',
  }
}

export const secondaryButton: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${color.lineStrong}`,
  color: color.ink,
  borderRadius: radius.smallButton,
  padding: '8px 14px',
  fontFamily: font.ui,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: 'pointer',
}

export const tertiaryButton: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: color.muted,
  padding: '9px 8px',
  fontFamily: font.ui,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}

// A dotted-underline text link in a mono context (§4).
export const monoLink: CSSProperties = {
  color: color.muted,
  textDecoration: 'underline dotted',
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: font.mono,
  fontSize: 11,
}

// ── Surfaces ────────────────────────────────────────────────────────────────────
export const composerCardBorder = {
  muted: color.line,
  amber: color.touchedBorder,
  red: color.blockedBorder,
} as const

export function chip(): CSSProperties {
  return {
    ...text.chip,
    color: color.amber,
    background: color.amberChipBg,
    borderRadius: radius.chip,
    padding: '1px 6px',
  }
}
