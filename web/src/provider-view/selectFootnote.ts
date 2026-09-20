// SF-5042 — the state-dependent composer footnote (Handoff §1.4).
export function selectFootnote(ctx: { view: 'own' | 'provider'; hasRestored: boolean }): string {
  if (ctx.view === 'provider') return 'footnote.provider_view'
  return ctx.hasRestored ? 'footnote.restored' : 'footnote.default'
}
