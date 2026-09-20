// SF-5062 — Handoff §4 colour tokens. No green anywhere; no gradient except the
// inspection sweep line.
export const color = {
  bgCanvas: '#070b14',
  bgSurface: '#0B1220',
  bgRaised: '#141d2e',
  line: '#1e2a3f',
  lineStrong: '#2b3a52',
  ink: '#e8edf4',
  muted: '#8a97ab',
  teal: '#3FBFB0', // primary action, connection, confirmation
  amber: '#F5A623', // touched, redact, report
  red: '#e5657a', // blocked, outage
  amberChipBg: '#F5A62322',
  touchedBorder: '#F5A62344',
  blockedBorder: '#e5657a55',
  menuTouchedRow: '#F5A6231a',
} as const

// The only gradient permitted in the product is the inspection sweep (§4).
export const GRADIENTS_ALLOWED = ['inspection-sweep'] as const
