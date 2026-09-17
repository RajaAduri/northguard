import { extractPdfText } from './extractPdfText'

export class PolicyTooLargeError extends Error {
  constructor() {
    super('Policy input exceeds the size cap')
    this.name = 'PolicyTooLargeError'
  }
}

const SIZE_CAP = 2_000_000 // chars (text) / bytes (pdf)

// SF-2011 — validate + branch on kind. Over the cap → PolicyTooLargeError.
export function acceptPolicyInput(raw: string | Uint8Array, kind: 'text' | 'pdf'): { text: string } {
  const size = typeof raw === 'string' ? raw.length : raw.byteLength
  if (size > SIZE_CAP) throw new PolicyTooLargeError()

  if (kind === 'pdf') {
    const bytes = typeof raw === 'string' ? new TextEncoder().encode(raw) : raw
    return { text: extractPdfText(bytes) }
  }
  const text = typeof raw === 'string' ? raw : new TextDecoder('utf-8').decode(raw)
  return { text }
}
