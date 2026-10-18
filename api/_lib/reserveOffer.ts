import { findCity } from './catalog.js'
import { localClock } from './clock.js'
import type { ApiOutcome } from './getOffers.js'
import { buildOffersAt } from './offers.js'
import { hashString } from './random.js'
import { addReservation, reservationCount, reservedUnits } from './reservations.js'

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

function pickupCode(offerId: string, serial: number): string {
  let n = hashString(`${offerId}|${serial}|${Date.now()}`)
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[n % CODE_ALPHABET.length]
    n = Math.floor(n / CODE_ALPHABET.length)
  }
  return `WL-${code}`
}

/**
 * Backend logic for POST /api/reserve. The browser only sends *which* offer and *how many*;
 * the price is recomputed here from the server clock, so the amount on the pickup ticket is
 * always the real current last-call price, never a number sent by the client.
 */
export function reserveOffer(body: unknown, now = new Date()): ApiOutcome<Reservation> {
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

  const offer = buildOffersAt(city, clock.date, clock.minutes, reservedUnits).find((o) => o.id === offerId)
  if (!offer) {
    return { status: 404, body: { error: 'Offer not found' } }
  }
  if (offer.status === 'closed') {
    return { status: 410, body: { error: 'Pickup for this offer has closed' } }
  }
  if (quantity > offer.quantityLeft) {
    return { status: 409, body: { error: offer.quantityLeft === 0 ? 'Sold out' : `Only ${offer.quantityLeft} left` } }
  }

  addReservation(offerId, quantity)

  return {
    status: 200,
    body: {
      code: pickupCode(offerId, reservationCount()),
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
