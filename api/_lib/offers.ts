import { ITEMS, itemsFor, venuesFor, type Category, type City, type Diet, type ItemKey, type Venue } from './catalog.js'
import { formatMinutes, localClock } from './clock.js'
import { discountedPrice, discountFor, niceRound, START_DISCOUNT, WINDOW_MINUTES } from './pricing.js'
import { pick, randomInt, seededRandom } from './random.js'
import type { PartnerListing, Store } from './store.js'

export type OfferStatus = 'upcoming' | 'live' | 'closed'
/** "demo" = the simulated partner network; "partner" = listed by a real venue on the partner page. */
export type OfferSource = 'demo' | 'partner'

export interface Offer {
  id: string
  venueId: string
  venueName: string
  category: Category
  item: ItemKey
  diet: Diet
  glutenFree: boolean
  lat: number
  lon: number
  source: OfferSource
  status: OfferStatus
  currency: string
  originalPrice: number
  price: number
  discountPct: number
  quantityTotal: number
  quantityLeft: number
  kgPerPortion: number
  /** Local pickup window, e.g. "16:30"–"19:30". */
  pickupFrom: string
  pickupUntil: string
  minutesToOpen: number
  minutesToClose: number
}

/** Share of a batch that other customers rescue by closing time, before any reservation made here. */
const SOLD_BY_OTHERS = 0.65

/** Portions already reserved through /api/reserve, per offer id. */
export type ReservedLookup = (offerId: string) => number

export interface Batch {
  item: ItemKey
  quantity: number
}

/** What a venue puts aside for one slot on one day — deterministic, so it is identical on every request. */
export function batchFor(venue: Venue, slot: number, date: string): Batch {
  const rand = seededRandom(`batch|${venue.id}|${slot}|${date}`)
  return { item: pick(rand, itemsFor(venue.category)), quantity: randomInt(rand, 2, 8) }
}

export function offerId(venue: Venue, slot: number, date: string): string {
  return `${venue.id}.${slot}.${date}`
}

interface OfferInput {
  id: string
  venueId: string
  venueName: string
  category: Category
  item: ItemKey
  lat: number
  lon: number
  source: OfferSource
  originalPrice: number
  quantity: number
  /** Simulate other customers buying through the evening (demo venues only). */
  simulateOtherBuyers: boolean
  closeAt: number
}

/** Status, price and portions left for one slot at one local minute — the same rules for demo and partner offers. */
function makeOffer(input: OfferInput, city: City, minutes: number, reserved: ReservedLookup): Offer {
  const spec = ITEMS[input.item]
  const openAt = input.closeAt - WINDOW_MINUTES
  const status: OfferStatus = minutes < openAt ? 'upcoming' : minutes < input.closeAt ? 'live' : 'closed'
  const progress = status === 'live' ? (minutes - openAt) / WINDOW_MINUTES : status === 'closed' ? 1 : 0
  const soldByOthers = input.simulateOtherBuyers ? Math.floor(input.quantity * SOLD_BY_OTHERS * progress) : 0
  const quantityLeft = Math.max(0, input.quantity - soldByOthers - reserved(input.id))
  const discountPct = status === 'upcoming' ? START_DISCOUNT : discountFor(progress, quantityLeft / input.quantity)

  return {
    id: input.id,
    venueId: input.venueId,
    venueName: input.venueName,
    category: input.category,
    item: input.item,
    diet: spec.diet,
    glutenFree: spec.glutenFree,
    lat: input.lat,
    lon: input.lon,
    source: input.source,
    status,
    currency: city.currency,
    originalPrice: input.originalPrice,
    price: discountedPrice(input.originalPrice, discountPct),
    discountPct,
    quantityTotal: input.quantity,
    quantityLeft,
    kgPerPortion: spec.kg,
    pickupFrom: formatMinutes(Math.max(0, openAt)),
    pickupUntil: formatMinutes(input.closeAt),
    minutesToOpen: Math.max(0, openAt - minutes),
    minutesToClose: Math.max(0, input.closeAt - minutes),
  }
}

/** All of a city's demo-network slots for a local date, as seen at a given local minute. */
export function buildOffersAt(city: City, date: string, minutes: number, reserved: ReservedLookup = () => 0): Offer[] {
  const offers: Offer[] = []
  for (const venue of venuesFor(city)) {
    venue.closeMinutes.forEach((closeAt, slot) => {
      const { item, quantity } = batchFor(venue, slot, date)
      offers.push(
        makeOffer(
          {
            id: offerId(venue, slot, date),
            venueId: venue.id,
            venueName: venue.name,
            category: venue.category,
            item,
            lat: venue.lat,
            lon: venue.lon,
            source: 'demo',
            originalPrice: niceRound(ITEMS[item].baseEur * city.rate),
            quantity,
            simulateOtherBuyers: true,
            closeAt,
          },
          city,
          minutes,
          reserved
        )
      )
    })
  }
  return offers
}

/** A restaurant's own listing, priced by exactly the same last-call curve as the demo network. */
export function buildPartnerOffer(listing: PartnerListing, city: City, minutes: number, reserved: ReservedLookup = () => 0): Offer {
  return makeOffer(
    {
      id: listing.id,
      venueId: listing.id,
      venueName: listing.venueName,
      category: listing.category,
      item: listing.item,
      lat: city.lat,
      lon: city.lon,
      source: 'partner',
      originalPrice: listing.originalPrice,
      quantity: listing.portions,
      simulateOtherBuyers: false,
      closeAt: listing.closeMinutes,
    },
    city,
    minutes,
    reserved
  )
}

/**
 * Reads a city's partner listings and reservations for a date once (two database calls), and returns
 * a function that builds every offer — demo network + partner listings — at any local minute.
 */
export async function prepareCity(city: City, date: string, store: Store): Promise<(minutes: number) => Offer[]> {
  const listings = await store.listings(city.id, date)
  const demoIds = buildOffersAt(city, date, 0).map((o) => o.id)
  const reserved = await store.reserved([...demoIds, ...listings.map((l) => l.id)])
  const lookup: ReservedLookup = (id) => reserved.get(id) ?? 0
  return (minutes) => [...buildOffersAt(city, date, minutes, lookup), ...listings.map((l) => buildPartnerOffer(l, city, minutes, lookup))]
}

/** Every offer of a city at a local minute. */
export async function loadOffersAt(city: City, date: string, minutes: number, store: Store): Promise<Offer[]> {
  return (await prepareCity(city, date, store))(minutes)
}

/** Open and upcoming offers, soonest first. Closed slots are left out. */
export function sortCurrent(offers: Offer[]): Offer[] {
  return offers
    .filter((offer) => offer.status !== 'closed')
    .sort((a, b) => a.minutesToOpen - b.minutesToOpen || a.minutesToClose - b.minutesToClose)
}

/** Tonight's listing for a city right now. */
export async function currentOffers(city: City, now: Date, store: Store): Promise<Offer[]> {
  const clock = localClock(city.tz, now)
  return sortCurrent(await loadOffersAt(city, clock.date, clock.minutes, store))
}
