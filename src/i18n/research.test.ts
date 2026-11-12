import { describe, expect, it } from 'vitest'
import benchmark from '../../research/results/benchmark.json'
import { findingValues, formatPercent, hypothesisVerdict } from '../utils/research'
import { researchTexts } from './research'
import { fill } from './translations'

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('research page texts', () => {
  it('every language has the same keys', () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value) ? value.map(shape) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value
    expect(shape(researchTexts.ro)).toEqual(shape(researchTexts.en))
    expect(shape(researchTexts.ru)).toEqual(shape(researchTexts.en))
  })

  it('every translation keeps the same {placeholders} as the English text', () => {
    const walk = (en: unknown, other: unknown, path: string) => {
      if (typeof en === 'string') {
        expect(placeholders(other as string), path).toEqual(placeholders(en))
      } else if (Array.isArray(en)) {
        en.forEach((item, i) => walk(item, (other as unknown[])[i], `${path}[${i}]`))
      } else if (en && typeof en === 'object') {
        for (const key of Object.keys(en)) walk((en as Record<string, unknown>)[key], (other as Record<string, unknown>)[key], `${path}.${key}`)
      }
    }
    walk(researchTexts.en, researchTexts.ro, 'ro')
    walk(researchTexts.en, researchTexts.ru, 'ru')
  })

  it('no placeholder is left unfilled in the findings', () => {
    const v = findingValues(benchmark)
    for (const lang of ['en', 'ro', 'ru'] as const) {
      for (const text of researchTexts[lang].findings) {
        expect(fill(text, { a: v.a, b: v.b, c: v.c, d: v.d, e: v.e, f: v.f })).not.toMatch(/\{\w+\}/)
      }
    }
  })
})

describe('the claims in the findings match the registered results', () => {
  it('finding 1: better than the fixed 50% discount in all nine scenarios, but short of the targets', () => {
    const h = benchmark.primary.hypotheses
    expect(h.H1a.cellsWon).toBe(9)
    expect(h.H2a.cellsWon).toBe(9)
    expect(h.H1a.low).toBeGreaterThan(0)
    expect(h.H2a.low).toBeGreaterThan(0)
    expect(h.H1a.estimate).toBeLessThan(h.H1a.target)
    expect(h.H2a.estimate).toBeLessThan(h.H2a.target)
  })

  it('finding 2: against the linear line the gap is small, and the curve alone does not beat it', () => {
    const v = findingValues(benchmark)
    expect(v.c).toBeLessThan(1.5)
    const ablation = Object.fromEntries(benchmark.ablation.map((a) => [a.id, a]))
    expect(ablation['curve'].sellThroughVsB.estimate).toBeLessThan(0)
    expect(ablation['linear+boost'].sellThroughVsB.estimate).toBeGreaterThan(0)
  })

  it('finding 3: fewer portions but more revenue than the deep fixed discount', () => {
    expect(benchmark.primary.extra.sellThrough_vs_A2.estimate).toBeLessThan(0)
    expect(benchmark.primary.extra.revenue_vs_A2.estimate).toBeGreaterThan(0)
  })

  it('finding 4: a plateau, not a sharp optimum, between exponent 1.0 and 1.6', () => {
    expect(findingValues(benchmark).f).toBeLessThan(0.5)
  })

  it('all four hypotheses are reported with the rule fixed in the pre-registration', () => {
    for (const h of Object.values(benchmark.primary.hypotheses)) {
      expect(h.verdict).toBe(hypothesisVerdict(h.estimate, h.low, h.target))
    }
  })
})

describe('formatPercent', () => {
  it('formats with the language’s own separators and an explicit sign', () => {
    expect(formatPercent(0.191, 'en', 1, true)).toBe('+19.1%')
    expect(formatPercent(-0.133, 'en', 1, true)).toMatch(/^[-−]13\.3%$/)
    expect(formatPercent(0.191, 'ro', 1)).toMatch(/19,1/)
  })
})
