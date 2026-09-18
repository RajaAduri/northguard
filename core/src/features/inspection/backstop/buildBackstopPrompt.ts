import type { ActivePolicy, BackstopMessages } from '../../../../lib/types'

// SF-3023 — build the backstop messages. The system prompt lists the active areas
// and asks for touched areas + spans + a one-sentence reason, JSON only.
export function buildBackstopPrompt(prompt: string, policy: ActivePolicy): BackstopMessages {
  const areaList = policy.areas.map((a) => `- ${a.label} (id: ${a.id}, mode: ${a.mode ?? 'redact'})`).join('\n')
  const system = [
    'Du bist eine Prüfschicht für vertrauliche Inhalte. Prüfe den Text NUR auf die folgenden geschützten Bereiche:',
    areaList,
    '',
    'Antworte AUSSCHLIESSLICH als JSON: {"findings":[{"area":"<id>","offset":<int>,"length":<int>,"value":"<span>","reason":"<ein Satz>"}]}.',
    'Wenn nichts zutrifft: {"findings":[]}. Kein weiterer Text.',
  ].join('\n')
  const user = `TEXT:\n${prompt}`
  return { system, user }
}
