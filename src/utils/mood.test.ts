import { describe, expect, it } from 'vitest'
import { lerp, paramsForEvening } from './mood'

describe('paramsForEvening', () => {
  it('is calm before any city is chosen', () => {
    expect(paramsForEvening(null, false).count).toBe(34)
  })

  it('grows denser and faster with more open offers, up to a cap', () => {
    const quiet = paramsForEvening(1, false)
    const busy = paramsForEvening(8, false)
    expect(busy.count).toBeGreaterThan(quiet.count)
    expect(busy.speed).toBeGreaterThan(quiet.speed)
    expect(paramsForEvening(500, false)).toEqual(paramsForEvening(10, false))
  })

  it('warms toward copper and quickens at last call', () => {
    const normal = paramsForEvening(5, false)
    const lastCall = paramsForEvening(5, true)
    expect(lastCall.rgb[2]).toBeLessThan(normal.rgb[2])
    expect(lastCall.breathSeconds).toBeLessThan(normal.breathSeconds)
    expect(lastCall.count).toBe(normal.count)
  })
})

describe('lerp', () => {
  it('interpolates between two values', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5)
  })
})
