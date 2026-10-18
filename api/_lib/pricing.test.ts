import { describe, expect, it } from 'vitest'
import { discountedPrice, discountFor, LEFTOVER_BOOST, MAX_DISCOUNT, niceRound, START_DISCOUNT } from './pricing.js'

describe('discountFor', () => {
  it('starts at the opening discount when the window opens', () => {
    expect(discountFor(0, 1)).toBe(START_DISCOUNT)
  })

  it('reaches the maximum discount at closing time', () => {
    expect(discountFor(1, 0)).toBe(MAX_DISCOUNT)
  })

  it('never decreases as closing time gets closer', () => {
    let previous = 0
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const d = discountFor(p, 0.5)
      expect(d).toBeGreaterThanOrEqual(previous)
      previous = d
    }
  })

  it('adds a boost when a lot is still unsold late in the window, capped at the boost size', () => {
    expect(discountFor(1, 1)).toBe(MAX_DISCOUNT + LEFTOVER_BOOST)
    expect(discountFor(0.8, 1)).toBeGreaterThan(discountFor(0.8, 0))
  })

  it('clamps out-of-range inputs', () => {
    expect(discountFor(-3, 5)).toBe(START_DISCOUNT)
    expect(discountFor(9, 9)).toBe(MAX_DISCOUNT + LEFTOVER_BOOST)
  })
})

describe('niceRound', () => {
  it('rounds to two significant steps of the value’s own magnitude', () => {
    expect(niceRound(4.47)).toBe(4.5)
    expect(niceRound(742)).toBe(740)
    expect(niceRound(12345)).toBe(12000)
    expect(niceRound(0)).toBe(0)
  })
})

describe('discountedPrice', () => {
  it('applies the discount and rounds', () => {
    expect(discountedPrice(10, 40)).toBe(6)
    expect(discountedPrice(22.5, 30)).toBe(16)
  })

  it('is always strictly cheaper than the original price', () => {
    for (const original of [1, 3.5, 9.9, 99, 740, 12000]) {
      for (const pct of [30, 31, 50, 75]) {
        expect(discountedPrice(original, pct)).toBeLessThan(original)
      }
    }
  })
})
