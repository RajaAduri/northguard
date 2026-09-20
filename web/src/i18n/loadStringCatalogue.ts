import { de, en, type Catalogue } from './catalogue'

export class CatalogueParityError extends Error {
  constructor(missing: string[]) {
    super(`NG-16: DE/EN catalogue parity broken — missing: ${missing.join(', ')}`)
    this.name = 'CatalogueParityError'
  }
}

// SF-5051 — load DE + EN once. Every key must exist in both (NG-16); a missing key
// fails fast (no silent fallback). German is the default locale.
export function loadStringCatalogue(): { de: Catalogue; en: Catalogue } {
  const deKeys = new Set(Object.keys(de))
  const enKeys = new Set(Object.keys(en))
  const missing = [
    ...[...deKeys].filter((k) => !enKeys.has(k)).map((k) => `en:${k}`),
    ...[...enKeys].filter((k) => !deKeys.has(k)).map((k) => `de:${k}`),
  ]
  if (missing.length > 0) throw new CatalogueParityError(missing)
  return { de, en }
}
