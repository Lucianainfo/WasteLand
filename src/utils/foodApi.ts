import type { Category, CityInfo, CityOffers, CreatedListing, EveningHour, GlobeCity, HistoryDay, ItemKey, Reservation } from '../types/food'

export type FetchFailure = { ok: false; reason: 'notFound' | 'generic'; available?: string[] }
export type FetchResult<T> = { ok: true; data: T } | FetchFailure

async function getJson<T>(url: string): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url)
    if (res.status === 404) {
      const body = (await res.json().catch(() => ({}))) as { available?: string[] }
      return { ok: false, reason: 'notFound', available: body.available }
    }
    if (!res.ok) return { ok: false, reason: 'generic' }
    return { ok: true, data: (await res.json()) as T }
  } catch {
    return { ok: false, reason: 'generic' }
  }
}

/** Tonight's offers for a city — priced by our own backend, never in the browser. */
export function fetchOffers(city: string): Promise<FetchResult<CityOffers>> {
  return getJson<CityOffers>(`/api/offers?city=${encodeURIComponent(city)}`)
}

/** The last seven finished days for a city, or null if they can't be loaded. */
export async function fetchHistory(city: string): Promise<HistoryDay[] | null> {
  const result = await getJson<{ days: HistoryDay[] }>(`/api/offer-history?city=${encodeURIComponent(city)}`)
  return result.ok ? result.data.days : null
}

/** The rest of today, hour by hour. */
export function fetchEvening(city: string): Promise<FetchResult<{ city: CityInfo; hours: EveningHour[] }>> {
  return getJson(`/api/evening?city=${encodeURIComponent(city)}`)
}

/** Every partner city with its pulse right now, or null if they can't be loaded. */
export async function fetchCities(): Promise<GlobeCity[] | null> {
  const result = await getJson<{ cities: GlobeCity[] }>('/api/cities')
  return result.ok ? result.data.cities : null
}

export type ReserveResult =
  | { ok: true; data: Reservation }
  | { ok: false; reason: 'soldOut' | 'expired' | 'generic'; message?: string }

/** Sends only the offer id and quantity — the server decides the price. */
export async function reserve(offerId: string, quantity: number): Promise<ReserveResult> {
  try {
    const res = await fetch('/api/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, quantity }),
    })
    if (res.ok) return { ok: true, data: (await res.json()) as Reservation }
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    if (res.status === 409) return { ok: false, reason: 'soldOut', message: body.error }
    if (res.status === 410) return { ok: false, reason: 'expired' }
    return { ok: false, reason: 'generic' }
  } catch {
    return { ok: false, reason: 'generic' }
  }
}

export interface NewListing {
  city: string
  venueName: string
  category: Category
  item: ItemKey
  portions: number
  originalPrice: number
  closeTime: string
}

export type CreateListingResult =
  | { ok: true; data: CreatedListing }
  | { ok: false; reason: 'invalid' | 'rate' | 'full' | 'generic'; message?: string }

/** Publishes a venue's surplus. The server validates everything and decides the price. */
export async function createListing(listing: NewListing): Promise<CreateListingResult> {
  try {
    const res = await fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(listing) })
    if (res.ok) return { ok: true, data: (await res.json()) as CreatedListing }
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    if (res.status === 400) return { ok: false, reason: 'invalid', message: body.error }
    if (res.status === 429) return { ok: false, reason: 'rate' }
    if (res.status === 409) return { ok: false, reason: 'full' }
    return { ok: false, reason: 'generic' }
  } catch {
    return { ok: false, reason: 'generic' }
  }
}

/** Removes a listing with the secret token received when it was created. */
export async function deleteListing(id: string, token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/partner', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token }) })
    return res.ok || res.status === 404
  } catch {
    return false
  }
}
