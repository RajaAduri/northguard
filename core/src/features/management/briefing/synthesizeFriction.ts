import type { BriefingInputs } from '../../../../lib/types'

// SF-6023 — a short friction read over the deterministic inputs. Thin data returns the
// insufficient-traffic message; a cessation cadence is noted ("likely solved").
export function synthesizeFriction(inp: BriefingInputs): string {
  if (!inp.sufficient) return 'Zu wenig Verkehr für ein Briefing.'
  const solved = inp.findings.find((f) => f.cadence?.includes('gelöst') || f.cadence?.includes('cessation'))
  if (solved) return `Ein wiederkehrendes Muster (${solved.theme}) ist seit Kurzem verstummt — vermutlich gelöst.`
  const topDuplicate = [...inp.findings].sort((a, b) => b.clusterSize - a.clusterSize)[0]
  if (topDuplicate && topDuplicate.clusterSize >= 3) {
    return `Wiederholte, nahezu gleiche Anfragen im Bereich ${topDuplicate.area} deuten auf vermeidbare Doppelarbeit hin.`
  }
  return 'Keine auffällige Reibung in dieser Woche.'
}
