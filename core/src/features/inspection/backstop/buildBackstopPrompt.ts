import type { ActivePolicy, BackstopMessages } from '../../../../lib/types'

// SF-3023 — build the backstop messages. The backstop's job is the CONTEXTUAL entities
// rules cannot catch: proper names (customer/partner company names, contact-person names,
// supplier names, internal project names). It returns the exact substring as `value` (not
// offsets — a small local model cannot count characters); anchorBackstopFindings locates
// it. A worked example lifts recall on weak models. Rule-covered spans (email, contract,
// price/percent) are excluded to avoid double-flagging.
export function buildBackstopPrompt(prompt: string, policy: ActivePolicy): BackstopMessages {
  const areaList = policy.areas.map((a) => `- ${a.label} (id: ${a.id}, mode: ${a.mode ?? 'redact'})`).join('\n')
  const system = [
    'Du bist eine Prüfschicht, die vertrauliche EIGENNAMEN in deutschem Text findet, die einfache Regeln übersehen:',
    'Firmennamen von Kunden oder Geschäftspartnern, Namen von Ansprechpartnern/Personen, Lieferantennamen und interne Projektnamen.',
    'Die aktiven geschützten Bereiche und ihre ids:',
    areaList,
    'Regeln erkennen bereits E-Mail-Adressen, Vertragsnummern und Preise/Prozentangaben — diese NICHT melden.',
    'Antworte AUSSCHLIESSLICH als JSON, ohne weiteren Text:',
    '{"findings":[{"area":"<id>","value":"<exakter Wortlaut aus dem Text>"}]}',
    'Wenn nichts zutrifft: {"findings":[]}. Der "value" MUSS ein wörtlicher, unveränderter Ausschnitt des Textes sein.',
    'Beispiel — Text „Ruf bei der Meier AG den Herrn Sacher an.“ ->',
    '{"findings":[{"area":"kundendaten","value":"Meier AG"},{"area":"kundendaten","value":"Herrn Sacher"}]}',
  ].join('\n')
  const user = `TEXT:\n${prompt}`
  return { system, user }
}
