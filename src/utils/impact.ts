/**
 * Every factor behind the impact figures, in one place, with its source — shown to the
 * user in "How is this calculated?" so no number is presented without a reason.
 */

/** kg CO2e per kg of food wasted: 3.3 Gt CO2e for 1.3 Gt of food (FAO, Food Wastage Footprint, 2013). */
export const CO2E_PER_KG = 2.5
/** Litres of water per kg of food wasted: 250 km³ for 1.3 Gt (FAO, 2013). */
export const WATER_L_PER_KG = 190
/** kg of CO2 absorbed by one mature tree in a year (rounded commonly-used estimate). */
export const TREE_KG_CO2_PER_YEAR = 21
/** Household food waste per person per year, world average (UNEP Food Waste Index Report 2024). */
export const HOUSEHOLD_WASTE_KG_PER_YEAR = 79

/** A typical rescued bag/box and pastry, and what each is worth at full price (EUR). */
export const BAG_KG = 0.9
export const BAG_VALUE_EUR = 12
export const PASTRY_KG = 0.1
export const PASTRY_VALUE_EUR = 2.5
export const GROCERY_VALUE_EUR_PER_KG = 4
/** Average last-call discount across a pickup window (30% → 70%). */
export const AVERAGE_DISCOUNT = 0.5

export interface ImpactInput {
  bagsPerWeek: number
  pastriesPerWeek: number
  groceryKgPerMonth: number
  /** Friends who adopt the same routine — each one adds another person's worth of rescued food. */
  friends: number
}

export interface ImpactResult {
  kgPerYear: number
  co2KgPerYear: number
  waterLitresPerYear: number
  eurSavedPerYear: number
  trees: number
  /** Share of the food per kind, for the breakdown bar. */
  breakdown: { bags: number; pastries: number; groceries: number }
}

export const ZERO_ROUTINE: ImpactInput = { bagsPerWeek: 0, pastriesPerWeek: 0, groceryKgPerMonth: 0, friends: 0 }
export const RESCUE_ROUTINE: ImpactInput = { bagsPerWeek: 2, pastriesPerWeek: 3, groceryKgPerMonth: 4, friends: 1 }

export function computeImpact(input: ImpactInput): ImpactResult {
  const people = 1 + Math.max(0, input.friends)
  const bagsKg = input.bagsPerWeek * 52 * BAG_KG
  const pastriesKg = input.pastriesPerWeek * 52 * PASTRY_KG
  const groceriesKg = input.groceryKgPerMonth * 12
  const personalKg = bagsKg + pastriesKg + groceriesKg
  const kgPerYear = personalKg * people
  const co2KgPerYear = kgPerYear * CO2E_PER_KG

  // Money saved stays personal: each friend saves their own.
  const fullValue = input.bagsPerWeek * 52 * BAG_VALUE_EUR + input.pastriesPerWeek * 52 * PASTRY_VALUE_EUR + groceriesKg * GROCERY_VALUE_EUR_PER_KG

  return {
    kgPerYear: Math.round(kgPerYear),
    co2KgPerYear: Math.round(co2KgPerYear),
    waterLitresPerYear: Math.round(kgPerYear * WATER_L_PER_KG),
    eurSavedPerYear: Math.round(fullValue * AVERAGE_DISCOUNT),
    trees: Math.ceil(co2KgPerYear / TREE_KG_CO2_PER_YEAR),
    breakdown: {
      bags: personalKg ? bagsKg / personalKg : 0,
      pastries: personalKg ? pastriesKg / personalKg : 0,
      groceries: personalKg ? groceriesKg / personalKg : 0,
    },
  }
}
