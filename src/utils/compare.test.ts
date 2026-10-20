import { describe, expect, it } from 'vitest'
import type { CityOffers, Offer } from '../types/food'
import { barWidths, compareCities, summarize, type CitySummary } from './compare'

function offer(o: Partial<Offer>): Offer {
  return {
    id: 'x', venueId: 'a.0', venueName: 'V', category: 'bakery', item: 'baguettes', diet: 'vegan', glutenFree: false, lat: 0, lon: 0, source: 'demo',
    status: 'live', currency: 'EUR', originalPrice: 4, price: 2, discountPct: 50, quantityTotal: 6, quantityLeft: 2, kgPerPortion: 0.5,
    pickupFrom: '17:00', pickupUntil: '20:00', minutesToOpen: 0, minutesToClose: 60, ...o,
  }
}

const city = { id: 'a', name: 'A', country: 'X', lat: 0, lon: 0, currency: 'EUR', localTime: '18:00' }

describe('summarize', () => {
  it('adds up portions and kg, and averages the discount of open offers only', () => {
    const data: CityOffers = {
      city,
      offers: [
        offer({ quantityLeft: 2, kgPerPortion: 0.5, discountPct: 40 }),
        offer({ quantityLeft: 4, kgPerPortion: 1, discountPct: 60 }),
        offer({ status: 'upcoming', quantityLeft: 3, kgPerPortion: 1, discountPct: 30 }),
        offer({ quantityLeft: 0, kgPerPortion: 9, discountPct: 70 }),
      ],
    }
    expect(summarize(data)).toEqual({ portionsTonight: 9, liveNow: 2, avgDiscount: 50, kgTonight: 8, co2Tonight: 20 })
  })

  it('handles a city with nothing open', () => {
    expect(summarize({ city, offers: [] })).toEqual({ portionsTonight: 0, liveNow: 0, avgDiscount: 0, kgTonight: 0, co2Tonight: 0 })
  })
})

describe('compareCities', () => {
  const base: CitySummary = { portionsTonight: 0, liveNow: 0, avgDiscount: 0, kgTonight: 0, co2Tonight: 0 }

  it('picks the city with more food left to rescue', () => {
    expect(compareCities({ ...base, kgTonight: 10 }, { ...base, kgTonight: 5 })).toEqual({ winner: 'a', pct: 50 })
    expect(compareCities({ ...base, kgTonight: 2 }, { ...base, kgTonight: 8 })).toEqual({ winner: 'b', pct: 75 })
  })

  it('calls a tie when both are equal', () => {
    expect(compareCities(base, base)).toEqual({ winner: 'tie', pct: 0 })
  })
})

describe('barWidths', () => {
  it('scales both bars to the larger value', () => {
    expect(barWidths(5, 10)).toEqual([50, 100])
    expect(barWidths(0, 0)).toEqual([0, 0])
  })
})
