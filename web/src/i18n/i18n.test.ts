import { describe, it, expect } from 'vitest'
import { loadStringCatalogue } from './loadStringCatalogue'
import { resolveUiLocale } from './resolveUiLocale'
import { formatMessage } from './formatMessage'
import { resolveLanguageLevel } from './languageLevels'

describe('SF-5051 loadStringCatalogue', () => {
  it('DE + EN keys are at parity (NG-16)', () => {
    const { de, en } = loadStringCatalogue()
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort())
  })
})

describe('SF-5052 resolveUiLocale', () => {
  it('user preference wins; default is German', () => {
    expect(resolveUiLocale('en')).toBe('en')
    expect(resolveUiLocale(null)).toBe('de')
  })
})

describe('SF-5053 formatMessage', () => {
  it('interpolates params', () => {
    expect(formatMessage('header.areas_protected', 'de', { n: 6 })).toBe('6 Bereiche geschützt')
  })
  it('selects the _one variant on count 1', () => {
    expect(formatMessage('header.areas_touched', 'de', { n: 1 })).toBe('1 Bereich berührt')
    expect(formatMessage('header.areas_touched', 'de', { n: 3 })).toBe('3 Bereiche berührt')
  })
  it('throws on a missing key or missing param', () => {
    expect(() => formatMessage('nope.key', 'de')).toThrow()
    expect(() => formatMessage('header.areas_protected', 'de')).toThrow()
  })
})

describe('SF-5054 languageLevels', () => {
  it('ui→user, policy-name→policy, wire/evidence→tenant', () => {
    expect(resolveLanguageLevel('ui')).toBe('user')
    expect(resolveLanguageLevel('policy-name')).toBe('policy')
    expect(resolveLanguageLevel('wire-placeholder')).toBe('tenant')
    expect(resolveLanguageLevel('evidence')).toBe('tenant')
  })
})
