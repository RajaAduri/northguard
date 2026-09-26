import type { ReactNode } from 'react'
import { color, radius, text } from '../design'
import { font } from '../design/typeScale'

// SF-5037 (F1) — render the reply's markdown as React elements (headings, bold, ordered and
// unordered lists, inline + fenced code). It is DISPLAY ONLY — it never touches the wire or
// the ledger — and it never uses dangerouslySetInnerHTML (no HTML injection). Two run-level
// classes stay visually distinct through the formatting: ⟨…⟩ placeholders (decor.chip) and
// rehydrated values (decor.restored, dotted underline), so a restored value is never mistaken
// for a model gap and vice versa (NG-25).
export interface MarkdownDecor {
  chip: (token: string, key: string) => ReactNode
  restored: (value: string, key: string) => ReactNode
  restoredValues: string[]
}

const CHIP = /⟨[^⟩]*⟩/
const codeStyle = { fontFamily: font.mono, fontSize: 12.5, background: color.bgRaised, borderRadius: radius.chip, padding: '1px 5px' } as const

let seq = 0
const k = (): string => `md${seq++}`

// Inline tokenizer: at each step take the EARLIEST of inline-code, bold, a ⟨…⟩ chip, or a
// restored value, emit it, and recurse on the rest. Order by position, not precedence, so a
// value inside bold still gets its underline.
function inline(t: string, decor: MarkdownDecor): ReactNode[] {
  if (!t) return []
  type Hit = { i: number; len: number; node: ReactNode }
  const hits: Hit[] = []
  let m: RegExpExecArray | null
  if ((m = /`([^`]+)`/.exec(t))) hits.push({ i: m.index, len: m[0].length, node: <code key={k()} style={codeStyle}>{m[1]}</code> })
  if ((m = /\*\*([^*]+)\*\*/.exec(t))) hits.push({ i: m.index, len: m[0].length, node: <strong key={k()}>{inline(m[1]!, decor)}</strong> })
  if ((m = CHIP.exec(t))) hits.push({ i: m.index, len: m[0].length, node: decor.chip(m[0], k()) })
  for (const v of decor.restoredValues) {
    if (!v) continue
    const i = t.indexOf(v)
    if (i >= 0) hits.push({ i, len: v.length, node: decor.restored(v, k()) })
  }
  if (hits.length === 0) return [t]
  const first = hits.reduce((a, b) => (b.i < a.i ? b : a))
  return [t.slice(0, first.i), first.node, ...inline(t.slice(first.i + first.len), decor)]
}

const STOP = /^(#{1,3}\s|```|\s*[-*]\s|\s*\d+\.\s)/

export function renderMarkdown(src: string, decor: MarkdownDecor): ReactNode {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  const hStyle = (lvl: number) => ({ ...text.reply, fontWeight: 600 as const, fontSize: lvl === 1 ? 18 : lvl === 2 ? 16 : 15, margin: '10px 0 4px' })

  while (i < lines.length) {
    const line = lines[i]!
    if (/^```/.test(line)) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i]!)) { buf.push(lines[i]!); i++ }
      i++
      blocks.push(<pre key={k()} style={{ ...codeStyle, display: 'block', padding: '8px 12px', margin: '8px 0', whiteSpace: 'pre-wrap', color: color.ink }}>{buf.join('\n')}</pre>)
      continue
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) { blocks.push(<div key={k()} style={hStyle(h[1]!.length)}>{inline(h[2]!, decor)}</div>); i++; continue }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) { items.push(lines[i]!.replace(/^\s*[-*]\s+/, '')); i++ }
      blocks.push(<ul key={k()} style={{ margin: '4px 0', paddingLeft: 22 }}>{items.map((it) => <li key={k()}>{inline(it, decor)}</li>)}</ul>)
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]!)) { items.push(lines[i]!.replace(/^\s*\d+\.\s+/, '')); i++ }
      blocks.push(<ol key={k()} style={{ margin: '4px 0', paddingLeft: 22 }}>{items.map((it) => <li key={k()}>{inline(it, decor)}</li>)}</ol>)
      continue
    }
    if (line.trim() === '') { i++; continue }
    const buf: string[] = []
    while (i < lines.length && lines[i]!.trim() !== '' && !STOP.test(lines[i]!)) { buf.push(lines[i]!); i++ }
    blocks.push(<p key={k()} style={{ margin: '4px 0' }}>{inline(buf.join(' '), decor)}</p>)
  }
  return <>{blocks}</>
}
