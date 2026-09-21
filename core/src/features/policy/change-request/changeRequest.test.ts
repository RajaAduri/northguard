import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { openChangeRequest } from './openChangeRequest'
import { approveChangeRequest } from './approveChangeRequest'
import { setLedgerPath } from '../../ledger/append'
import { getActiveBaseline, resetBaselines } from '../baseline'
import type { Area, KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
const areas: Area[] = [{ id: 'preise-margen', label: 'Preise & Margen', mode: 'block' }]
let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-cr-'))
  setLedgerPath(join(dir, 'ledger.jsonl'))
  resetBaselines()
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-2101 openChangeRequest', () => {
  it('opens an Änderungsantrag with a rationale and stamps the requesting session', async () => {
    const cr = await openChangeRequest(areas, 'anna.berger', 'sess-1', 'neuer Bereich', key)
    expect(cr.status).toBe('open')
    expect(cr.requestSession).toBe('sess-1')
    expect(cr.id).toMatch(/^CR-/)
  })
  it('an empty rationale throws (NG-12)', async () => {
    await expect(openChangeRequest(areas, 'anna.berger', 'sess-1', '  ', key)).rejects.toThrow()
  })
})

describe('SF-2102 approveChangeRequest (Amendment B self-approval decision)', () => {
  it('a different approver in the same session cuts the new baseline', async () => {
    const cr = await openChangeRequest(areas, 'anna.berger', 'sess-1', 'neuer Bereich', key)
    const b = await approveChangeRequest(cr, 'tom.klein', 'sess-1', key)
    expect(b.changeRequestId).toBe(cr.id)
    expect(b.selfApproved).toBeUndefined()
    expect(getActiveBaseline()?.version).toBe(b.version)
  })

  it('same person requester + approver is ALLOWED by default, in a later session, and is recorded', async () => {
    const cr = await openChangeRequest(areas, 'anna.berger', 'sess-1', 'neuer Bereich', key)
    const b = await approveChangeRequest(cr, 'anna.berger', 'sess-2', key)
    expect(b.selfApproved).toBe(true)
    expect(b.approvalNote).toBe('beantragt und freigegeben von derselben Person')
  })

  it('a self-approval in the SAME session as the request is REJECTED (separated in time)', async () => {
    const cr = await openChangeRequest(areas, 'anna.berger', 'sess-1', 'neuer Bereich', key)
    await expect(approveChangeRequest(cr, 'anna.berger', 'sess-1', key)).rejects.toThrow(/derselben Sitzung/)
    expect(cr.status).toBe('open')
    expect(getActiveBaseline()).toBeNull()
  })

  it('with four-eyes on, self-approval is refused even across sessions', async () => {
    const cr = await openChangeRequest(areas, 'anna.berger', 'sess-1', 'neuer Bereich', key)
    await expect(approveChangeRequest(cr, 'anna.berger', 'sess-9', key, { fourEyes: true })).rejects.toThrow(/Vier-Augen/)
  })

  it('an already-approved request cannot be approved again', async () => {
    const cr = await openChangeRequest(areas, 'anna.berger', 'sess-1', 'neuer Bereich', key)
    await approveChangeRequest(cr, 'tom.klein', 'sess-1', key)
    await expect(approveChangeRequest(cr, 'tom.klein', 'sess-1', key)).rejects.toThrow()
  })
})
