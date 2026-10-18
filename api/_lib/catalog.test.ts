import { describe, expect, it } from 'vitest'
import { CITIES, findCity, ITEMS, itemsFor, venuesFor } from './catalog.js'

describe('findCity', () => {
  it('finds a city by id, English name, local name and Romanian/Russian alias', () => {
    expect(findCity('bucharest')?.id).toBe('bucharest')
    expect(findCity('București')?.id).toBe('bucharest')
    expect(findCity('Chişinău')?.id).toBe('chisinau')
    expect(findCity('Кишинёв')?.id).toBe('chisinau')
    expect(findCity('Londra')?.id).toBe('london')
    expect(findCity('new-york')?.id).toBe('new-york')
    expect(findCity('  NEW YORK ')?.id).toBe('new-york')
  })

  it('ignores a trailing country after a comma', () => {
    expect(findCity('Paris, France')?.id).toBe('paris')
  })

  it('returns null for unknown, empty or missing input', () => {
    expect(findCity('Atlantis')).toBeNull()
    expect(findCity('   ')).toBeNull()
    expect(findCity(null)).toBeNull()
  })
})

describe('venuesFor', () => {
  it('gives every city the same mix of eight venues', () => {
    for (const city of CITIES) {
      const venues = venuesFor(city)
      expect(venues).toHaveLength(8)
      expect(venues.filter((v) => v.category === 'bakery')).toHaveLength(2)
    }
  })

  it('is deterministic — the same city always has the same venues', () => {
    const city = CITIES[0]
    expect(venuesFor(city)).toEqual(venuesFor(city))
  })

  it('never repeats a venue name inside a city', () => {
    for (const city of CITIES) {
      const names = venuesFor(city).map((v) => v.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it('places venues close to the city centre', () => {
    for (const city of CITIES) {
      for (const venue of venuesFor(city)) {
        expect(Math.abs(venue.lat - city.lat)).toBeLessThan(0.05)
        expect(Math.abs(venue.lon - city.lon)).toBeLessThan(0.05)
      }
    }
  })
})

describe('catalogue', () => {
  it('has at least one vegan and one gluten-free item in every category', () => {
    for (const category of ['bakery', 'cafe', 'restaurant', 'grocery'] as const) {
      const keys = itemsFor(category)
      expect(keys.some((k) => ITEMS[k].diet === 'vegan')).toBe(true)
      expect(keys.some((k) => ITEMS[k].glutenFree)).toBe(true)
    }
  })
})
