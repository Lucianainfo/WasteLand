import { describe, expect, it } from 'vitest'
import type { Offer, UserProfile } from '../types/food'
import { getRecommendation, matchesProfile } from './recommendations'

const NOBODY: UserProfile = { vegetarian: false, vegan: false, glutenFree: false, onBudget: false, lastCallAlerts: false }

function offer(overrides: Partial<Offer>): Offer {
  return {
    id: 'x', venueId: 'paris.0', venueName: 'Café Test', category: 'cafe', item: 'quiche', diet: 'vegetarian', glutenFree: false,
    lat: 0, lon: 0, status: 'live', currency: 'EUR', originalPrice: 10, price: 6, discountPct: 40, quantityTotal: 5,
    quantityLeft: 3, kgPerPortion: 0.5, pickupFrom: '17:00', pickupUntil: '20:00', minutesToOpen: 0, minutesToClose: 60,
    ...overrides,
  }
}

describe('matchesProfile', () => {
  const cases: Array<[Partial<UserProfile>, Partial<Offer>, boolean]> = [
    [{}, { diet: 'meat' }, true],
    [{ vegetarian: true }, { diet: 'meat' }, false],
    [{ vegetarian: true }, { diet: 'vegetarian' }, true],
    [{ vegetarian: true }, { diet: 'vegan' }, true],
    [{ vegan: true }, { diet: 'vegetarian' }, false],
    [{ vegan: true }, { diet: 'vegan' }, true],
    [{ glutenFree: true }, { glutenFree: false }, false],
    [{ glutenFree: true, vegan: true }, { diet: 'vegan', glutenFree: true }, true],
  ]
  it.each(cases)('profile %o + offer %o → %s', (profile, o, expected) => {
    expect(matchesProfile(offer(o), { ...NOBODY, ...profile })).toBe(expected)
  })
})

describe('getRecommendation', () => {
  it('picks the deepest discount among open offers', () => {
    const offers = [offer({ id: 'a', discountPct: 40 }), offer({ id: 'b', discountPct: 62 }), offer({ id: 'c', discountPct: 55 })]
    const rec = getRecommendation(offers, NOBODY)
    expect(rec.level === 'now' && rec.offer.id).toBe('b')
  })

  it('on a budget, picks the lowest share of the full price', () => {
    const offers = [
      offer({ id: 'cheap', originalPrice: 6, price: 3.5, discountPct: 42 }),
      offer({ id: 'deep', originalPrice: 20, price: 7, discountPct: 65 }),
    ]
    const rec = getRecommendation(offers, { ...NOBODY, onBudget: true })
    expect(rec.level === 'now' && rec.offer.id).toBe('deep')
  })

  it('breaks ties by what closes first', () => {
    const offers = [offer({ id: 'late', minutesToClose: 120 }), offer({ id: 'soon', minutesToClose: 20 })]
    const rec = getRecommendation(offers, NOBODY)
    expect(rec.level === 'now' && rec.offer.id).toBe('soon')
  })

  it('skips sold-out offers and offers outside the diet', () => {
    const offers = [offer({ id: 'gone', quantityLeft: 0, discountPct: 70 }), offer({ id: 'meat', diet: 'meat', discountPct: 69 }), offer({ id: 'ok', discountPct: 31 })]
    const rec = getRecommendation(offers, { ...NOBODY, vegetarian: true })
    expect(rec.level === 'now' && rec.offer.id).toBe('ok')
  })

  it('falls back to the next offer that opens later', () => {
    const offers = [offer({ id: 'later2', status: 'upcoming', minutesToOpen: 200 }), offer({ id: 'later1', status: 'upcoming', minutesToOpen: 30 })]
    const rec = getRecommendation(offers, NOBODY)
    expect(rec.level).toBe('later')
    expect(rec.level === 'later' && rec.offer.id).toBe('later1')
  })

  it('says so when nothing fits', () => {
    expect(getRecommendation([offer({ diet: 'meat' })], { ...NOBODY, vegan: true }).level).toBe('none')
    expect(getRecommendation([], NOBODY).level).toBe('none')
  })
})
