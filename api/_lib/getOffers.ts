import { CITIES, findCity, type City } from './catalog.js'
import { formatMinutes, localClock } from './clock.js'
import { currentOffers, type Offer } from './offers.js'
import { getStore, type Store } from './store.js'

export interface CityInfo {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  currency: string
  /** Local wall-clock time in the city when the response was built, e.g. "18:42". */
  localTime: string
}

export interface OffersResult {
  city: CityInfo
  offers: Offer[]
}

export type ApiOutcome<T> =
  | { status: 200; body: T }
  | { status: 400 | 403 | 404 | 405 | 409 | 410 | 429 | 500; body: { error: string; available?: string[] } }

export function cityInfo(city: City, now: Date): CityInfo {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    lat: city.lat,
    lon: city.lon,
    currency: city.currency,
    localTime: formatMinutes(localClock(city.tz, now).minutes),
  }
}

/** Validates the "city" query parameter; on failure, says which cities the network covers. */
export function resolveCity(query: string | null): { ok: true; city: City } | { ok: false; outcome: ApiOutcome<never> } {
  if (!query || !query.trim()) {
    return { ok: false, outcome: { status: 400, body: { error: 'Missing "city" parameter' } } }
  }
  const city = findCity(query)
  if (!city) {
    return {
      ok: false,
      outcome: { status: 404, body: { error: 'No partner venues in this city yet', available: CITIES.map((c) => c.name) } },
    }
  }
  return { ok: true, city }
}

/**
 * Backend logic for GET /api/offers?city=...: tonight's surplus listings, priced on the server.
 * Prices are never computed in the browser, so nobody can edit a request to pay less than the
 * real last-call price. Shared by the serverless function and the local dev middleware.
 */
export async function getOffers(query: string | null, now = new Date(), store: Store = getStore()): Promise<ApiOutcome<OffersResult>> {
  const resolved = resolveCity(query)
  if (!resolved.ok) return resolved.outcome
  const { city } = resolved
  return { status: 200, body: { city: cityInfo(city, now), offers: await currentOffers(city, now, store) } }
}
