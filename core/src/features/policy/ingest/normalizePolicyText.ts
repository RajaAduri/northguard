// SF-2013 — deterministic, idempotent normalisation. NFC (umlauts preserved),
// LF line endings, collapsed intra-line whitespace, at most one blank line, trimmed.
export function normalizePolicyText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
