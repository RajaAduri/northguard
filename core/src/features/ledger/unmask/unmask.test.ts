import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildUnmaskRequest } from './buildUnmaskRequest'
import { verifyDualAuthorisation, DualAuthorisationError } from './verifyDualAuthorisation'
import { resolveActorIdentity, UnresolvedActorError } from './resolveActorIdentity'
import { unmaskActor } from './unmaskActor'
import { deriveActorPseudonym } from '../request/deriveActorPseudonym'
import { setLedgerPath } from '../append'
import type { Authorisation, KeyMaterial, RoleBinding, UnmaskContext } from '../../../../lib/types'

const key: KeyMaterial = { secret: 'customer-secret', keyEpoch: 1 }
const roleBinding: RoleBinding = { itSecurityRole: 'it-security', worksCouncilRole: 'works-council' }
const target = deriveActorPseudonym('anna.berger', key).actorPseudonym
const directory = { listUserIds: () => ['hans.mueller', 'anna.berger', 'eva.klein'] }
const ctx: UnmaskContext = { key, roleBinding, directory }
const validPair: Authorisation[] = [
  { party: 'S. Weber', role: 'it-security' },
  { party: 'R. Vogt', role: 'works-council' },
]

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-unmask-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4081 buildUnmaskRequest', () => {
  it('empty reason throws; non-pseudonym target throws', () => {
    expect(() => buildUnmaskRequest(target, '')).toThrow()
    expect(() => buildUnmaskRequest('anna.berger', 'audit')).toThrow()
    expect(buildUnmaskRequest(target, 'Verdacht auf Leak')).toMatchObject({ targetPseudonym: target })
  })
})

describe('SF-4082 verifyDualAuthorisation (NG-20)', () => {
  it('rejects a single authoriser', () => {
    expect(() => verifyDualAuthorisation([validPair[0]!], roleBinding)).toThrow(DualAuthorisationError)
  })
  it('rejects two authorisers in the same role', () => {
    expect(() =>
      verifyDualAuthorisation([{ party: 'A', role: 'it-security' }, { party: 'B', role: 'it-security' }], roleBinding),
    ).toThrow(DualAuthorisationError)
  })
  it('accepts a valid IT-security + works-council pair', () => {
    expect(verifyDualAuthorisation(validPair, roleBinding)).toHaveLength(2)
  })
})

describe('SF-4083 resolveActorIdentity', () => {
  it('matches the pseudonym in the directory; no match → UnresolvedActorError', () => {
    expect(resolveActorIdentity(target, key, directory)).toBe('anna.berger')
    expect(() => resolveActorIdentity('f'.repeat(64), key, directory)).toThrow(UnresolvedActorError)
  })
})

describe('SF-4085 unmaskActor (NG-20 end-to-end)', () => {
  it('a valid pair returns the identity AND writes a govKind:unmask entry naming both parties + reason', async () => {
    const req = buildUnmaskRequest(target, 'Verdacht auf Datenabfluss')
    const { identity, ledgerEntryId } = await unmaskActor(req, validPair, ctx)
    expect(identity).toBe('anna.berger')
    expect(ledgerEntryId).toBeTruthy()
    const entry = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(entry.govKind).toBe('unmask')
    expect(entry.unmaskTarget).toBe(target)
    expect(entry.unmaskAuthorisers).toEqual(validPair)
    expect(entry.reason).toBe('Verdacht auf Datenabfluss')
    // the recovered identity is NEVER written to the ledger, and no plaintext user id
    expect(readFileSync(path, 'utf8')).not.toContain('anna.berger')
  })

  it('a single authoriser is rejected and NOTHING is written (no off-ledger attempt)', async () => {
    const req = buildUnmaskRequest(target, 'audit')
    await expect(unmaskActor(req, [validPair[0]!], ctx)).rejects.toThrow(DualAuthorisationError)
    expect(existsSync(path)).toBe(false)
  })
})
