import type { SidecarGraph } from '../../../../lib/types'

export class SidecarUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('kg-gen sidecar unreachable — intake fails loudly; nothing activates')
    this.name = 'SidecarUnavailableError'
    if (cause !== undefined) this.cause = cause
  }
}

const SIDECAR_URL =
  process.env.NORTHGUARD_SIDECAR_URL ?? 'http://127.0.0.1:8077/graph'

// SF-2021 — POST the policy to the localhost kg-gen sidecar. The only network I/O
// in intake; never on the inspection hot path (NG-6/NG-7). Unreachable → loud error.
export async function requestConceptGraph(
  policy: string,
  opts?: { force?: boolean },
): Promise<SidecarGraph> {
  let res: Response
  try {
    res = await fetch(SIDECAR_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ policy, force: opts?.force ?? false }),
    })
  } catch (err) {
    throw new SidecarUnavailableError(err)
  }
  if (!res.ok) throw new SidecarUnavailableError(`sidecar status ${res.status}`)
  return (await res.json()) as SidecarGraph
}
