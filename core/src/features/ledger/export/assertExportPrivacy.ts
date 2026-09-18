export class ExportPrivacyError extends Error {
  constructor(reason: string) {
    super(`export privacy violation: ${reason}`)
    this.name = 'ExportPrivacyError'
  }
}

// Key material / preimage fields that must never appear in an export (FR-23/NG-17),
// and plaintext user-id fields that must never appear (NG-19).
const FORBIDDEN = /"(secret|customerKey|keyMaterial|privateKey|user|userId|username|user_id|email|promptText|responseText|rawPrompt|rawResponse)"\s*:/i

// SF-4056 — the privacy gate, run before the bundle is emitted. Asserts: entity tokens
// are pseudonyms not names (FR-25/R8 — spanPseudonyms carry 64-hex tokens); no key
// material or preimage (FR-23/NG-17); no plaintext user id (NG-19).
export function assertExportPrivacy(csv: string, jsonl: string): void {
  const blob = `${csv}\n${jsonl}`
  const m = FORBIDDEN.exec(blob)
  if (m) throw new ExportPrivacyError(`forbidden field "${m[1]}" present`)

  // FR-25: any spanPseudonyms present must be pseudonym-shaped (hex), never a raw name.
  for (const line of jsonl.split('\n')) {
    if (line.length === 0) continue
    let entry: { spanPseudonyms?: { pseudonym?: unknown }[] }
    try {
      entry = JSON.parse(line) as typeof entry
    } catch {
      continue
    }
    for (const sp of entry.spanPseudonyms ?? []) {
      if (typeof sp.pseudonym !== 'string' || !/^[0-9a-f]{64}$/.test(sp.pseudonym)) {
        throw new ExportPrivacyError('a span token is not a pseudonym (FR-25)')
      }
    }
  }
}
