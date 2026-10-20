import { describe, expect, it } from 'vitest'
import { CITIES } from './catalog.js'
import { addDays, formatMinutes, localClock } from './clock.js'
import { getCities } from './getCities.js'
import { getEvening } from './getEvening.js'
import { getHistory } from './getHistory.js'
import { createMemoryStore } from './store.js'

const NOW = new Date('2026-10-18T16:00:00Z')

describe('clock helpers', () => {
  it('reads the wall clock of a time zone', async () => {
    expect(localClock('Europe/Bucharest', NOW)).toEqual({ date: '2026-10-18', minutes: 19 * 60 })
    expect(localClock('Asia/Tokyo', NOW)).toEqual({ date: '2026-10-19', minutes: 60 })
    expect(localClock('America/New_York', NOW)).toEqual({ date: '2026-10-18', minutes: 12 * 60 })
  })

  it('formats minutes and shifts dates across month boundaries', async () => {
    expect(formatMinutes(1170)).toBe('19:30')
    expect(formatMinutes(0)).toBe('00:00')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
  })
})

describe('getHistory', () => {
  it('validates the city like the other endpoints', async () => {
    expect(getHistory(null, NOW).status).toBe(400)
    expect(getHistory('Atlantis', NOW).status).toBe(404)
  })

  it('returns the seven finished days before today, oldest first', async () => {
    const result = getHistory('Bucharest', NOW)
    if (result.status !== 200) throw new Error('expected 200')
    const dates = result.body.days.map((d) => d.date)
    expect(dates).toEqual(['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'])
    expect(result.body.days.every((d) => d.meals > 0 && d.kg > 0)).toBe(true)
  })

  it('does not change a finished day when asked again later', async () => {
    const first = getHistory('Paris', NOW)
    const later = getHistory('Paris', new Date('2026-10-18T20:00:00Z'))
    if (first.status !== 200 || later.status !== 200) throw new Error('expected 200')
    expect(later.body.days).toEqual(first.body.days)
  })
})

describe('getEvening', () => {
  it('covers every hour from now until midnight, local time', async () => {
    const result = await getEvening('Bucharest', NOW, createMemoryStore())
    if (result.status !== 200) throw new Error('expected 200')
    expect(result.body.hours.map((h) => h.hour)).toEqual([19, 20, 21, 22, 23])
    expect(result.body.hours[0].label).toBe('19:00')
  })

  it('only includes open offers that still have portions', async () => {
    const result = await getEvening('New York', NOW, createMemoryStore())
    if (result.status !== 200) throw new Error('expected 200')
    expect(result.body.hours).toHaveLength(12)
    expect(result.body.hours.every((h) => h.offers.every((o) => o.quantityLeft > 0))).toBe(true)
    // Restaurants are open in the evening, not at noon.
    expect(result.body.hours.at(-2)!.offers.some((o) => o.category === 'restaurant')).toBe(true)
    expect(result.body.hours[0].offers.some((o) => o.category === 'restaurant')).toBe(false)
  })
})

describe('getCities', () => {
  it('lists every partner city with its local time and pulse', async () => {
    const { body } = await getCities(NOW, createMemoryStore())
    expect(body.cities).toHaveLength(CITIES.length)
    const bucharest = body.cities.find((c) => c.id === 'bucharest')!
    expect(bucharest.localTime).toBe('19:00')
    expect(bucharest.pulse).toBe('live')
    expect(bucharest.liveNow).toBeGreaterThan(0)
  })

  it('shows a city where it is night as closed or opening later — never live', async () => {
    const tokyo = (await getCities(NOW, createMemoryStore())).body.cities.find((c) => c.id === 'tokyo')!
    expect(tokyo.liveNow).toBe(0)
    expect(tokyo.pulse).not.toBe('live')
  })
})
