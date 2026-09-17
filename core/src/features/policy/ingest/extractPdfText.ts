export class EmptyPolicyError extends Error {
  constructor() {
    super('PDF extraction yielded no text — an image-only or corrupt PDF is not a silent empty policy')
    this.name = 'EmptyPolicyError'
  }
}

// SF-2012 — extract text from a simple text PDF (parenthesised strings in Tj/TJ
// content-stream operators). No OCR in v1: an image-only or corrupt PDF → EmptyPolicyError.
// NOTE (build decision): this is a minimal deterministic extractor sufficient for the
// SF contract + tests; production should swap in a pinned PDF lib (e.g. pdfjs-dist)
// behind this same signature — the SF is the isolated swap point. See SESSION-LOG.
export function extractPdfText(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes)
  if (!raw.startsWith('%PDF-')) throw new EmptyPolicyError()

  const parts: string[] = []
  const re = /\(((?:[^()\\]|\\.)*)\)\s*Tj|\[((?:[^\]])*)\]\s*TJ/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    if (m[1] !== undefined) {
      parts.push(unescapePdf(m[1]))
    } else if (m[2] !== undefined) {
      for (const s of m[2].matchAll(/\(((?:[^()\\]|\\.)*)\)/g)) parts.push(unescapePdf(s[1] ?? ''))
    }
  }
  const text = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (text.length === 0) throw new EmptyPolicyError()
  return text
}

function unescapePdf(s: string): string {
  return s.replace(/\\([()\\nrt])/g, (_, c: string) => {
    switch (c) {
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      default:
        return c
    }
  })
}
