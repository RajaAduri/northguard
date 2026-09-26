import { useState, type JSX } from 'react'
import type { Locale, PlaceholderMapping, RehydrateResult } from '../types'
import { buildReplyView } from './buildReplyView'
import { buildCopyModel } from './buildCopyModel'
import { buildRestoreSuggestion } from './buildRestoreSuggestion'
import { renderMarkdown } from './renderMarkdown'
import { Msg, Content, formatMessage } from '../i18n'
import { color, radius, text, chip, monoLink } from '../design'
import { font } from '../design/typeScale'
import { motion } from '../design/motionTokens'

// SF-5034 — the locally-restored reply (Handoff §1.2). full = every value restored; partial
// = some placeholders unresolved — they STAY VISIBLE as amber chips with an explicit
// insert/leave choice, never guessed (NG-9); not-rendered = the provider paraphrased so
// nothing could be restored. Restored content is display-only and never re-enters the wire
// (NG-1). "Was der Anbieter sah" reveals the wire reply; copy warns it holds real data.
export interface ReplyMessageProps {
  result: RehydrateResult
  locale: Locale
  providerText?: string // the wire reply (placeholders) — for "Was der Anbieter sah"
  mapping?: PlaceholderMapping // session values, for the restore suggestion (never auto-applied)
}

export function ReplyMessage({ result, locale, providerText, mapping = {} }: ReplyMessageProps): JSX.Element {
  const view = buildReplyView(result)
  const copy = buildCopyModel(result.restoredSpans)
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [dismissed, setDismissed] = useState<Record<string, true>>({})
  const [showProvider, setShowProvider] = useState(false)
  const [copied, setCopied] = useState(false)

  let displayText = result.restoredText
  for (const [ph, val] of Object.entries(applied)) displayText = displayText.split(ph).join(val)
  const openNow = result.unresolved.filter((u) => !(u in applied))
  // NG-25 — two classes of open ⟨…⟩: masked (in the mapping → NorthGuard removed it, a value
  // exists to offer) vs model gap (not in the mapping → the model left it open for info it
  // wasn't given; NorthGuard has nothing to offer and asks nothing of the user).
  const maskedOpen = openNow.filter((u) => u in mapping)
  const modelOpen = openNow.filter((u) => !(u in mapping))
  const modelChip = { ...text.chip, color: color.muted, background: color.bgRaised, border: `1px dashed ${color.lineStrong}`, borderRadius: radius.chip, padding: '1px 6px' }

  // F1 — render markdown, keeping run-level classes distinct: masked ⟨…⟩ as amber chips,
  // model-gap ⟨…⟩ as muted dashed chips, rehydrated values with a dotted underline (§1.2).
  // Longest values first so a value that contains another is matched whole.
  const restoredValues = [...result.restoredSpans.map((s) => s.original), ...Object.values(applied)].sort((a, b) => b.length - a.length)
  const decor = {
    restoredValues,
    chip: (token: string, key: string) =>
      token in mapping
        ? <span key={key} style={chip()} title={formatMessage('reply.label_masked', locale)}>{token}</span>
        : <span key={key} style={modelChip} title={formatMessage('reply.label_model', locale)}>{token}</span>,
    restored: (value: string, key: string) => <span key={key} style={{ textDecoration: 'underline dotted', textUnderlineOffset: 2, color: color.ink, fontFamily: font.ui }}>{value}</span>,
  }

  function onCopy() {
    try {
      void navigator.clipboard?.writeText(displayText)
    } catch {
      /* clipboard unavailable — the hint still shows */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), motion.copyHint.ms)
  }

  return (
    <article data-testid="reply" data-mode={view.mode} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 12 }}>
      <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: radius.chip, border: `1px solid ${color.teal}` }} />
      <div>
        <Content data-testid="reply-text" as="div" style={{ ...text.reply, color: color.ink }}>
          {renderMarkdown(displayText, decor)}
        </Content>

        {showProvider && providerText ? (
          <Content as="div" style={{ ...text.monoWire, color: color.muted, background: color.bgRaised, border: `1px solid ${color.line}`, borderRadius: radius.info, padding: '8px 12px', margin: '8px 0' }}>
            {providerText}
          </Content>
        ) : null}

        <div data-testid="reply-footer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6, ...text.monoMeta, color: color.muted }}>
          <Msg k={view.footerKey} locale={locale} p={{ n: view.restoredCount + view.openCount, k: view.restoredCount }} />
          {maskedOpen.length > 0 ? (
            <>
              <span>·</span>
              <Msg k="reply.open_masked" locale={locale} p={{ n: maskedOpen.length }} style={{ color: color.amber }} />
            </>
          ) : null}
          {modelOpen.length > 0 ? (
            <>
              <span>·</span>
              <Msg k="reply.open_model" locale={locale} p={{ n: modelOpen.length }} style={{ color: color.muted }} />
            </>
          ) : null}
          {providerText ? (
            <>
              <span>·</span>
              <button type="button" style={monoLink} onClick={() => setShowProvider((v) => !v)}>
                <Msg k="reply.what_provider_saw" locale={locale} />
              </button>
            </>
          ) : null}
          <span>·</span>
          <button type="button" style={monoLink} onClick={onCopy}>
            <Msg k="reply.copy" locale={locale} />
          </button>
        </div>

        {copied ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6, ...text.monoMeta, color: color.muted }}>
            <Msg k="reply.copied" locale={locale} p={{ n: copy.restoredCount }} />
            {copy.warningKey ? (
              <>
                <Msg k={copy.warningKey} locale={locale} style={{ color: color.amber }} />
                <button type="button" style={monoLink}>
                  <Msg k={copy.redactedKey} locale={locale} />
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Masked, still open (NorthGuard's) — offer the session value with an explicit choice. */}
        {maskedOpen.map((ph) => {
          if (ph in dismissed) return null
          const s = buildRestoreSuggestion(ph, mapping)
          return (
            <div key={ph} data-testid="masked-open" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 8, background: color.amberChipBg, border: `1px solid ${color.touchedBorder}`, borderRadius: radius.info, padding: '8px 12px' }}>
              <Msg k="reply.label_masked" locale={locale} style={{ ...text.capsLabel, color: color.amber }} />
              <Content style={{ ...text.monoMeta, color: color.amber }}>
                {ph}
                {s.suggestion ? ` → ${s.suggestion}` : ''}
              </Content>
              {s.suggestion ? (
                <button type="button" style={monoLink} onClick={() => setApplied((a) => ({ ...a, [ph]: s.suggestion as string }))}>
                  <Msg k={s.applyKey} locale={locale} />
                </button>
              ) : null}
              <button type="button" style={monoLink} onClick={() => setDismissed((d) => ({ ...d, [ph]: true }))}>
                <Msg k={s.keepKey} locale={locale} />
              </button>
            </div>
          )
        })}

        {/* Model gaps — honest attribution, no value to offer, and NO homework (NG-25). */}
        {modelOpen.length > 0 ? (
          <div data-testid="model-gap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 8, background: color.bgRaised, border: `1px dashed ${color.lineStrong}`, borderRadius: radius.info, padding: '8px 12px' }}>
            <Msg k="reply.label_model" locale={locale} style={{ ...text.capsLabel, color: color.muted }} />
            <Msg k="reply.model_gap_note" locale={locale} style={{ ...text.explain, color: color.muted }} />
          </div>
        ) : null}
      </div>
    </article>
  )
}
