import { describe, it, expect } from 'vitest'
import { redactBeforeWrite, RawTextInLedgerError } from './redactBeforeWrite'

describe('SF-4022 redactBeforeWrite', () => {
  it('1. an entry with no raw text passes (pseudonyms only)', () => {
    expect(() => redactBeforeWrite({ kind: 'request', spanPseudonyms: [] })).not.toThrow()
  })
  it('2. a populated raw-text field throws (full-text opt-in disabled by default)', () => {
    expect(() => redactBeforeWrite({ kind: 'request', promptText: 'the real prompt' } as never)).toThrow(RawTextInLedgerError)
  })
  it('3. with full-text opt-in enabled, it passes through', () => {
    expect(() => redactBeforeWrite({ promptText: 'x' } as never, { fullTextOptIn: true })).not.toThrow()
  })
})
