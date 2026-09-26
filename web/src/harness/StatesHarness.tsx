import type { JSX } from 'react'
import type { Locale } from '../types'
import { Msg } from '../i18n'
import { color, radius, text } from '../design'
import { Composer } from '../composer/Composer'
import { AreaMenuButton } from '../composer/AreaMenuButton'
import { deriveComposerView } from '../composer/deriveComposerView'
import { composerStateFixtures, type StateFixture } from './stateFixtures'
import { ThresholdGate, ManagementView, buildThresholdModel, buildBriefingView } from '../rooms'
import { briefingInputsFixture, thresholdFixture, briefingRange } from '../rooms/managementFixtures'

// SF-5092 — renders every composer state (Handoff §1.1) as a captured panel. The fidelity
// gates walk each [data-capture]; Playwright screenshots the same node. Harness chrome
// (captions, scaffolding) sits OUTSIDE [data-capture] so only the real product surface is
// asserted and photographed. Demo areas total 6 (Handoff rule 1 default label).
const DEMO_AREA_COUNT = 6

function areaMenuFor(fx: StateFixture): { labelKey: string; n: number } {
  // F6 — the tested derivation, not a duplicate; only the count is context.
  const labelKey = deriveComposerView(fx.state, fx.verdict, fx.degraded).areaMenuLabelKey
  return { labelKey, n: labelKey === 'header.areas_protected' ? DEMO_AREA_COUNT : fx.verdict?.touchedAreas.length ?? 0 }
}

function WorkspaceFrame({ fx, locale }: { fx: StateFixture; locale: Locale }): JSX.Element {
  const menu = areaMenuFor(fx)
  return (
    <div
      data-capture=""
      data-screenshot={fx.key}
      style={{ background: color.bgSurface, borderRadius: radius.card, padding: '0 0 16px', width: 720, maxWidth: '100%' }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 57,
          padding: '14px 28px',
          borderBottom: `1px solid ${color.line}`,
        }}
      >
        <Msg k="header.new_title" locale={locale} style={{ ...text.headerTitle, color: color.ink }} />
        <AreaMenuButton labelKey={menu.labelKey} n={menu.n} locale={locale} />
      </header>

      <div style={{ padding: '24px 28px 0' }}>
        <Composer state={fx.state} verdict={fx.verdict} degraded={fx.degraded} locale={locale} draft={fx.draft} />
        <Msg
          k="footnote.default"
          locale={locale}
          as="p"
          style={{ ...text.footnote, color: color.muted, textAlign: 'center', margin: '10px 0 0' }}
        />
      </div>
    </div>
  )
}

export interface StatesHarnessProps {
  locale?: Locale
}

export function StatesHarness({ locale = 'de' }: StatesHarnessProps): JSX.Element {
  return (
    <div data-testid="states-harness" style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: 40, background: color.bgSurface }}>
      {composerStateFixtures.map((fx) => (
        <figure key={fx.key} style={{ margin: 0 }}>
          <figcaption data-harness-caption="" style={{ ...text.monoMeta, color: color.muted, marginBottom: 8 }}>
            {fx.label}
          </figcaption>
          <WorkspaceFrame fx={fx} locale={locale} />
        </figure>
      ))}

      {/* Management room (rule 15): the document register, on the document canvas so a
          chrome-less screenshot is immediately identifiable as the other room. */}
      <figure style={{ margin: 0 }}>
        <figcaption data-harness-caption="" style={{ ...text.monoMeta, color: color.muted, marginBottom: 8 }}>
          management · threshold
        </figcaption>
        <div data-capture="" data-screenshot="management-threshold" style={{ background: color.bgCanvas, borderRadius: radius.card, width: 720, maxWidth: '100%' }}>
          <ThresholdGate model={buildThresholdModel(thresholdFixture.week, thresholdFixture.people)} locale={locale} />
        </div>
      </figure>
      <figure style={{ margin: 0 }}>
        <figcaption data-harness-caption="" style={{ ...text.monoMeta, color: color.muted, marginBottom: 8 }}>
          management · briefing
        </figcaption>
        <div data-capture="" data-screenshot="management-briefing" style={{ background: color.bgCanvas, borderRadius: radius.card, width: 720, maxWidth: '100%' }}>
          <ManagementView activeTab="briefing" locale={locale} briefing={buildBriefingView(briefingInputsFixture)} range={briefingRange} />
        </div>
      </figure>
    </div>
  )
}
