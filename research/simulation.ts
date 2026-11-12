/**
 * Venue-evening simulator behind the pricing benchmark (see PREREGISTRATION.md for the model and why).
 *
 * The prices come from the deployed code (`discountFor`, `discountedPrice`), not from a copy, so the
 * benchmark tests what actually runs on the server. Everything else — who arrives, what they are willing
 * to pay — is an explicit assumption, because there is no real sales data.
 */
import { ITEMS, type ItemKey } from '../api/_lib/catalog.ts'
import { discountedPrice, discountFor, MAX_DISCOUNT, START_DISCOUNT, WINDOW_MINUTES } from '../api/_lib/pricing.ts'
import { seededRandom } from '../api/_lib/random.ts'
import type { Scenario } from './config.ts'

/** A pricing rule: percent off at a moment of the window, given the share of the batch still unsold. */
export type DiscountRule = (progress: number, leftRatio: number) => number

export interface Strategy {
  id: string
  label: string
  discount: DiscountRule
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Baseline A (and A2): the same discount all evening. */
export function fixedDiscount(percent: number): DiscountRule {
  return () => percent
}

/** Baseline B: linear markdown from the opening to the closing discount. */
export const linearDiscount: DiscountRule = (progress) => Math.round(START_DISCOUNT + (MAX_DISCOUNT - START_DISCOUNT) * clamp01(progress))

/**
 * The family the production rule belongs to: discount = 30 + 40·p^γ, plus up to `boost` points when much of
 * the batch is still unsold late in the window. `curveDiscount(1.3, 5)` equals the deployed `discountFor`
 * (a test checks this on a grid), so sweeping γ and the boost changes only the two numbers under study.
 */
export function curveDiscount(gamma: number, boost: number): DiscountRule {
  return (progress, leftRatio) => {
    const p = clamp01(progress)
    const value = START_DISCOUNT + (MAX_DISCOUNT - START_DISCOUNT) * Math.pow(p, gamma) + boost * clamp01(leftRatio) * p
    return Math.round(Math.min(MAX_DISCOUNT + boost, Math.max(START_DISCOUNT, value)))
  }
}

export const STRATEGIES = {
  A: { id: 'A', label: 'Fixed 50% off', discount: fixedDiscount(50) },
  B: { id: 'B', label: 'Linear 30→70%', discount: linearDiscount },
  C: { id: 'C', label: 'WasteLand (p^1.3 + boost)', discount: discountFor },
  A2: { id: 'A2', label: 'Fixed 67% off (one third of value)', discount: fixedDiscount(67) },
} as const satisfies Record<string, Strategy>

export interface Customer {
  /** Minute of the window (0…179) at which the customer looks at the offer. */
  arrival: number
  /** Willingness to pay as a share of the full price. */
  wtp: number
  /** Keeps checking every minute until the window closes. */
  patient: boolean
}

export interface Trial {
  quantity: number
  /** Full price of one portion, EUR. */
  price: number
  kgPerPortion: number
  customers: Customer[]
}

export interface Outcome {
  sold: number
  revenue: number
  surplus: number
  kg: number
  /** sold / quantity */
  sellThrough: number
}

type Random = () => number

/** Poisson sample by multiplication of uniforms (Knuth); fine for the small means used here. */
export function poisson(rand: Random, mean: number): number {
  const limit = Math.exp(-mean)
  let count = 0
  let product = rand()
  while (product > limit) {
    count++
    product *= rand()
  }
  return count
}

function standardNormal(rand: Random): number {
  const u = 1 - rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Normal(mean, sd) redrawn until it falls in [0.05, 1]. */
export function truncatedWtp(rand: Random, mean: number, sd: number): number {
  for (;;) {
    const x = mean + sd * standardNormal(rand)
    if (x >= 0.05 && x <= 1) return x
  }
}

/** Arrival minute: uniform, or skewed toward the end ("late") or the start ("early") of the window. */
export function arrivalMinute(rand: Random, profile: Scenario['arrivals']): number {
  const u = rand()
  const share = profile === 'uniform' ? u : profile === 'late' ? Math.sqrt(u) : 1 - Math.sqrt(1 - u)
  return Math.min(WINDOW_MINUTES - 1, Math.floor(share * WINDOW_MINUTES))
}

const ITEM_KEYS = Object.keys(ITEMS) as ItemKey[]

/** What a venue has left and who shows up — fully determined by the seed string. */
export function generateTrial(scenario: Scenario, seed: string, fixed?: { quantity: number; price: number; kgPerPortion: number }): Trial {
  const rand = seededRandom(seed)
  let stock: { quantity: number; price: number; kgPerPortion: number }
  if (fixed) {
    stock = fixed
  } else {
    const quantity = 2 + Math.floor(rand() * 7) // 2…8, the range of the demo network
    const item = ITEMS[ITEM_KEYS[Math.floor(rand() * ITEM_KEYS.length)]]
    stock = { quantity, price: item.baseEur, kgPerPortion: item.kg }
  }
  const count = poisson(rand, scenario.demand * stock.quantity)
  const customers: Customer[] = []
  for (let i = 0; i < count; i++) {
    customers.push({
      arrival: arrivalMinute(rand, scenario.arrivals),
      wtp: truncatedWtp(rand, scenario.wtpMean, scenario.wtpSd),
      patient: rand() < scenario.patientShare,
    })
  }
  return { ...stock, customers }
}

/**
 * Sells one evening under a pricing rule. Each minute, customers who are still waiting come first (in the
 * order they arrived), then the minute's new arrivals. Before every decision the price is recomputed from
 * the current stock, exactly as the server does for every request.
 */
export function runTrial(trial: Trial, rule: DiscountRule): Outcome {
  const { quantity, price: fullPrice, kgPerPortion } = trial
  const byMinute: Customer[][] = Array.from({ length: WINDOW_MINUTES }, () => [])
  for (const customer of trial.customers) byMinute[customer.arrival].push(customer)

  let stock = quantity
  let revenue = 0
  let surplus = 0
  let waiting: Customer[] = []

  for (let minute = 0; minute < WINDOW_MINUTES && stock > 0; minute++) {
    const progress = minute / WINDOW_MINUTES
    const stillWaiting: Customer[] = []
    for (const customer of [...waiting, ...byMinute[minute]]) {
      if (stock === 0) break
      const price = discountedPrice(fullPrice, rule(progress, stock / quantity))
      const budget = customer.wtp * fullPrice
      if (price <= budget) {
        stock--
        revenue += price
        surplus += budget - price
      } else if (customer.patient) {
        stillWaiting.push(customer)
      }
    }
    waiting = stillWaiting
  }

  const sold = quantity - stock
  return { sold, revenue, surplus, kg: sold * kgPerPortion, sellThrough: sold / quantity }
}

/** Mean of a list. */
export function mean(values: ArrayLike<number>): number {
  let total = 0
  for (let i = 0; i < values.length; i++) total += values[i]
  return total / values.length
}
