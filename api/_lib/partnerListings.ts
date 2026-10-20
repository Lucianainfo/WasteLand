import { createHash, randomBytes } from 'node:crypto'
import { findCity, ITEMS, type Category, type ItemKey } from './catalog.js'
import { localClock } from './clock.js'
import type { ApiOutcome } from './getOffers.js'
import { buildPartnerOffer, type Offer } from './offers.js'
import { getStore, type PartnerListing, type Store } from './store.js'

export const MAX_PORTIONS = 20
/** A listing must close at least this long after it is created, so someone has time to collect it. */
export const MIN_MINUTES_BEFORE_CLOSE = 15
/** Anti-spam limits: listings per city per day, and new listings per visitor per hour. */
export const MAX_LISTINGS_PER_CITY = 25
export const MAX_LISTINGS_PER_HOUR = 5
/** A partner's full price may be at most this many times the catalogue price for the item. */
export const MAX_PRICE_FACTOR = 4

const CATEGORIES: Category[] = ['bakery', 'cafe', 'restaurant', 'patisserie', 'grocery']
/** Letters in any alphabet, digits, spaces and a little punctuation — no links, no markup. */
const VENUE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’&.,-]{1,39}$/u
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface CreatedListing {
  listing: Omit<PartnerListing, 'tokenHash'>
  /** Secret the partner keeps to remove the listing later. Shown once, never stored in clear. */
  token: string
  /** How the listing looks to customers right now. */
  offer: Offer
}

/**
 * Backend logic for POST /api/partner: a restaurant lists tonight's surplus. Everything is
 * validated on the server — the city, a plain-text venue name, an item from the catalogue
 * (so diet and gluten labels are always right), the portions, a sensible price and a closing
 * time later today — and the listing is then priced by the same last-call curve as every offer.
 */
export async function createListing(body: unknown, clientKey: string, now = new Date(), store: Store = getStore()): Promise<ApiOutcome<CreatedListing>> {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>

  const city = typeof input.city === 'string' ? findCity(input.city) : null
  if (!city) return { status: 400, body: { error: 'Unknown city' } }

  const venueName = typeof input.venueName === 'string' ? input.venueName.trim().replace(/\s+/g, ' ') : ''
  if (!VENUE_NAME.test(venueName)) return { status: 400, body: { error: 'Venue name: 2–40 letters, digits and simple punctuation' } }

  const category = input.category as Category
  if (!CATEGORIES.includes(category)) return { status: 400, body: { error: 'Unknown category' } }

  const item = input.item as ItemKey
  if (typeof item !== 'string' || !(item in ITEMS) || ITEMS[item].category !== category) {
    return { status: 400, body: { error: 'Choose an item from this category' } }
  }

  const portions = input.portions
  if (typeof portions !== 'number' || !Number.isInteger(portions) || portions < 1 || portions > MAX_PORTIONS) {
    return { status: 400, body: { error: `Portions must be a whole number from 1 to ${MAX_PORTIONS}` } }
  }

  const maxPrice = ITEMS[item].baseEur * city.rate * MAX_PRICE_FACTOR
  const originalPrice = input.originalPrice
  if (typeof originalPrice !== 'number' || !Number.isFinite(originalPrice) || originalPrice <= 0 || originalPrice > maxPrice) {
    return { status: 400, body: { error: 'Enter a realistic full price' } }
  }

  const time = typeof input.closeTime === 'string' ? TIME.exec(input.closeTime) : null
  if (!time) return { status: 400, body: { error: 'Closing time must look like 21:30' } }
  const closeMinutes = Number(time[1]) * 60 + Number(time[2])
  const clock = localClock(city.tz, now)
  if (closeMinutes < clock.minutes + MIN_MINUTES_BEFORE_CLOSE) {
    return { status: 400, body: { error: `Closing time must be at least ${MIN_MINUTES_BEFORE_CLOSE} minutes from now, later today` } }
  }

  if (!(await store.allow(`partner:${clientKey}`, MAX_LISTINGS_PER_HOUR, 3600))) {
    return { status: 429, body: { error: 'Too many listings from this connection. Try again in an hour.' } }
  }
  if ((await store.listings(city.id, clock.date)).length >= MAX_LISTINGS_PER_CITY) {
    return { status: 409, body: { error: 'This city has reached tonight’s listing limit' } }
  }

  const token = randomBytes(18).toString('base64url')
  const listing: PartnerListing = {
    id: `${city.id}.p.${randomBytes(6).toString('hex')}.${clock.date}`,
    cityId: city.id,
    date: clock.date,
    venueName,
    category,
    item,
    portions,
    originalPrice: Math.round(originalPrice * 100) / 100,
    closeMinutes,
    createdAt: now.getTime(),
    tokenHash: hashToken(token),
  }
  await store.saveListing(listing)

  const { tokenHash: _secret, ...publicListing } = listing
  void _secret
  return { status: 200, body: { listing: publicListing, token, offer: buildPartnerOffer(listing, city, clock.minutes) } }
}

/** Backend logic for DELETE /api/partner: removes a listing — only with the token given when it was created. */
export async function removeListing(body: unknown, store: Store = getStore()): Promise<ApiOutcome<{ removed: true }>> {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const { id, token } = input
  if (typeof id !== 'string' || typeof token !== 'string') return { status: 400, body: { error: 'Missing "id" or "token"' } }

  const [cityId, marker, , date] = id.split('.')
  const city = findCity(cityId)
  if (!city || marker !== 'p' || !date) return { status: 404, body: { error: 'Listing not found' } }

  const listing = (await store.listings(city.id, date)).find((l) => l.id === id)
  if (!listing) return { status: 404, body: { error: 'Listing not found' } }
  if (listing.tokenHash !== hashToken(token)) return { status: 403, body: { error: 'Wrong token' } }

  await store.deleteListing(listing)
  return { status: 200, body: { removed: true } }
}
