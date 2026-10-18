import { ITEMS, venuesFor, type City } from './catalog.js'
import { addDays, localClock } from './clock.js'
import { resolveCity, type ApiOutcome } from './getOffers.js'
import { batchFor } from './offers.js'
import { seededRandom } from './random.js'

export interface HistoryDay {
  date: string
  meals: number
  kg: number
}

/** Portions of one finished slot that were rescued instead of thrown away (between 60% and 95% of the batch). */
function rescuedFromBatch(quantity: number, seed: string): number {
  const rand = seededRandom(seed)
  return Math.round(quantity * (0.6 + 0.35 * rand()))
}

/** Sums one finished day across every venue and slot of a city. */
export function dayTotals(city: City, date: string): HistoryDay {
  let meals = 0
  let kg = 0
  for (const venue of venuesFor(city)) {
    venue.closeMinutes.forEach((_, slot) => {
      const { item, quantity } = batchFor(venue, slot, date)
      const rescued = rescuedFromBatch(quantity, `rescued|${venue.id}|${slot}|${date}`)
      meals += rescued
      kg += rescued * ITEMS[item].kg
    })
  }
  return { date, meals, kg: Number(kg.toFixed(1)) }
}

/** The last seven finished days in the city's own calendar, oldest first. */
export function lastSevenDays(city: City, now: Date): HistoryDay[] {
  const today = localClock(city.tz, now).date
  return Array.from({ length: 7 }, (_, i) => dayTotals(city, addDays(today, i - 7)))
}

/** Backend logic for GET /api/offer-history?city=... */
export function getHistory(query: string | null, now = new Date()): ApiOutcome<{ days: HistoryDay[] }> {
  const resolved = resolveCity(query)
  if (!resolved.ok) return resolved.outcome
  return { status: 200, body: { days: lastSevenDays(resolved.city, now) } }
}
