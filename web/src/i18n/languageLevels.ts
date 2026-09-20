export type LanguageSource = 'user' | 'policy' | 'tenant'

// SF-5054 — three language levels (Handoff rule 11): UI copy follows the person; area/
// rule names follow the policy document; wire placeholders + the evidence export follow
// the tenant (fixed at setup, logged, not per-export).
export function resolveLanguageLevel(kind: 'ui' | 'policy-name' | 'wire-placeholder' | 'evidence'): LanguageSource {
  switch (kind) {
    case 'ui':
      return 'user'
    case 'policy-name':
      return 'policy'
    case 'wire-placeholder':
    case 'evidence':
      return 'tenant'
  }
}
