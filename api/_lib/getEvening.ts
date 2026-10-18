import type { Category, Diet } from './catalog.js'
import { formatMinutes, localClock } from './clock.js'
import { cityInfo, resolveCity, type ApiOutcome, type CityInfo } from './getOffers.js'
import { buildOffersAt, type ReservedLookup } from './offers.js'
import { reservedUnits } from './reservations.js'

/** A trimmed-down offer: just what the planner needs to score an hour. */
export interface SlotOffer {
  category: Category
  diet: Diet
  glutenFree: boolean
  discountPct: number
  price: number
  quantityLeft: number
}

export interface EveningHour {
  /** Local hour, 0–23. */
  hour: number
  label: string
  offers: SlotOffer[]
}

/**
 * The rest of today, hour by hour: which offers will be open at half past each hour and
 * how deep their discount will be by then. The planner on the profile page turns this into
 * "the best time to go" for the user's diet and budget.
 */
export function eveningHours(cityTz: string, build: (minutes: number) => ReturnType<typeof buildOffersAt>, now: Date): EveningHour[] {
  const clock = localClock(cityTz, now)
  const firstHour = Math.floor(clock.minutes / 60)
  const hours: EveningHour[] = []
  for (let hour = firstHour; hour <= 23; hour++) {
    const minute = hour === firstHour ? clock.minutes : hour * 60 + 30
    const offers = build(minute)
      .filter((o) => o.status === 'live' && o.quantityLeft > 0)
      .map(({ category, diet, glutenFree, discountPct, price, quantityLeft }) => ({ category, diet, glutenFree, discountPct, price, quantityLeft }))
    hours.push({ hour, label: formatMinutes(hour * 60), offers })
  }
  return hours
}

/** Backend logic for GET /api/evening?city=... */
export function getEvening(
  query: string | null,
  now = new Date(),
  reserved: ReservedLookup = reservedUnits
): ApiOutcome<{ city: CityInfo; hours: EveningHour[] }> {
  const resolved = resolveCity(query)
  if (!resolved.ok) return resolved.outcome
  const { city } = resolved
  const date = localClock(city.tz, now).date
  const hours = eveningHours(city.tz, (minutes) => buildOffersAt(city, date, minutes, reserved), now)
  return { status: 200, body: { city: cityInfo(city, now), hours } }
}
