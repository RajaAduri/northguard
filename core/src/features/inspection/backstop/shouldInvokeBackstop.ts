import type { ActivePolicy } from '../../../../lib/types'

// SF-3022 — the backstop is the detector for CONTEXTUAL entities (company/person names,
// project references) that rules and the lexicon cannot catch (§8 A4, model-first
// detection). It runs whenever the active policy protects at least one area — never
// gated on whether rules already hit, and never on prompt length. A prompt with a rule
// hit can still carry a model-only entity ("… an Klaus Meibert (klaus@x.de) …"), and a
// short prompt can be all name ("E-Mail an Klaus Meibert"). Any skip heuristic is a
// candidate for the next copy of the leak it caused, so there is none here; if one is
// ever needed it gets its own story and its own tests. (NG-24: whether it RAN then
// governs the coverage value — see runBackstop.)
export function shouldInvokeBackstop(policy: ActivePolicy): boolean {
  return policy.areas.length > 0
}
