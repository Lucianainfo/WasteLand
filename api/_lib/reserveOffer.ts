import { findCity } from './catalog.js'
import { localClock } from './clock.js'
import type { ApiOutcome } from './getOffers.js'
import { loadOffersAt } from './offers.js'
import { getStore, type Store } from './store.js'

export const MAX_UNITS_PER_RESERVATION = 4

export interface Reservation {
  code: string
  offerId: string
  venueName: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  originalTotal: number
  currency: string
  pickupFrom: string
  pickupUntil: string
  kg: number
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Five random characters from an alphabet without look-alikes (no 0/O, 1/I). */
function pickupCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return `WL-${[...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`
}

/**
 * Backend logic for POST /api/reserve. The browser only sends *which* offer and *how many*;
 * the price is recomputed here from the server clock, so the amount on the pickup ticket is
 * always the real current last-call price, never a number sent by the client. The portions are
 * taken with an atomic database operation, so two people can't both reserve the last one.
 */
export async function reserveOffer(body: unknown, now = new Date(), store: Store = getStore()): Promise<ApiOutcome<Reservation>> {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const { offerId, quantity } = input

  if (typeof offerId !== 'string' || !offerId) {
    return { status: 400, body: { error: 'Missing "offerId"' } }
  }
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_UNITS_PER_RESERVATION) {
    return { status: 400, body: { error: `"quantity" must be a whole number from 1 to ${MAX_UNITS_PER_RESERVATION}` } }
  }

  const [cityId, , , date] = offerId.split('.')
  const city = findCity(cityId)
  if (!city || !date) {
    return { status: 404, body: { error: 'Offer not found' } }
  }

  const clock = localClock(city.tz, now)
  if (date !== clock.date) {
    return { status: 410, body: { error: 'This offer has expired' } }
  }

  const offer = (await loadOffersAt(city, clock.date, clock.minutes, store)).find((o) => o.id === offerId)
  if (!offer) {
    return { status: 404, body: { error: 'Offer not found' } }
  }
  if (offer.status === 'closed') {
    return { status: 410, body: { error: 'Pickup for this offer has closed' } }
  }

  // Capacity = what is still available before any reservation made through WasteLand.
  const alreadyReserved = (await store.reserved([offerId])).get(offerId) ?? 0
  const capacity = offer.quantityLeft + alreadyReserved
  if (quantity > offer.quantityLeft || !(await store.tryReserve(offerId, quantity, capacity))) {
    return { status: 409, body: { error: offer.quantityLeft === 0 ? 'Sold out' : `Only ${offer.quantityLeft} left` } }
  }

  return {
    status: 200,
    body: {
      code: pickupCode(),
      offerId,
      venueName: offer.venueName,
      item: offer.item,
      quantity,
      unitPrice: offer.price,
      total: Number((offer.price * quantity).toFixed(2)),
      originalTotal: Number((offer.originalPrice * quantity).toFixed(2)),
      currency: offer.currency,
      pickupFrom: offer.pickupFrom,
      pickupUntil: offer.pickupUntil,
      kg: Number((offer.kgPerPortion * quantity).toFixed(2)),
    },
  }
}
