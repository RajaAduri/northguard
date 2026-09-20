import type { MgmtShell, MgmtTab } from '../types'

// SF-5082 — the management document shell: a 720px Fraunces column with the review nav.
// There is no person column anywhere (NG-13), by construction.
export function buildManagementShell(activeTab: MgmtTab): MgmtShell {
  return {
    activeTab,
    navKeys: ['mgmt.nav.briefing', 'mgmt.nav.density', 'mgmt.nav.false_positives', 'mgmt.nav.ledger', 'mgmt.nav.evidence'],
    maxWidthPx: 720,
    typeface: 'Fraunces, Georgia, serif',
    hasPersonColumn: false,
  }
}
