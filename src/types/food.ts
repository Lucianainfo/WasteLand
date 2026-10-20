export type Category = 'bakery' | 'cafe' | 'restaurant' | 'patisserie' | 'grocery'
export type Diet = 'vegan' | 'vegetarian' | 'meat'
export type OfferStatus = 'upcoming' | 'live'

export type ItemKey =
  | 'sourdoughLoaf'
  | 'croissantBox'
  | 'baguettes'
  | 'cinnamonRolls'
  | 'glutenFreeLoaf'
  | 'sandwichBox'
  | 'veggieWraps'
  | 'quiche'
  | 'fruitBowls'
  | 'muffins'
  | 'pastaTray'
  | 'curryBowl'
  | 'roastChicken'
  | 'sushiSet'
  | 'risotto'
  | 'mezze'
  | 'macarons'
  | 'eclairs'
  | 'fruitTart'
  | 'cheesecake'
  | 'veggieBox'
  | 'fruitCrate'
  | 'dairyBundle'
  | 'deliBundle'

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
  /** "demo" = simulated partner network; "partner" = listed by a venue on the partner page. */
  source: 'demo' | 'partner'
  status: OfferStatus
  currency: string
  originalPrice: number
  price: number
  discountPct: number
  quantityTotal: number
  quantityLeft: number
  kgPerPortion: number
  pickupFrom: string
  pickupUntil: string
  minutesToOpen: number
  minutesToClose: number
}

export interface CityInfo {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  currency: string
  localTime: string
}

export interface CityOffers {
  city: CityInfo
  offers: Offer[]
}

export interface HistoryDay {
  date: string
  meals: number
  kg: number
}

export interface SlotOffer {
  category: Category
  diet: Diet
  glutenFree: boolean
  discountPct: number
  price: number
  quantityLeft: number
}

export interface EveningHour {
  hour: number
  label: string
  offers: SlotOffer[]
}

export type CityPulse = 'live' | 'later' | 'closed'

export interface GlobeCity {
  id: string
  name: string
  lat: number
  lon: number
  localTime: string
  currency: string
  liveNow: number
  upcoming: number
  portionsLeft: number
  pulse: CityPulse
}

export interface Reservation {
  code: string
  offerId: string
  venueName: string
  item: ItemKey
  quantity: number
  unitPrice: number
  total: number
  originalTotal: number
  currency: string
  pickupFrom: string
  pickupUntil: string
  kg: number
}

/** A reservation as kept on this device, with the city and the moment it was made. */
export interface SavedOrder extends Reservation {
  cityName: string
  createdAt: number
}

/** A listing created on the partner page, as returned by POST /api/partner. */
export interface PartnerListing {
  id: string
  cityId: string
  date: string
  venueName: string
  category: Category
  item: ItemKey
  portions: number
  originalPrice: number
  closeMinutes: number
  createdAt: number
}

export interface CreatedListing {
  listing: PartnerListing
  token: string
  offer: Offer
}

/** A listing as kept on the partner's device, with the secret token needed to remove it. */
export interface SavedListing {
  listing: PartnerListing
  token: string
  cityName: string
  currency: string
  removed?: boolean
}

export interface UserProfile {
  vegetarian: boolean
  vegan: boolean
  glutenFree: boolean
  onBudget: boolean
  lastCallAlerts: boolean
}
