import { ITEMS, itemsFor, venuesFor, type Category, type City, type Diet, type ItemKey, type Venue } from './catalog.js'
import { formatMinutes, localClock } from './clock.js'
import { discountedPrice, discountFor, niceRound, START_DISCOUNT, WINDOW_MINUTES } from './pricing.js'
import { pick, randomInt, seededRandom } from './random.js'

export type OfferStatus = 'upcoming' | 'live' | 'closed'

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

/** Units already reserved through /api/reserve, per offer id. */
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

/** All of a city's surplus slots for a local date, as seen at a given local minute. */
export function buildOffersAt(city: City, date: string, minutes: number, reserved: ReservedLookup = () => 0): Offer[] {
  const offers: Offer[] = []

  for (const venue of venuesFor(city)) {
    venue.closeMinutes.forEach((closeAt, slot) => {
      const openAt = closeAt - WINDOW_MINUTES
      const { item, quantity } = batchFor(venue, slot, date)
      const spec = ITEMS[item]
      const id = offerId(venue, slot, date)

      const status: OfferStatus = minutes < openAt ? 'upcoming' : minutes < closeAt ? 'live' : 'closed'
      const progress = status === 'live' ? (minutes - openAt) / WINDOW_MINUTES : status === 'closed' ? 1 : 0
      const soldByOthers = Math.floor(quantity * SOLD_BY_OTHERS * progress)
      const quantityLeft = Math.max(0, quantity - soldByOthers - reserved(id))
      const discountPct = status === 'upcoming' ? START_DISCOUNT : discountFor(progress, quantityLeft / quantity)
      const originalPrice = niceRound(spec.baseEur * city.rate)

      offers.push({
        id,
        venueId: venue.id,
        venueName: venue.name,
        category: venue.category,
        item,
        diet: spec.diet,
        glutenFree: spec.glutenFree,
        lat: venue.lat,
        lon: venue.lon,
        status,
        currency: city.currency,
        originalPrice,
        price: discountedPrice(originalPrice, discountPct),
        discountPct,
        quantityTotal: quantity,
        quantityLeft,
        kgPerPortion: spec.kg,
        pickupFrom: formatMinutes(openAt),
        pickupUntil: formatMinutes(closeAt),
        minutesToOpen: Math.max(0, openAt - minutes),
        minutesToClose: Math.max(0, closeAt - minutes),
      })
    })
  }

  return offers
}

/** Tonight's listing for a city right now: open and upcoming offers, soonest closing first. Closed slots are left out. */
export function currentOffers(city: City, now: Date, reserved: ReservedLookup = () => 0): Offer[] {
  const clock = localClock(city.tz, now)
  return buildOffersAt(city, clock.date, clock.minutes, reserved)
    .filter((offer) => offer.status !== 'closed')
    .sort((a, b) => a.minutesToOpen - b.minutesToOpen || a.minutesToClose - b.minutesToClose)
}
