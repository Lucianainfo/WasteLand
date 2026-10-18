import type { EveningHour, UserProfile } from '../types/food'
import { matchesProfile } from './recommendations'

export type HourLevel = 'none' | 'few' | 'good' | 'best'

export interface PlannedHour {
  hour: number
  label: string
  /** Offers open at that hour that fit the user's diet. */
  matching: number
  bestDiscount: number
  cheapest: number | null
  level: HourLevel
}

export interface EveningPlan {
  hours: PlannedHour[]
  best: PlannedHour | null
  /** Hours when nothing fits the user — better not to make the trip then. */
  empty: PlannedHour[]
}

/**
 * Scores the rest of the evening for one person. Each hour's score is the sum of the discounts
 * of the offers that fit their diet — more choice and deeper discounts both count. On a budget,
 * the hour with the cheapest fitting offer wins instead. Ties go to the earlier hour, because
 * waiting risks the food being gone.
 */
export function planEvening(hours: EveningHour[], profile: UserProfile): EveningPlan {
  const scored = hours.map((h) => {
    const matching = h.offers.filter((o) => matchesProfile(o, profile))
    return {
      hour: h.hour,
      label: h.label,
      matching: matching.length,
      bestDiscount: matching.reduce((max, o) => Math.max(max, o.discountPct), 0),
      cheapest: matching.length ? Math.min(...matching.map((o) => o.price)) : null,
      score: matching.reduce((sum, o) => sum + o.discountPct, 0),
    }
  })

  const candidates = scored.filter((h) => h.matching > 0)
  let best: (typeof scored)[number] | null = null
  for (const h of candidates) {
    if (!best) best = h
    else if (profile.onBudget ? h.cheapest! < best.cheapest! : h.score > best.score) best = h
  }

  const planned: PlannedHour[] = scored.map(({ score, ...h }) => {
    let level: HourLevel = 'none'
    if (h.matching > 0) {
      if (best && h.hour === best.hour) level = 'best'
      else if (best && score >= best.score * 0.6) level = 'good'
      else level = 'few'
    }
    return { ...h, level }
  })

  return {
    hours: planned,
    best: planned.find((h) => h.level === 'best') ?? null,
    empty: planned.filter((h) => h.level === 'none'),
  }
}
