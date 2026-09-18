const HEALTH_URL = process.env.NORTHGUARD_BACKSTOP_HEALTH_URL ?? 'http://127.0.0.1:8078/health'
const TIMEOUT_MS = 400

// SF-3021 — is the local backstop reachable? Never throws; a failure or timeout is a
// clean `false` so the caller can degrade to rules-only (NG-4).
export async function backstopAvailabilityGuard(): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(HEALTH_URL, { signal: ctrl.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
