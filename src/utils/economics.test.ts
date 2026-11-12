import { describe, expect, it } from 'vitest'
import benchmark from '../../research/results/benchmark.json'
import {
  afterCommission, breakEvenCommission, COMMISSION_RATES, disposalSavedEur, infraLoad, MDL_PER_EUR, platformCostPerVenue,
  REDIS_COMMANDS, UPSTASH_FREE_COMMANDS, venueRecovery, type RuleYield,
} from './economics'

const bakery = { itemsPerDay: 15, priceMdl: 60, kgPerItem: 0.5, daysPerMonth: 30 }

describe('venueRecovery', () => {
  it('scales a yield to a venue: items × price × value share', () => {
    const r = venueRecovery({ valueShare: 0.4, sellThrough: 0.8 }, bakery)
    expect(r.itemsRescuedPerDay).toBeCloseTo(12, 10)
    expect(r.mdlPerDay).toBeCloseTo(360, 10)
    expect(r.mdlPerMonth).toBeCloseTo(10800, 8)
    expect(r.mdlPerYear).toBeCloseTo(129600, 6)
    expect(r.eurPerMonth).toBeCloseTo(10800 / MDL_PER_EUR, 8)
    expect(r.kgPerMonth).toBeCloseTo(12 * 0.5 * 30, 8)
  })

  it('recovers nothing when nothing sells (the bin)', () => {
    const r = venueRecovery({ valueShare: 0, sellThrough: 0 }, bakery)
    expect(r.mdlPerYear).toBe(0)
    expect(r.kgPerMonth).toBe(0)
  })

  it('uses the venue’s own exchange rate when given', () => {
    expect(venueRecovery({ valueShare: 0.5, sellThrough: 1 }, { ...bakery, mdlPerEur: 10 }).eurPerMonth).toBeCloseTo(1350, 8)
  })

  it('applies to the registered benchmark: the reference bakery on Method C', () => {
    const c = benchmark.bakery.methods.C
    const r = venueRecovery({ valueShare: c.valueShare, sellThrough: c.sellThrough }, bakery)
    // the simulated revenue per day, converted at the same rate, must come back out
    expect(r.mdlPerDay / MDL_PER_EUR).toBeCloseTo(c.revenueEurPerDay, 3)
    expect(r.mdlPerYear).toBeGreaterThan(0)
  })
})

describe('commission', () => {
  it('keeps (1 − rate) of the revenue and clamps nonsense rates', () => {
    expect(afterCommission(1000, 0.25)).toBe(750)
    expect(afterCommission(1000, -1)).toBe(1000)
    expect(afterCommission(1000, 4)).toBe(0)
  })

  it('finds the commission at which two rules earn the same', () => {
    const rich: RuleYield = { valueShare: 0.4, sellThrough: 0.7 }
    const lean: RuleYield = { valueShare: 0.3, sellThrough: 0.8 }
    const c = breakEvenCommission(rich, lean)
    expect(c).toBeCloseTo(0.25, 10)
    expect(afterCommission(rich.valueShare, c)).toBeCloseTo(lean.valueShare, 10)
    expect(breakEvenCommission(lean, rich)).toBe(0)
  })

  it('quotes the two rates the supervisor named', () => {
    expect([...COMMISSION_RATES]).toEqual([0.25, 0.3])
  })
})

describe('disposalSavedEur', () => {
  it('is kilograms times the rate and never negative', () => {
    expect(disposalSavedEur(100, 0.1)).toBeCloseTo(10, 10)
    expect(disposalSavedEur(100, -3)).toBe(0)
  })
})

describe('infraLoad', () => {
  it('a pilot with a few hundred sessions stays inside the Upstash free tier', () => {
    const load = infraLoad({ sessionsPerMonth: 300, searchesPerSession: 3, reservationsPerSession: 0.1, activeShare: 0.05 })
    expect(load.commands).toBeLessThan(UPSTASH_FREE_COMMANDS)
    expect(load.extraUsd).toBe(0)
  })

  it('a globe that is always kept warm costs 56 commands a minute and passes the free tier by itself', () => {
    const load = infraLoad({ sessionsPerMonth: 1_000_000, searchesPerSession: 0, reservationsPerSession: 0, activeShare: 1 })
    expect(load.globeCommands).toBe(30 * 24 * 60 * REDIS_COMMANDS.globeRefresh)
    expect(load.overFreeTier).toBe(load.commands - UPSTASH_FREE_COMMANDS)
    expect(load.extraUsd).toBeCloseTo(((load.commands - UPSTASH_FREE_COMMANDS) / 100_000) * 0.2, 8)
  })

  it('the globe can never refresh more often than there are sessions', () => {
    const load = infraLoad({ sessionsPerMonth: 10, searchesPerSession: 0, reservationsPerSession: 0, activeShare: 1 })
    expect(load.globeCommands).toBe(10 * REDIS_COMMANDS.globeRefresh)
  })

  it('more CDN regions means proportionally more globe refreshes', () => {
    const one = infraLoad({ sessionsPerMonth: 1e6, searchesPerSession: 0, reservationsPerSession: 0, activeShare: 0.5, cdnRegions: 1 })
    const three = infraLoad({ sessionsPerMonth: 1e6, searchesPerSession: 0, reservationsPerSession: 0, activeShare: 0.5, cdnRegions: 3 })
    expect(three.globeCommands).toBe(one.globeCommands * 3)
  })
})

describe('platformCostPerVenue', () => {
  it('splits a Vercel Pro seat (plus any Redis overage) across the partner venues', () => {
    const one = platformCostPerVenue(1, 0)
    expect(one.eurPerMonth).toBeCloseTo(20 / 1.08, 8)
    expect(platformCostPerVenue(40, 0).eurPerVenue).toBeCloseTo(one.eurPerMonth / 40, 8)
    expect(platformCostPerVenue(0, 0).eurPerVenue).toBeCloseTo(one.eurPerMonth, 8)
  })
})
