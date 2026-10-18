import { describe, expect, it } from 'vitest'
import type { EveningHour, SlotOffer, UserProfile } from '../types/food'
import { planEvening } from './planner'

const NOBODY: UserProfile = { vegetarian: false, vegan: false, glutenFree: false, onBudget: false, lastCallAlerts: false }

function slot(o: Partial<SlotOffer>): SlotOffer {
  return { category: 'bakery', diet: 'vegan', glutenFree: false, discountPct: 40, price: 5, quantityLeft: 2, ...o }
}

function hour(h: number, offers: SlotOffer[]): EveningHour {
  return { hour: h, label: `${h}:00`, offers }
}

describe('planEvening', () => {
  const evening = [
    hour(18, [slot({ discountPct: 35 })]),
    hour(19, [slot({ discountPct: 50 }), slot({ discountPct: 45, diet: 'meat', price: 2 })]),
    hour(20, [slot({ discountPct: 60, diet: 'meat', price: 3 })]),
    hour(21, []),
  ]

  it('picks the hour with the most discount on offer', () => {
    const plan = planEvening(evening, NOBODY)
    expect(plan.best?.hour).toBe(19)
    expect(plan.hours.map((h) => h.level)).toEqual(['few', 'best', 'good', 'none'])
  })

  it('only counts offers that fit the diet', () => {
    const plan = planEvening(evening, { ...NOBODY, vegan: true })
    expect(plan.hours.map((h) => h.matching)).toEqual([1, 1, 0, 0])
    expect(plan.best?.hour).toBe(19)
    expect(plan.empty.map((h) => h.hour)).toEqual([20, 21])
  })

  it('on a budget, picks the hour with the cheapest fitting offer', () => {
    const plan = planEvening(evening, { ...NOBODY, onBudget: true })
    expect(plan.best?.hour).toBe(19)
    expect(plan.best?.cheapest).toBe(2)
  })

  it('prefers the earlier hour on a tie', () => {
    const plan = planEvening([hour(18, [slot({})]), hour(19, [slot({})])], NOBODY)
    expect(plan.best?.hour).toBe(18)
  })

  it('has no best hour when nothing fits', () => {
    const plan = planEvening(evening, { ...NOBODY, vegan: true, glutenFree: true })
    expect(plan.best).toBeNull()
    expect(plan.empty).toHaveLength(4)
  })
})
