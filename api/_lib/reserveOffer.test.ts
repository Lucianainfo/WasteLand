import { beforeEach, describe, expect, it } from 'vitest'
import { getOffers } from './getOffers.js'
import { createMemoryStore, type Store } from './store.js'
import { reserveOffer } from './reserveOffer.js'

// 19:00 in Bucharest.
const NOW = new Date('2026-10-18T16:00:00Z')

let store: Store

async function liveOffer() {
  const result = await getOffers('Bucharest', NOW, store)
  if (result.status !== 200) throw new Error('expected 200')
  const offer = result.body.offers.find((o) => o.status === 'live' && o.quantityLeft >= 1)
  if (!offer) throw new Error('expected a live offer')
  return offer
}

beforeEach(() => {
  store = createMemoryStore()
})

describe('reserveOffer', () => {
  it('returns 400 for a missing body, a missing offer id or an invalid quantity', async () => {
    expect((await reserveOffer(null, NOW, store)).status).toBe(400)
    expect((await reserveOffer({ quantity: 1 }, NOW, store)).status).toBe(400)
    const id = (await liveOffer()).id
    for (const quantity of [0, -1, 1.5, 99, '2']) {
      expect((await reserveOffer({ offerId: id, quantity }, NOW, store)).status).toBe(400)
    }
  })

  it('returns 404 for an offer that does not exist', async () => {
    expect((await reserveOffer({ offerId: 'atlantis.0.0.2026-10-18', quantity: 1 }, NOW, store)).status).toBe(404)
    expect((await reserveOffer({ offerId: 'bucharest.42.0.2026-10-18', quantity: 1 }, NOW, store)).status).toBe(404)
  })

  it('returns 410 for an offer from another day', async () => {
    expect((await reserveOffer({ offerId: 'bucharest.0.0.2026-10-17', quantity: 1 }, NOW, store)).status).toBe(410)
  })

  it('charges the server price, ignoring any price the client sends', async () => {
    const offer = await liveOffer()
    const result = await reserveOffer({ offerId: offer.id, quantity: 1, price: 0.01, total: 0.01 }, NOW, store)
    expect(result.status).toBe(200)
    if (result.status === 200) {
      expect(result.body.unitPrice).toBe(offer.price)
      expect(result.body.total).toBe(offer.price)
      expect(result.body.code).toMatch(/^WL-[A-Z0-9]{5}$/)
    }
  })

  it('takes reserved portions off the listing', async () => {
    const offer = await liveOffer()
    await reserveOffer({ offerId: offer.id, quantity: 1 }, NOW, store)
    const after = await getOffers('Bucharest', NOW, store)
    if (after.status !== 200) throw new Error('expected 200')
    expect(after.body.offers.find((o) => o.id === offer.id)?.quantityLeft).toBe(offer.quantityLeft - 1)
  })

  it('returns 409 when asking for more than is left', async () => {
    const offer = await liveOffer()
    const tooMany = Math.min(offer.quantityLeft + 1, 4)
    if (tooMany > offer.quantityLeft) {
      expect((await reserveOffer({ offerId: offer.id, quantity: tooMany }, NOW, store)).status).toBe(409)
    }
    for (let i = 0; i < offer.quantityLeft; i++) await reserveOffer({ offerId: offer.id, quantity: 1 }, NOW, store)
    const soldOut = await reserveOffer({ offerId: offer.id, quantity: 1 }, NOW, store)
    expect(soldOut.status).toBe(409)
  })
})
