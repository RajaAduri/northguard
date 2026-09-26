import type { PlaceholderMapping } from '../types'

// SF-5035 (P1) — a weak local model sometimes invents ⟨…⟩ tokens for things it does not
// know, even on a clean prompt. NG-9 correctly refuses to substitute a token with no
// mapping, so those tokens would otherwise sit in the reply and make it read as broken.
// This removes ONLY the unmapped tokens from the DISPLAYED reply and tidies the whitespace
// they leave behind. It is display-only: it never touches the wire transcript and never
// changes what the ledger recorded. Mapped placeholders are left for rehydration (NG-9).
export function stripUnmappedPlaceholders(text: string, mapping: PlaceholderMapping): string {
  const stripped = text.replace(/⟨[^⟩]*⟩/g, (token) => (token in mapping ? token : ''))
  return stripped
    .replace(/[ \t]{2,}/g, ' ') // collapse the gap a removed token leaves
    .replace(/[ \t]+([,.;:!?])/g, '$1') // no space before punctuation
    .replace(/[ \t]+$/gm, '')
    .trim()
}
