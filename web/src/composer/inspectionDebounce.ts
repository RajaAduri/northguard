// SF-5013 — the typing-pause debounce (600 ms; reset on each keystroke; immediate on
// submit; cancellable). Drives the typing→inspecting edge. The interval comes from the
// motion tokens (never hardcoded).
export function inspectionDebounce(
  onInspect: () => void,
  ms: number,
): { onKeystroke(): void; onSubmit(): void; cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const clear = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }
  return {
    onKeystroke() {
      clear()
      timer = setTimeout(() => {
        timer = null
        onInspect()
      }, ms)
    },
    onSubmit() {
      clear()
      onInspect() // fire immediately, no wait
    },
    cancel() {
      clear()
    },
  }
}
