import type { WireMessage, WireView } from '../types'

// SF-5041 — the provider view: exactly the wire transcript (placeholders, including as
// history — NG-1). It is literally what left the building; it contains no original value.
export function buildWireTranscriptView(wire: WireMessage[]): WireView {
  return {
    turns: wire.map((m) => ({ role: m.role, content: m.content })),
    footerKey: 'reply.wire_footer',
    containsOriginal: false,
  }
}
