import { describe, it, expect } from 'vitest'
import { assertNoPlaintextActor, PlaintextActorError } from './assertNoPlaintextActor'

describe('SF-4015 assertNoPlaintextActor (NG-19)', () => {
  it('1. an entry with only actorPseudonym (+actorEpoch) passes', () => {
    expect(() =>
      assertNoPlaintextActor({ kind: 'request', actorPseudonym: 'ab12', actorEpoch: 1 }),
    ).not.toThrow()
  })

  it('2. a plaintext `user` field throws PlaintextActorError', () => {
    expect(() => assertNoPlaintextActor({ kind: 'request', user: 'anna.berger' } as never)).toThrow(
      PlaintextActorError,
    )
  })

  it('2b. any userId-shaped key throws (userId / username / user_id / email)', () => {
    for (const bad of ['userId', 'username', 'user_id', 'userName', 'email']) {
      expect(() => assertNoPlaintextActor({ [bad]: 'x' } as never)).toThrow(PlaintextActorError)
    }
  })

  it('3. a governance entry follows the same rule (acting party is a pseudonym)', () => {
    expect(() =>
      assertNoPlaintextActor({ kind: 'governance', govKind: 'export', actorPseudonym: 'c3', actorEpoch: 1 }),
    ).not.toThrow()
    expect(() =>
      assertNoPlaintextActor({ kind: 'governance', govKind: 'export', user: 'lead' } as never),
    ).toThrow(PlaintextActorError)
  })
})
