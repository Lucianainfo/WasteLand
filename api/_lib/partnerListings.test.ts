import { beforeEach, describe, expect, it } from 'vitest'
import { getOffers } from './getOffers.js'
import { createListing, MAX_LISTINGS_PER_HOUR, removeListing } from './partnerListings.js'
import { reserveOffer } from './reserveOffer.js'
import { createMemoryStore, type Store } from './store.js'

// 19:00 in Bucharest.
const NOW = new Date('2026-10-18T16:00:00Z')

const VALID = {
  city: 'Bucharest',
  venueName: 'Brutăria Mihai',
  category: 'bakery',
  item: 'croissantBox',
  portions: 6,
  originalPrice: 30,
  closeTime: '21:00',
}

let store: Store

beforeEach(() => {
  store = createMemoryStore()
})

async function create(overrides: Record<string, unknown> = {}, client = 'client-1') {
  return createListing({ ...VALID, ...overrides }, client, NOW, store)
}

describe('createListing', () => {
  it('creates a listing that appears in the city’s offers, priced on the server', async () => {
    const result = await create()
    expect(result.status).toBe(200)
    if (result.status !== 200) return
    expect(result.body.token.length).toBeGreaterThan(20)
    expect(result.body.listing).not.toHaveProperty('tokenHash')

    const offers = await getOffers('Bucharest', NOW, store)
    if (offers.status !== 200) throw new Error('expected 200')
    const listed = offers.body.offers.find((o) => o.id === result.body.listing.id)
    expect(listed).toMatchObject({ source: 'partner', venueName: 'Brutăria Mihai', status: 'live', quantityLeft: 6, currency: 'RON', pickupUntil: '21:00' })
    // 19:00 is one hour into a window that runs 18:00–21:00, so it is already discounted past the opening 30%.
    expect(listed!.discountPct).toBeGreaterThan(30)
    expect(listed!.price).toBeLessThan(30)
  })

  it('takes its diet and gluten labels from the catalogue, not from the request', async () => {
    const result = await create({ diet: 'vegan', glutenFree: true })
    if (result.status !== 200) throw new Error('expected 200')
    expect(result.body.offer.diet).toBe('vegetarian')
    expect(result.body.offer.glutenFree).toBe(false)
  })

  it.each([
    [{ city: 'Atlantis' }],
    [{ venueName: 'x' }],
    [{ venueName: '<script>alert(1)</script>' }],
    [{ venueName: 'https://spam.example' }],
    [{ category: 'casino' }],
    [{ item: 'sushiSet' }],
    [{ portions: 0 }],
    [{ portions: 21 }],
    [{ portions: 2.5 }],
    [{ originalPrice: -5 }],
    [{ originalPrice: 1_000_000 }],
    [{ closeTime: '25:00' }],
    [{ closeTime: '19:05' }],
    [{ closeTime: '18:00' }],
  ])('rejects invalid input %o with 400', async (overrides) => {
    expect((await create(overrides)).status).toBe(400)
  })

  it('limits how many listings one connection can create in an hour', async () => {
    for (let i = 0; i < MAX_LISTINGS_PER_HOUR; i++) expect((await create()).status).toBe(200)
    expect((await create()).status).toBe(429)
    expect((await create({}, 'client-2')).status).toBe(200)
  })

  it('can be reserved like any other offer', async () => {
    const result = await create({ portions: 2 })
    if (result.status !== 200) throw new Error('expected 200')
    const id = result.body.listing.id
    expect((await reserveOffer({ offerId: id, quantity: 2 }, NOW, store)).status).toBe(200)
    expect((await reserveOffer({ offerId: id, quantity: 1 }, NOW, store)).status).toBe(409)
  })
})

describe('removeListing', () => {
  it('removes a listing only with the right token', async () => {
    const result = await create()
    if (result.status !== 200) throw new Error('expected 200')
    const { id } = result.body.listing
    expect((await removeListing({ id, token: 'wrong' }, store)).status).toBe(403)
    expect((await removeListing({ id, token: result.body.token }, store)).status).toBe(200)
    expect((await removeListing({ id, token: result.body.token }, store)).status).toBe(404)
  })

  it('rejects ids that are not partner listings', async () => {
    expect((await removeListing({ id: 'bucharest.0.0.2026-10-18', token: 'x' }, store)).status).toBe(404)
    expect((await removeListing({}, store)).status).toBe(400)
  })
})

describe('memory store', () => {
  it('never reserves beyond capacity', async () => {
    expect(await store.tryReserve('a', 3, 4)).toBe(true)
    expect(await store.tryReserve('a', 2, 4)).toBe(false)
    expect(await store.tryReserve('a', 1, 4)).toBe(true)
    expect((await store.reserved(['a', 'b'])).get('a')).toBe(4)
    expect((await store.reserved(['a', 'b'])).get('b')).toBe(0)
  })
})
