// AF-610 — the Änderungsantrag (change request). The only path from one baseline to the
// next (NG-22). Self-approval is allowed by default and recorded; four-eyes is a tenant
// setting; a self-approval is refused in the request's own session (separated in time).
export { openChangeRequest } from './openChangeRequest'
export { approveChangeRequest } from './approveChangeRequest'
