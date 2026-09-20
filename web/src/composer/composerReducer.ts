import type { ComposerEvent, ComposerState } from '../types'

// SF-5011 — the §1.1 state machine (base lifecycle). The `degraded` overlay applies on
// top of any state and is tracked separately (deriveComposerView surfaces it), matching
// the Handoff "Overlay auf alle". `locked` holds until E2 areas are confirmed (NG-3).
export function composerReducer(state: ComposerState, ev: ComposerEvent): ComposerState {
  if (ev.type === 'areas-unconfirmed') return 'locked'
  if (state === 'locked') return ev.type === 'areas-confirmed' ? 'idle' : 'locked'

  switch (ev.type) {
    case 'edit':
      // any keystroke returns to typing (aborts an in-flight inspection — §1.1)
      return 'typing'
    case 'pause':
    case 'submit':
      return state === 'typing' || state === 'idle' || state === 'clean' ? 'inspecting' : state
    case 'verdict':
      if (state !== 'inspecting') return state
      return ev.verdict === 'clean' ? 'clean' : ev.verdict === 'redact' ? 'touched' : 'blocked'
    case 'report':
      return state === 'touched' || state === 'blocked' ? 'report' : state
    case 'report-done':
      return state === 'report' ? 'report-done' : state
    case 'areas-confirmed':
      return state // already unlocked
    default:
      return state
  }
}
