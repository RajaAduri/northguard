// SF-5061 — the Handoff §2 timing table as typed tokens. The prototype timings ARE the
// spec; every animation reads its duration + curve from here, never hardcodes them.
export interface MotionToken {
  ms: number
  curve: 'linear' | 'ease-out' | 'ease-in-out' | 'none'
}

export const motion = {
  typingPause: { ms: 600, curve: 'none' }, // debounce before inspection
  inspectionSweepTarget: { ms: 800, curve: 'linear' }, // sweep period target
  inspectionSweepMin: { ms: 400, curve: 'linear' }, // minimum so the line is legible
  mirrorToggle: { ms: 240, curve: 'ease-out' }, // grid-rows 0fr↔1fr
  composerBorder: { ms: 200, curve: 'linear' },
  sendButton: { ms: 160, curve: 'linear' },
  areaMenuRelabel: { ms: 200, curve: 'linear' },
  popover: { ms: 150, curve: 'ease-out' }, // 140–160ms
  userBubble: { ms: 160, curve: 'ease-out' },
  replyFade: { ms: 180, curve: 'ease-out' },
  restore: { ms: 180, curve: 'ease-out' }, // +400ms delay after arrival, then 180ms fade/value
  restoreDelay: { ms: 400, curve: 'none' },
  viewToggle: { ms: 160, curve: 'linear' },
  copyHint: { ms: 3000, curve: 'none' },
  threshold: { ms: 320, curve: 'ease-in-out' }, // workspace ↔ management
} as const satisfies Record<string, MotionToken>
