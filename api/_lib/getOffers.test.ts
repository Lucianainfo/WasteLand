import { describe, expect, it } from 'vitest'
import { findCity } from './catalog.js'
import { getOffers } from './getOffers.js'
import { buildOffersAt } from './offers.js'
import { WINDOW_MINUTES } from './pricing.js'
import { createMemoryStore } from './store.js'

// 16:00 UTC on 18 Oct 2026 is 19:00 in Bucharest (UTC+3) and 01:00 the next day in Tokyo.
const NOW = new Date('2026-10-18T16:00:00Z')
const none = () => 0

describe('getOffers', () => {
  it('returns 400 when the city parameter is missing or blank', async () => {
    expect((await getOffers(null, NOW, createMemoryStore())).status).toBe(400)
    expect((await getOffers('   ', NOW, createMemoryStore())).status).toBe(400)
  })

  it('returns 404 with the list of covered cities for an unknown city', async () => {
    const result = await getOffers('Atlantis', NOW, createMemoryStore())
    expect(result.status).toBe(404)
    if (result.status === 404) expect(result.body.available).toContain('Bucharest')
  })

  it('reports the local time of the city, not of the server', async () => {
    const bucharest = await getOffers('Bucharest', NOW, createMemoryStore())
    const tokyo = await getOffers('Tokyo', NOW, createMemoryStore())
    if (bucharest.status !== 200 || tokyo.status !== 200) throw new Error('expected 200')
    expect(bucharest.body.city.localTime).toBe('19:00')
    expect(tokyo.body.city.localTime).toBe('01:00')
  })

  it('never lists closed slots, and lists open ones before upcoming ones', async () => {
    const result = await getOffers('Bucharest', NOW, createMemoryStore())
    if (result.status !== 200) throw new Error('expected 200')
    const statuses = result.body.offers.map((o) => o.status)
    expect(statuses).not.toContain('closed')
    expect(statuses.indexOf('upcoming') === -1 || statuses.lastIndexOf('live') < statuses.indexOf('upcoming')).toBe(true)
  })

  it('is empty after every venue has closed for the night', async () => {
    const result = await getOffers('Tokyo', NOW, createMemoryStore())
    if (result.status !== 200) throw new Error('expected 200')
    expect(result.body.offers.every((o) => o.status === 'upcoming')).toBe(true)
  })
})

describe('buildOffersAt', () => {
  const city = findCity('paris')!

  it('marks a slot upcoming, live and closed as the evening goes on', async () => {
    const offer = buildOffersAt(city, '2026-10-18', 0, none)[0]
    const close = Number(offer.pickupUntil.slice(0, 2)) * 60 + Number(offer.pickupUntil.slice(3))
    const at = (minutes: number) => buildOffersAt(city, '2026-10-18', minutes, none).find((o) => o.id === offer.id)!
    expect(at(close - WINDOW_MINUTES - 1).status).toBe('upcoming')
    expect(at(close - WINDOW_MINUTES).status).toBe('live')
    expect(at(close - 1).status).toBe('live')
    expect(at(close).status).toBe('closed')
  })

  it('gets cheaper and emptier as closing time approaches', async () => {
    const first = buildOffersAt(city, '2026-10-18', 0, none)[0]
    const close = Number(first.pickupUntil.slice(0, 2)) * 60 + Number(first.pickupUntil.slice(3))
    const early = buildOffersAt(city, '2026-10-18', close - WINDOW_MINUTES + 5, none)[0]
    const late = buildOffersAt(city, '2026-10-18', close - 5, none)[0]
    expect(late.discountPct).toBeGreaterThan(early.discountPct)
    expect(late.price).toBeLessThan(early.price)
    expect(late.quantityLeft).toBeLessThanOrEqual(early.quantityLeft)
  })

  it('subtracts reserved portions and never goes below zero', async () => {
    const base = buildOffersAt(city, '2026-10-18', 18 * 60, none)
    const target = base[0]
    const reserved = buildOffersAt(city, '2026-10-18', 18 * 60, (id) => (id === target.id ? 1 : 0))[0]
    expect(reserved.quantityLeft).toBe(Math.max(0, target.quantityLeft - 1))
    const flooded = buildOffersAt(city, '2026-10-18', 18 * 60, () => 999)
    expect(flooded.every((o) => o.quantityLeft === 0)).toBe(true)
  })

  it('prices in the local currency', async () => {
    const tokyo = buildOffersAt(findCity('tokyo')!, '2026-10-18', 18 * 60, none)
    expect(tokyo.every((o) => o.currency === 'JPY' && o.originalPrice >= 100)).toBe(true)
  })

  it('is identical for every request on the same day', async () => {
    expect(buildOffersAt(city, '2026-10-18', 1100, none)).toEqual(buildOffersAt(city, '2026-10-18', 1100, none))
  })
})
