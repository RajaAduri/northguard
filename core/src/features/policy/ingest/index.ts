// AF-201 — Policy ingest (US-001): raw text/PDF → normalized text + content hash.
import { acceptPolicyInput } from './acceptPolicyInput'
import { normalizePolicyText } from './normalizePolicyText'
import { computePolicyHash } from './computePolicyHash'

export { acceptPolicyInput, PolicyTooLargeError } from './acceptPolicyInput'
export { extractPdfText, EmptyPolicyError } from './extractPdfText'
export { normalizePolicyText } from './normalizePolicyText'
export { computePolicyHash } from './computePolicyHash'

export function ingestPolicyDocument(input: {
  raw: string | Uint8Array
  kind: 'text' | 'pdf'
}): { normalized: string; policyHash: string } {
  const { text } = acceptPolicyInput(input.raw, input.kind)
  const normalized = normalizePolicyText(text)
  return { normalized, policyHash: computePolicyHash(normalized) }
}
