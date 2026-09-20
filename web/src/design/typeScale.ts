// SF-5063 — Handoff §4 type scale + the register rule: everything the SYSTEM says
// (status, counts, ledger, wire) is JetBrains Mono; everything HUMANS read (prompt,
// reply, explanation) is Inter Tight; Fraunces only for titles + the management view.
export const font = {
  serif: 'Fraunces, Georgia, serif',
  ui: '"Inter Tight", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const

export type TextRole = 'system' | 'human' | 'title'

export function fontFor(role: TextRole): string {
  switch (role) {
    case 'system':
      return font.mono // status / counts / ledger / wire
    case 'human':
      return font.ui // prompt / reply / explanation
    case 'title':
      return font.serif // titles + management view
  }
}
