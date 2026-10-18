import type { CityPulse, Offer } from '../types/food'

export type Urgency = 'lastCall' | 'closingSoon' | 'open' | 'upcoming' | 'soldOut'

/** Minutes before closing that count as "last call" and "closing soon". */
export const LAST_CALL_MINUTES = 45
export const CLOSING_SOON_MINUTES = 90

/** How pressing an offer is right now — drives its colour, its badge and the alerts. */
export function urgencyOf(offer: Pick<Offer, 'status' | 'quantityLeft' | 'minutesToClose'>): Urgency {
  if (offer.quantityLeft <= 0) return 'soldOut'
  if (offer.status === 'upcoming') return 'upcoming'
  if (offer.minutesToClose <= LAST_CALL_MINUTES) return 'lastCall'
  if (offer.minutesToClose <= CLOSING_SOON_MINUTES) return 'closingSoon'
  return 'open'
}

export const URGENCY_COLORS: Record<Urgency, string> = {
  lastCall: '#a4452c',
  closingSoon: '#c08a3e',
  open: '#5f7a4f',
  upcoming: '#8a7a66',
  soldOut: '#b5aca0',
}

/** Globe dot colours: gold where last call is happening now, muted where it comes later, dim where the night is over. */
export const PULSE_COLORS: Record<CityPulse, string> = {
  live: '#e2b85c',
  later: '#b8a58a',
  closed: '#6e6153',
}
