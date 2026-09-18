// AF-306 — Wire transcript & the two-transcript invariant (US-011). Pure (NG-14).
// The wire transcript is the only content ever transmitted upstream (NG-1).
export { composeWireMessage } from './composeWireMessage'
export { assertWireIsolation, WireLeakError } from './assertWireIsolation'
