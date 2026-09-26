import type { JSX } from 'react'
import type { ComposerState, InspectionVerdict, Locale } from '../types'
import { deriveComposerView } from './deriveComposerView'
import { Msg, formatMessage } from '../i18n'
import { color, radius, text, sendButton, secondaryButton, composerCardBorder, inspectionSweepParams } from '../design'
import { motion } from '../design/motionTokens'
import { SubmissionMirror } from '../mirror/SubmissionMirror'
import { BlockPanel } from '../mirror/BlockPanel'

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

      {/* Reserved mirror space (rule 14): 0fr↔1fr, no layout jump. */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: view.mirrorOpen ? '1fr' : '0fr',
          transition: `grid-template-rows ${motion.mirrorToggle.ms}ms ${motion.mirrorToggle.curve}`,
        }}
      >
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          {view.mirrorOpen && verdict ? (
            state === 'blocked' ? (
              <BlockPanel verdict={verdict} locale={locale} onSend={onSend} />
            ) : (
              <SubmissionMirror verdict={verdict} locale={locale} />
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
        <Msg k={view.statusKey} locale={locale} p={{ n: verdict?.touchedAreas.length ?? 0 }} style={{ ...text.monoStatus, color: color.muted }} />
        <button
          type="button"
          data-testid="send-button"
          disabled={view.sendTone === 'disabled'}
          onClick={onSend}
          style={{
            ...sendButton(view.sendTone),
            transition: `background-color ${motion.sendButton.ms}ms ${motion.sendButton.curve}`,
          }}
        >
          <Msg k={view.sendLabelKey} locale={locale} />
        </button>
      </div>
    </div>
  )
}
