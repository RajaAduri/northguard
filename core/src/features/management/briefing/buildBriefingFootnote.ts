import type { BriefingInputs, FootnoteStats } from '../../../../lib/types'

// SF-6025 — the footnote stats (numbers are footnote, not headline). Zero-blocked is
// shown as 0, never hidden.
export function buildBriefingFootnote(inp: BriefingInputs): FootnoteStats {
  return { ...inp.stats }
}
