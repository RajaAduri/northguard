import type { JSX } from 'react'
import type { ComposerState, InspectionVerdict, Locale, PlaceholderMapping, RedactionSpan, ReportForm, ReportDone } from '../types'
import { deriveComposerView } from './deriveComposerView'
import { Msg, formatMessage } from '../i18n'
import { color, radius, text, sendButton, secondaryButton, composerCardBorder, inspectionSweepParams } from '../design'
import { motion } from '../design/motionTokens'
import { SubmissionMirror } from '../mirror/SubmissionMirror'
import { BlockPanel } from '../mirror/BlockPanel'
import { ReportPanel } from '../report'

// The report flow shares the mirror's reserved space (Handoff §1.1 `report`): the form
// replaces the mirror content, then report-done shows the id + path forward.
export interface ReportSlot {
  form: ReportForm | null
  done: ReportDone | null
  onSelectSpan: (span: RedactionSpan) => void
  onSubmit: (form: ReportForm) => void
  onCancel: () => void
}

// SF-5015 — the composer card. Chrome appears in proportion to the finding (Handoff
// rule 1): a clean/empty composer shows one quiet mono status line and reads "Senden";
// only a fund opens the mirror and turns the button amber ("Maskiert senden"). The mirror
// lives in a reserved grid row (0fr↔1fr) so the layout never jumps (rule 14). The 2px
// teal sweep runs only while inspecting (§2). Every visible string is a catalogue key.
export interface ComposerProps {
  state: ComposerState
  verdict: InspectionVerdict | null
  degraded?: boolean
  locale: Locale
  draft?: string
  editable?: boolean
  inspectionMs?: number
  onDraftChange?: (v: string) => void
  onSend?: () => void
  report?: ReportSlot
  blockValues?: PlaceholderMapping // client-side originals for an echo-class block area
  busy?: boolean // a reply is in flight — disable send so it cannot be pressed twice
}

export function Composer({
  state,
  verdict,
  degraded = false,
  locale,
  draft = '',
  editable = false,
  inspectionMs = motion.inspectionSweepTarget.ms,
  onDraftChange,
  onSend,
  report,
  blockValues,
  busy = false,
}: ComposerProps): JSX.Element {
  const view = deriveComposerView(state, verdict, degraded)
  const sweep = inspectionSweepParams(inspectionMs)
  const borderColor = composerCardBorder[view.borderTone]
  const placeholderKey =
    state === 'locked'
      ? 'composer.placeholder_first'
      : draft
        ? 'composer.placeholder_followup'
        : 'composer.placeholder_first'

  return (
    <div
      data-testid="composer"
      data-state={view.state}
      style={{
        position: 'relative',
        background: color.bgRaised,
        border: `1px solid ${borderColor}`,
        borderRadius: radius.composer,
        transition: `border-color ${motion.composerBorder.ms}ms ${motion.composerBorder.curve}`,
        overflow: 'hidden',
      }}
    >
      {state === 'inspecting' ? (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden' }}
        >
          <div
            data-gradient="inspection-sweep"
            style={{
              height: 2,
              width: '40%',
              background: `linear-gradient(90deg, transparent, ${color.teal}, transparent)`,
              animation: `ng-inspection-sweep ${sweep.periodMs}ms linear infinite`,
            }}
          />
        </div>
      ) : null}

      <div style={{ padding: '14px 18px 10px' }}>
        {editable ? (
          <textarea
            data-testid="composer-input"
            value={draft}
            disabled={state === 'locked'}
            onChange={(e) => onDraftChange?.(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends (Handoff §1.1: Senden/Enter); Shift+Enter inserts a newline.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend?.()
              }
            }}
            placeholder={formatMessage(placeholderKey, locale)}
            rows={3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: 56,
              resize: 'none',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: color.ink,
              ...text.prompt,
            }}
          />
        ) : (
          <div data-content="" style={{ minHeight: 56, color: draft ? color.ink : color.muted, ...text.prompt }}>
            {draft || formatMessage(placeholderKey, locale)}
          </div>
        )}
      </div>

      {/* Reserved mirror space (rule 14): opens smoothly between textfield and footer with
          no layout jump. Uses an animated max-height rather than the 0fr↔1fr grid trick —
          in an auto-height composer the fr track collapses to 0px when it animates open
          (the child's min-height:0 removes its content floor), which hid the result. */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: view.mirrorOpen ? 2000 : 0,
          transition: `max-height ${motion.mirrorToggle.ms}ms ${motion.mirrorToggle.curve}`,
        }}
      >
        <div>
          {view.mirrorOpen && verdict ? (
            state === 'report' && report?.form ? (
              <ReportPanel form={report.form} locale={locale} onSubmit={report.onSubmit} onCancel={report.onCancel} />
            ) : state === 'report-done' && report?.done ? (
              <ReportDonePanel done={report.done} locale={locale} onContinue={report.onCancel} />
            ) : state === 'blocked' ? (
              <BlockPanel verdict={verdict} locale={locale} values={blockValues} onReport={report?.onSelectSpan} />
            ) : (
              <SubmissionMirror verdict={verdict} locale={locale} onReport={report?.onSelectSpan} />
            )
          ) : null}
        </div>
      </div>

      {degraded ? (
        <div
          data-testid="degraded-strip"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            margin: '0 10px 10px',
            padding: '8px 12px',
            background: color.amberChipBg,
            border: `1px solid ${color.touchedBorder}`,
            borderRadius: radius.info,
          }}
        >
          <Msg k="degraded.title" locale={locale} style={{ ...text.monoStatus, color: color.amber }} />
          <button type="button" style={secondaryButton}>
            <Msg k="degraded.details" locale={locale} />
          </button>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 44,
          padding: '8px 18px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* F6 — attachment is deliberately deferred (DECISION-REGISTER §11). A disabled
              control signposts it in progress rather than reading as an oversight; pasting
              document text already works and is inspected + masked. */}
          <button
            type="button"
            data-testid="attach-button"
            data-content=""
            disabled
            aria-label={formatMessage('composer.attach', locale)}
            title={formatMessage('composer.attach_tooltip', locale)}
            style={{ background: 'transparent', border: `1px solid ${color.line}`, borderRadius: radius.smallButton, color: color.muted, padding: '4px 8px', cursor: 'not-allowed', fontFamily: text.monoStatus.fontFamily, fontSize: 13 }}
          >
            📎
          </button>
          <Msg k={view.statusKey} locale={locale} p={{ n: verdict?.touchedAreas.length ?? 0 }} style={{ ...text.monoStatus, color: color.muted }} />
        </div>
        <button
          type="button"
          data-testid="send-button"
          disabled={view.sendTone === 'disabled' || busy}
          onClick={onSend}
          style={{
            ...sendButton(busy ? 'disabled' : view.sendTone),
            transition: `background-color ${motion.sendButton.ms}ms ${motion.sendButton.curve}`,
          }}
        >
          <Msg k={view.sendLabelKey} locale={locale} />
        </button>
      </div>
    </div>
  )
}

// SF-5076 — report-done: the id, the rule stays active, and the path forward (rephrase for a
// block, continue-redacted for a redact). There is no per-prompt approval (rule 7).
function ReportDonePanel({ done, locale, onContinue }: { done: ReportDone; locale: Locale; onContinue: () => void }): JSX.Element {
  return (
    <section data-testid="report-done" style={{ margin: '0 10px 10px', background: color.bgSurface, border: `1px solid ${color.touchedBorder}`, borderRadius: radius.mirror, padding: '10px 12px' }}>
      <Msg k={done.doneKey} locale={locale} p={{ id: done.faId }} as="header" style={{ ...text.monoSubhead, color: color.teal, display: 'block', marginBottom: 6 }} />
      <Msg k={done.ruleStaysKey} locale={locale} as="p" style={{ ...text.explain, color: color.muted, margin: '0 0 10px' }} />
      <button type="button" style={secondaryButton} onClick={onContinue}>
        <Msg k={done.pathForwardKey} locale={locale} />
      </button>
    </section>
  )
}
