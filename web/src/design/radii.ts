// SF-5065 — Handoff §4 radius scale. Every rounded surface takes its radius from here;
// no invented radii (the token-fidelity gate asserts against RADII_ALLOWED).
export const radius = {
  composer: 14,
  bubble: 14,
  card: 12,
  popover: 12,
  mirror: 10,
  info: 10,
  button: 9,
  smallButton: 8,
  headerButton: 8,
  row: 8,
  tab: 6,
  menuRow: 6,
  chip: 5,
} as const

export const RADII_ALLOWED = [5, 6, 8, 9, 10, 12, 14] as const
