import { beforeEach, describe, expect, it } from 'vitest'
import { getOffers } from './getOffers.js'
import { clearReservations } from './reservations.js'
import { reserveOffer } from './reserveOffer.js'

// 19:00 in Bucharest.
const NOW = new Date('2026-10-18T16:00:00Z')

function liveOffer() {
  const result = getOffers('Bucharest', NOW)
  if (result.status !== 200) throw new Error('expected 200')
  const offer = result.body.offers.find((o) => o.status === 'live' && o.quantityLeft >= 1)
  if (!offer) throw new Error('expected a live offer')
  return offer
}

beforeEach(() => {
  clearReservations()
})

describe('reserveOffer', () => {
  it('returns 400 for a missing body, a missing offer id or an invalid quantity', () => {
    expect(reserveOffer(null, NOW).status).toBe(400)
    expect(reserveOffer({ quantity: 1 }, NOW).status).toBe(400)
    const id = liveOffer().id
    for (const quantity of [0, -1, 1.5, 99, '2']) {
      expect(reserveOffer({ offerId: id, quantity }, NOW).status).toBe(400)
    }
  })

  it('returns 404 for an offer that does not exist', () => {
    expect(reserveOffer({ offerId: 'atlantis.0.0.2026-10-18', quantity: 1 }, NOW).status).toBe(404)
    expect(reserveOffer({ offerId: 'bucharest.42.0.2026-10-18', quantity: 1 }, NOW).status).toBe(404)
  })

  it('returns 410 for an offer from another day', () => {
    expect(reserveOffer({ offerId: 'bucharest.0.0.2026-10-17', quantity: 1 }, NOW).status).toBe(410)
  })

  it('charges the server price, ignoring any price the client sends', () => {
    const offer = liveOffer()
    const result = reserveOffer({ offerId: offer.id, quantity: 1, price: 0.01, total: 0.01 }, NOW)
    expect(result.status).toBe(200)
    if (result.status === 200) {
      expect(result.body.unitPrice).toBe(offer.price)
      expect(result.body.total).toBe(offer.price)
      expect(result.body.code).toMatch(/^WL-[A-Z0-9]{5}$/)
    }
  })

  it('takes reserved portions off the listing', () => {
    const offer = liveOffer()
    reserveOffer({ offerId: offer.id, quantity: 1 }, NOW)
    const after = getOffers('Bucharest', NOW)
    if (after.status !== 200) throw new Error('expected 200')
    expect(after.body.offers.find((o) => o.id === offer.id)?.quantityLeft).toBe(offer.quantityLeft - 1)
  })

  it('returns 409 when asking for more than is left', () => {
    const offer = liveOffer()
    const tooMany = Math.min(offer.quantityLeft + 1, 4)
    if (tooMany > offer.quantityLeft) {
      expect(reserveOffer({ offerId: offer.id, quantity: tooMany }, NOW).status).toBe(409)
    }
    for (let i = 0; i < offer.quantityLeft; i++) reserveOffer({ offerId: offer.id, quantity: 1 }, NOW)
    const soldOut = reserveOffer({ offerId: offer.id, quantity: 1 }, NOW)
    expect(soldOut.status).toBe(409)
  })
})
