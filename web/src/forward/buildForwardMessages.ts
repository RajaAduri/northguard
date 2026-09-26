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
// F5 / NG-25 — the model's OWN blanks (for information it was not given) must use the same
// ⟨…⟩ vocabulary as NorthGuard's placeholders, never [square brackets], so the reply can label
// the two classes honestly instead of the user mistaking a model gap for something to restore.
const BLANKS =
  ' Wenn du an einer Stelle eine Angabe offen lassen musst, die du nicht kennst, markiere sie' +
  ' als Platzhalter in spitzen Klammern der Form ⟨…⟩ (zum Beispiel ⟨Empfängername⟩) —' +
  ' niemals in eckigen Klammern wie [Name].'
const PRESERVE =
  ' Vorhandene Platzhalter der Form ⟨…⟩ gibst du unverändert und an derselben Stelle wieder' +
  ' und rätst ihren Inhalt nicht.'

const PLACEHOLDER = /⟨[^⟩]*⟩/

export function buildForwardMessages(wire: WireMessage[]): { role: WireMessage['role']; content: string }[] {
  const hasPlaceholders = wire.some((m) => PLACEHOLDER.test(m.content))
  const system = BASE + MISSING_DOC + BLANKS + (hasPlaceholders ? PRESERVE : '')
  return [{ role: 'system', content: system }, ...wire.map((m) => ({ role: m.role, content: m.content }))]
}
