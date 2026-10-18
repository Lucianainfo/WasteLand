import { describe, expect, it } from 'vitest'
import { BAG_KG, CO2E_PER_KG, computeImpact, RESCUE_ROUTINE, ZERO_ROUTINE } from './impact'

describe('computeImpact', () => {
  it('is all zeros for an empty routine', () => {
    const r = computeImpact(ZERO_ROUTINE)
    expect(r).toMatchObject({ kgPerYear: 0, co2KgPerYear: 0, waterLitresPerYear: 0, eurSavedPerYear: 0, trees: 0 })
    expect(r.breakdown).toEqual({ bags: 0, pastries: 0, groceries: 0 })
  })

  it('turns one bag a week into a year of rescued food and avoided CO2e', () => {
    const r = computeImpact({ ...ZERO_ROUTINE, bagsPerWeek: 1 })
    expect(r.kgPerYear).toBe(Math.round(52 * BAG_KG))
    expect(r.co2KgPerYear).toBe(Math.round(52 * BAG_KG * CO2E_PER_KG))
    expect(r.eurSavedPerYear).toBe(312)
  })

  it('multiplies the food rescued by the number of people following the routine', () => {
    const alone = computeImpact({ ...RESCUE_ROUTINE, friends: 0 })
    const withThree = computeImpact({ ...RESCUE_ROUTINE, friends: 3 })
    expect(Math.abs(withThree.kgPerYear - alone.kgPerYear * 4)).toBeLessThanOrEqual(2)
  })

  it('keeps the money saved personal, since friends save their own money', () => {
    expect(computeImpact({ ...RESCUE_ROUTINE, friends: 5 }).eurSavedPerYear).toBe(computeImpact({ ...RESCUE_ROUTINE, friends: 0 }).eurSavedPerYear)
  })

  it('has a breakdown that adds up to 1', () => {
    const { breakdown } = computeImpact(RESCUE_ROUTINE)
    expect(breakdown.bags + breakdown.pastries + breakdown.groceries).toBeCloseTo(1, 6)
  })

  it('rounds trees up, since part of a tree is still a tree to plant', () => {
    expect(computeImpact({ ...ZERO_ROUTINE, pastriesPerWeek: 1 }).trees).toBe(1)
  })
})
