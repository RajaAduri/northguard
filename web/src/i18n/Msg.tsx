import type { JSX } from 'react'
import type { Locale } from '../types'
import { formatMessage } from './formatMessage'

// SF-5054 — every user-visible UI string renders through <Msg>, which stamps the
// catalogue key (and any params) onto the element. The string-fidelity gate walks
// [data-i18n-key] and asserts textContent === formatMessage(key, locale, params), so a
// hardcoded or wrong-language string cannot pass (Handoff §3). Tenant/wire/prompt content
// is NOT a catalogue string — it renders through <Content> and is exempt.
type Tag = 'span' | 'div' | 'button' | 'p' | 'h1' | 'h2' | 'header' | 'strong' | 'li' | 'label' | 'small'

export interface MsgProps {
  k: string
  locale: Locale
  p?: Record<string, string | number>
  as?: Tag
  style?: React.CSSProperties
  className?: string
  'data-testid'?: string
}

export function Msg({ k, locale, p, as = 'span', style, className, ...rest }: MsgProps): JSX.Element {
  const Tag = as as keyof JSX.IntrinsicElements
  return (
    <Tag
      data-i18n-key={k}
      data-i18n-params={p ? JSON.stringify(p) : undefined}
      style={style}
      className={className}
      data-testid={rest['data-testid']}
    >
      {formatMessage(k, locale, p)}
    </Tag>
  )
}

// SF-5054 — a marker for content that is deliberately NOT a catalogue string: the wire
// transcript, the original prompt, the restored reply, tenant area labels, placeholders.
export interface ContentProps {
  as?: Tag
  style?: React.CSSProperties
  className?: string
  children: React.ReactNode
  'data-testid'?: string
}

export function Content({ as = 'span', style, className, children, ...rest }: ContentProps): JSX.Element {
  const Tag = as as keyof JSX.IntrinsicElements
  return (
    <Tag data-content="" style={style} className={className} data-testid={rest['data-testid']}>
      {children}
    </Tag>
  )
}
