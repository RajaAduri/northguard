import type { BlockModel, InspectionVerdict } from '../types'

// SF-5022 — the blocked variant. No submission, no send. Detected spans are quoted with
// their layer; the ledger note reassures that only time/area/layer is recorded (not the
// text); the panel states there is NO per-prompt approval (Handoff rule 7).
export function buildBlockModel(v: InspectionVerdict): BlockModel {
  return {
    headerKey: 'block.title',
    areas: [...new Set(v.touchedAreas.map((a) => a.area))],
    detected: v.spans.map((s) => {
      const d: { value: string; layerLabelKey: string; ruleId?: string } = {
        value: s.placeholder,
        layerLabelKey: s.layer === 'rule' ? 'mirror.layer_rule' : 'mirror.layer_ai',
      }
      if (s.ruleId !== undefined) d.ruleId = s.ruleId
      return d
    }),
    ledgerNoteKey: 'block.ledger_note',
    noApprovalKey: 'block.no_approval',
  }
}
