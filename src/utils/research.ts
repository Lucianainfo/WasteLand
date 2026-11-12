import type { Lang } from '../i18n/translations'
import { localeFor } from './format'

export type Verdict = 'supported' | 'partial' | 'notSupported'

/** The pre-registered decision rule (research/PREREGISTRATION.md). */
export function hypothesisVerdict(estimate: number, low: number, target: number): Verdict {
  if (low > 0 && estimate >= target) return 'supported'
  if (low > 0) return 'partial'
  return 'notSupported'
}

/** 0.1907 → "19.1%"; with `signed`, a leading + or − sign. */
export function formatPercent(value: number, lang: Lang, digits = 1, signed = false): string {
  return new Intl.NumberFormat(localeFor(lang), {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(value)
}

export function formatFixed(value: number, lang: Lang, digits = 1): string {
  return new Intl.NumberFormat(localeFor(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

interface Interval {
  estimate: number
  low: number
  high: number
}

/** The slice of benchmark.json that the sentences of the "What the numbers say" section quote. */
export interface FindingData {
  primary: {
    hypotheses: Record<'H1a' | 'H1b' | 'H2a' | 'H2b', Interval & { cellsWon: number }>
    extra: Record<'sellThrough_vs_A2' | 'revenue_vs_A2', Interval>
  }
  sweep: { gammas: { gamma: number; revenueVsProduction: Interval }[] }
}

/** Numbers for the four findings, as percentages with one decimal (the sentences say "{a}%"). */
export function findingValues(data: FindingData): Record<'a' | 'b' | 'c' | 'd' | 'e' | 'f', number> {
  const h = data.primary.hypotheses
  const plateau = data.sweep.gammas.filter((g) => g.gamma >= 1 && g.gamma <= 1.6)
  return {
    a: h.H1a.estimate * 100,
    b: h.H2a.estimate * 100,
    c: Math.max(Math.abs(h.H1b.estimate), Math.abs(h.H2b.estimate)) * 100,
    d: Math.abs(data.primary.extra.sellThrough_vs_A2.estimate) * 100,
    e: data.primary.extra.revenue_vs_A2.estimate * 100,
    f: Math.max(...plateau.map((g) => Math.abs(g.revenueVsProduction.estimate))) * 100,
  }
}
