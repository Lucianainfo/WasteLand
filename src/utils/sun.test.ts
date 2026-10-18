import { describe, expect, it } from 'vitest'
import { angleDelta, antisolarPoint, subsolarPoint } from './sun'

describe('subsolarPoint', () => {
  it('puts the sun over the Greenwich meridian at noon UTC', () => {
    expect(subsolarPoint(new Date('2026-03-20T12:00:00Z'))[0]).toBeCloseTo(0, 5)
  })

  it('moves the sun 15° west every hour', () => {
    expect(subsolarPoint(new Date('2026-03-20T13:00:00Z'))[0]).toBeCloseTo(-15, 5)
    expect(subsolarPoint(new Date('2026-03-20T00:00:00Z'))[0]).toBeCloseTo(-180, 5)
  })

  it('follows the seasons: north in June, south in December, near the equator at the equinoxes', () => {
    expect(subsolarPoint(new Date('2026-06-21T12:00:00Z'))[1]).toBeGreaterThan(23)
    expect(subsolarPoint(new Date('2026-12-21T12:00:00Z'))[1]).toBeLessThan(-23)
    expect(Math.abs(subsolarPoint(new Date('2026-03-20T12:00:00Z'))[1])).toBeLessThan(2)
  })
})

describe('antisolarPoint', () => {
  it('is on the opposite side of the planet', () => {
    const date = new Date('2026-06-21T12:00:00Z')
    const [lon, lat] = subsolarPoint(date)
    const [nightLon, nightLat] = antisolarPoint(date)
    expect(Math.abs(angleDelta(lon, nightLon))).toBeCloseTo(180, 5)
    expect(nightLat).toBeCloseTo(-lat, 5)
  })
})
