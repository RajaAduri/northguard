import type { BackstopMessages } from '../../../../lib/types'

export class BackstopUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('backstop model call failed')
    this.name = 'BackstopUnavailableError'
    if (cause !== undefined) this.cause = cause
  }
}

const MODEL_URL = process.env.NORTHGUARD_BACKSTOP_URL ?? 'http://127.0.0.1:8078/inspect'
// Bound the model call so a slow/hung local model degrades to rules-only quickly (NG-4)
// instead of hanging the whole inspection. A 4B model that is swapping in Ollama can take
// well over a minute; the UI must not wait for it.
const TIMEOUT_MS = Number(process.env.NORTHGUARD_BACKSTOP_TIMEOUT_MS ?? 12000)

// SF-3024 — call the local backstop model deterministically (temperature 0). Any
// failure OR timeout throws BackstopUnavailableError (caught by the degrade path, NG-4).
export async function callBackstopModel(m: BackstopMessages): Promise<string> {
  let res: Response
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    res = await fetch(MODEL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system: m.system, user: m.user, temperature: 0 }),
      signal: ctrl.signal,
    })
  } catch (err) {
    throw new BackstopUnavailableError(err)
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) throw new BackstopUnavailableError(`status ${res.status}`)
  const data = (await res.json()) as { completion?: string }
  if (typeof data.completion !== 'string') throw new BackstopUnavailableError('no completion in response')
  return data.completion
}
