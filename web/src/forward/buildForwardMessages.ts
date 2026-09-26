import type { WireMessage } from '../types'

// SF-5041 (P1) — build the messages forwarded to the provider stand-in. The old prompt
// ALWAYS told the model to preserve "Platzhalter … wie ⟨Preis⟩ oder ⟨Kundenname⟩", handing
// a weak 4B model the exact tokens it then invented on clean prompts (P1 contamination).
// Fix: (1) preserve placeholders that appear, never introduce new ones, with NO concrete
// example tokens to generalise from; (2) omit the placeholder instruction entirely when the
// wire carries no ⟨…⟩ at all. Only the wire ever leaves here (NG-1).
const BASE = 'Du bist ein hilfreicher Assistent. Antworte auf Deutsch.'
// F3 — never fabricate the content of a document/contract/email/file that is not in the
// conversation; say the content is missing and ask for it. A 7B needs this stated firmly.
const MISSING_DOC =
  ' Wenn du nach einem Dokument, einem Vertrag, einer E-Mail oder einer Datei gefragt wirst,' +
  ' deren Inhalt nicht ausdrücklich im Gespräch steht, sage in ein bis zwei Sätzen klar, dass dir' +
  ' der Inhalt fehlt, und bitte darum, ihn einzufügen. Erfinde niemals den Inhalt und beschreibe' +
  ' auch nicht, was ein solches Dokument üblicherweise enthält — das ist keine gültige Antwort.'
const PRESERVE =
  ' Einige Angaben im Text wurden durch Platzhalter in spitzen Klammern der Form ⟨…⟩ ersetzt.' +
  ' Gib jeden Platzhalter, der im Text vorkommt, unverändert und an derselben Stelle wieder.' +
  ' Führe keine neuen Platzhalter ein und rate ihren Inhalt nicht.'

const PLACEHOLDER = /⟨[^⟩]*⟩/

export function buildForwardMessages(wire: WireMessage[]): { role: WireMessage['role']; content: string }[] {
  const hasPlaceholders = wire.some((m) => PLACEHOLDER.test(m.content))
  const system = BASE + MISSING_DOC + (hasPlaceholders ? PRESERVE : '')
  return [{ role: 'system', content: system }, ...wire.map((m) => ({ role: m.role, content: m.content }))]
}
