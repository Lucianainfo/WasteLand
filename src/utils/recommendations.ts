import type { Offer, UserProfile } from '../types/food'

/** Does an offer fit the user's diet? Vegan implies vegetarian; gluten-free is independent. */
export function matchesProfile(offer: Pick<Offer, 'diet' | 'glutenFree'>, profile: UserProfile): boolean {
  if (profile.vegan && offer.diet !== 'vegan') return false
  if (profile.vegetarian && offer.diet === 'meat') return false
  if (profile.glutenFree && !offer.glutenFree) return false
  return true
}

export type Recommendation =
  | { level: 'now'; offer: Offer }
  | { level: 'later'; offer: Offer }
  | { level: 'none' }

function better(profile: UserProfile) {
  return (a: Offer, b: Offer) =>
    profile.onBudget
      ? a.price / a.originalPrice - b.price / b.originalPrice || a.price - b.price || a.minutesToClose - b.minutesToClose
      : b.discountPct - a.discountPct || a.minutesToClose - b.minutesToClose
}

/**
 * Turns tonight's listing + the user's profile into one concrete pick: "go to this venue, take this
 * item" — not just a list. Offers that are open now win over ones that open later; on a budget the
 * cheapest share of the full price wins, otherwise the deepest discount, and ties go to whatever
 * closes first (it is the food closest to being thrown away).
 */
export function getRecommendation(offers: Offer[], profile: UserProfile): Recommendation {
  const available = offers.filter((o) => o.quantityLeft > 0 && matchesProfile(o, profile))
  const live = available.filter((o) => o.status === 'live').sort(better(profile))
  if (live.length > 0) return { level: 'now', offer: live[0] }
  const later = available.filter((o) => o.status === 'upcoming').sort((a, b) => a.minutesToOpen - b.minutesToOpen)
  if (later.length > 0) return { level: 'later', offer: later[0] }
  return { level: 'none' }
}
