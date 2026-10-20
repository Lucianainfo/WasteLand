import { CITIES } from './catalog.js'
import { formatMinutes, localClock } from './clock.js'
import { currentOffers } from './offers.js'
import { getStore, type Store } from './store.js'

export type CityPulse = 'live' | 'later' | 'closed'

export interface GlobeCity {
  id: string
  name: string
  lat: number
  lon: number
  localTime: string
  currency: string
  /** Offers open for pickup right now, with portions left. */
  liveNow: number
  /** Offers that open later today. */
  upcoming: number
  /** Portions still available tonight, live and upcoming together. */
  portionsLeft: number
  pulse: CityPulse
}

/**
 * Backend logic for GET /api/cities: every partner city with its "pulse" right now. Because
 * venues close on local time, the globe shows last call moving around the world with the evening.
 */
export async function getCities(now = new Date(), store: Store = getStore()): Promise<{ status: 200; body: { cities: GlobeCity[] } }> {
  const cities = await Promise.all(CITIES.map(async (city) => {
    const offers = (await currentOffers(city, now, store)).filter((o) => o.quantityLeft > 0)
    const liveNow = offers.filter((o) => o.status === 'live').length
    const upcoming = offers.length - liveNow
    return {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      localTime: formatMinutes(localClock(city.tz, now).minutes),
      currency: city.currency,
      liveNow,
      upcoming,
      portionsLeft: offers.reduce((sum, o) => sum + o.quantityLeft, 0),
      pulse: (liveNow > 0 ? 'live' : upcoming > 0 ? 'later' : 'closed') as CityPulse,
    }
  }))
  return { status: 200, body: { cities } }
}
