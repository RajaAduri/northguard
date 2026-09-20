import type { Locale } from '../types'
import { de, en } from './catalogue'

// SF-5053 — resolve a key for a locale and interpolate {params}. A `{n}` count selects
// the `_one` variant when count === 1 and that variant exists (e.g. areas_touched_one).
export function formatMessage(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const cat = locale === 'en' ? en : de
  let resolvedKey = key
  const n = params?.['n']
  if (typeof n === 'number' && n === 1 && cat[`${key}_one`] !== undefined) resolvedKey = `${key}_one`
  const template = cat[resolvedKey]
  if (template === undefined) throw new Error(`missing i18n key: ${resolvedKey} (${locale})`)
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = params?.[name]
    if (v === undefined) throw new Error(`missing param {${name}} for ${resolvedKey}`)
    return String(v)
  })
}
