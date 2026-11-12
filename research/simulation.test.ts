import { describe, expect, it } from 'vitest'
import { discountedPrice, discountFor } from '../api/_lib/pricing.js'
import { seededRandom } from '../api/_lib/random.js'
import { BASE_ASSUMPTIONS, primaryCells, type Scenario } from './config.ts'
import {
  arrivalMinute, curveDiscount, fixedDiscount, generateTrial, linearDiscount, mean, poisson, runTrial, STRATEGIES, truncatedWtp,
  type Trial,
} from './simulation.ts'
import { bootstrapRelative, hypothesisVerdict, percentile, pooledRelative } from './stats.ts'

const scenario: Scenario = { demand: 1.5, wtpMean: 0.45, ...BASE_ASSUMPTIONS }

describe('pricing rules', () => {
  it('the swept curve family contains the deployed rule: curveDiscount(1.3, 5) === discountFor', () => {
    for (let p = 0; p <= 1.0001; p += 1 / 36) {
      for (const left of [0, 0.25, 0.5, 0.75, 1]) {
        expect(curveDiscount(1.3, 5)(p, left)).toBe(discountFor(p, left))
      }
    }
  })

  it('Baseline B is the same family with γ = 1 and no boost', () => {
    for (let p = 0; p <= 1; p += 0.05) expect(curveDiscount(1, 0)(p, 0.7)).toBe(linearDiscount(p, 0.7))
  })

  it('Baseline B runs from 30% to 70% and the fixed rules never move', () => {
    expect(linearDiscount(0, 1)).toBe(30)
    expect(linearDiscount(1, 1)).toBe(70)
    expect(fixedDiscount(50)(0.9, 0.1)).toBe(50)
  })
})

describe('random helpers', () => {
  it('poisson has about the requested mean', () => {
    const rand = seededRandom('test|poisson')
    const draws = Array.from({ length: 20000 }, () => poisson(rand, 4.5))
    expect(mean(draws)).toBeGreaterThan(4.4)
    expect(mean(draws)).toBeLessThan(4.6)
  })

  it('willingness to pay always lies in [0.05, 1]', () => {
    const rand = seededRandom('test|wtp')
    for (let i = 0; i < 5000; i++) {
      const w = truncatedWtp(rand, 0.55, 0.3)
      expect(w).toBeGreaterThanOrEqual(0.05)
      expect(w).toBeLessThanOrEqual(1)
    }
  })

  it('arrival minutes stay inside the window and the profiles lean the right way', () => {
    const rand = seededRandom('test|arrival')
    const avg = (profile: Scenario['arrivals']) => mean(Array.from({ length: 4000 }, () => arrivalMinute(rand, profile)))
    for (const profile of ['uniform', 'late', 'early'] as const) {
      const m = avg(profile)
      expect(m).toBeGreaterThan(0)
      expect(m).toBeLessThan(180)
    }
    expect(avg('late')).toBeGreaterThan(avg('uniform'))
    expect(avg('early')).toBeLessThan(avg('uniform'))
  })
})

describe('generateTrial', () => {
  it('is fully determined by its seed', () => {
    const a = generateTrial(scenario, 'x|1')
    expect(generateTrial(scenario, 'x|1')).toEqual(a)
    expect(generateTrial(scenario, 'x|2')).not.toEqual(a)
  })

  it('draws 2–8 portions of a catalogue item', () => {
    for (let i = 0; i < 200; i++) {
      const trial = generateTrial(scenario, `shape|${i}`)
      expect(trial.quantity).toBeGreaterThanOrEqual(2)
      expect(trial.quantity).toBeLessThanOrEqual(8)
      expect(trial.price).toBeGreaterThan(0)
    }
  })

  it('brings more customers when demand is higher', () => {
    const count = (demand: number) => mean(Array.from({ length: 400 }, (_, i) => generateTrial({ ...scenario, demand }, `n|${i}`).customers.length))
    expect(count(3)).toBeGreaterThan(count(0.75) * 3)
  })
})

function handmade(customers: Trial['customers'], quantity = 3): Trial {
  return { quantity, price: 10, kgPerPortion: 0.5, customers }
}

describe('runTrial', () => {
  it('sells nothing when nobody comes', () => {
    expect(runTrial(handmade([]), STRATEGIES.C.discount)).toMatchObject({ sold: 0, revenue: 0, sellThrough: 0 })
  })

  it('a customer who will pay full price buys at the first minute, at the opening discount', () => {
    const out = runTrial(handmade([{ arrival: 0, wtp: 1, patient: false }]), STRATEGIES.C.discount)
    expect(out.sold).toBe(1)
    expect(out.revenue).toBe(discountedPrice(10, 30))
  })

  it('never sells more than the stock', () => {
    const crowd = Array.from({ length: 50 }, (_, i) => ({ arrival: i, wtp: 1, patient: false }))
    for (const strategy of Object.values(STRATEGIES)) {
      const out = runTrial(handmade(crowd), strategy.discount)
      expect(out.sold).toBe(3)
      expect(out.sellThrough).toBe(1)
    }
  })

  it('under a fixed discount revenue is the number sold times the fixed price', () => {
    const crowd = Array.from({ length: 10 }, (_, i) => ({ arrival: i, wtp: 0.9, patient: false }))
    const out = runTrial(handmade(crowd), STRATEGIES.A.discount)
    expect(out.revenue).toBe(3 * discountedPrice(10, 50))
  })

  it('a customer below the lowest price never buys, patient or not', () => {
    const cheapskate = [{ arrival: 0, wtp: 0.1, patient: true }]
    for (const strategy of Object.values(STRATEGIES)) expect(runTrial(handmade(cheapskate), strategy.discount).sold).toBe(0)
  })

  it('a patient customer waits for the price to fall; an impatient one leaves', () => {
    // willing to pay 45% of the full price, i.e. a 55% discount: reached by C late in the window
    const patient = runTrial(handmade([{ arrival: 0, wtp: 0.45, patient: true }]), STRATEGIES.C.discount)
    const impatient = runTrial(handmade([{ arrival: 0, wtp: 0.45, patient: false }]), STRATEGIES.C.discount)
    expect(patient.sold).toBe(1)
    expect(impatient.sold).toBe(0)
    expect(patient.surplus).toBeGreaterThanOrEqual(0)
  })

  it('patience makes no difference under a fixed price', () => {
    const base = { arrival: 5, wtp: 0.45 }
    const a = runTrial(handmade([{ ...base, patient: true }]), STRATEGIES.A.discount)
    const b = runTrial(handmade([{ ...base, patient: false }]), STRATEGIES.A.discount)
    expect(a).toEqual(b)
  })

  it('customer surplus is never negative', () => {
    for (let i = 0; i < 100; i++) {
      for (const strategy of Object.values(STRATEGIES)) expect(runTrial(generateTrial(scenario, `s|${i}`), strategy.discount).surplus).toBeGreaterThanOrEqual(0)
    }
  })

  it('is deterministic', () => {
    const trial = generateTrial(scenario, 'det|1')
    expect(runTrial(trial, STRATEGIES.C.discount)).toEqual(runTrial(trial, STRATEGIES.C.discount))
  })
})

describe('the primary grid', () => {
  it('has nine cells numbered 1–9 with the registered demand and willingness to pay', () => {
    const cells = primaryCells()
    expect(cells).toHaveLength(9)
    expect(cells.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(cells[0].scenario).toMatchObject({ demand: 0.75, wtpMean: 0.35, wtpSd: 0.2, patientShare: 0.3, arrivals: 'uniform' })
    expect(cells[8].scenario).toMatchObject({ demand: 3, wtpMean: 0.55 })
  })
})

describe('bootstrap', () => {
  it('an exact doubling gives +100% with a zero-width interval', () => {
    const base = [Float64Array.from([1, 2, 3, 4]), Float64Array.from([2, 2, 2, 2])]
    const doubled = base.map((cell) => cell.map((v) => v * 2))
    const [result] = bootstrapRelative([{ num: doubled, den: base }], 300, 'test|boot')
    expect(result.estimate).toBeCloseTo(1, 10)
    expect(result.low).toBeCloseTo(1, 10)
    expect(result.high).toBeCloseTo(1, 10)
  })

  it('is reproducible and the interval brackets the estimate', () => {
    const rand = seededRandom('test|data')
    const base = [Float64Array.from({ length: 200 }, () => 1 + rand())]
    const method = [base[0].map((v) => v * 1.1 + (rand() - 0.5) * 0.4)]
    const first = bootstrapRelative([{ num: method, den: base }], 500, 'test|boot')[0]
    const second = bootstrapRelative([{ num: method, den: base }], 500, 'test|boot')[0]
    expect(first).toEqual(second)
    expect(first.low).toBeLessThanOrEqual(first.estimate)
    expect(first.high).toBeGreaterThanOrEqual(first.estimate)
    expect(first.estimate).toBeCloseTo(pooledRelative({ num: method, den: base }), 12)
  })

  it('percentile interpolates', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(percentile([0, 10], 0.25)).toBe(2.5)
  })

  it('applies the registered decision rule', () => {
    expect(hypothesisVerdict(0.3, 0.2, 0.25)).toBe('supported')
    expect(hypothesisVerdict(0.1, 0.05, 0.25)).toBe('partial')
    expect(hypothesisVerdict(0.3, -0.01, 0.25)).toBe('notSupported')
    expect(hypothesisVerdict(-0.1, -0.2, 0.25)).toBe('notSupported')
  })
})
