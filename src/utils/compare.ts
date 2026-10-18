import type { CityOffers } from '../types/food'
import { CO2E_PER_KG } from './impact'

export interface CitySummary {
  /** Portions still available tonight (open now + opening later). */
  portionsTonight: number
  /** Offers open for pickup right now. */
  liveNow: number
  /** Average discount of the offers open right now, in %. */
  avgDiscount: number
  /** Food that can still be rescued tonight, in kg. */
  kgTonight: number
  /** CO2e that rescuing it avoids, in kg. */
  co2Tonight: number
}

export function summarize({ offers }: CityOffers): CitySummary {
  const available = offers.filter((o) => o.quantityLeft > 0)
  const live = available.filter((o) => o.status === 'live')
  const kg = available.reduce((sum, o) => sum + o.quantityLeft * o.kgPerPortion, 0)
  return {
    portionsTonight: available.reduce((sum, o) => sum + o.quantityLeft, 0),
    liveNow: live.length,
    avgDiscount: live.length ? Math.round(live.reduce((sum, o) => sum + o.discountPct, 0) / live.length) : 0,
    kgTonight: Number(kg.toFixed(1)),
    co2Tonight: Number((kg * CO2E_PER_KG).toFixed(1)),
  }
}

export interface Verdict {
  winner: 'a' | 'b' | 'tie'
  /** How much more food the winner still has to rescue, in % of its own amount. */
  pct: number
}

/** The city with more food still waiting to be rescued tonight "wins": that is where an evening out counts most. */
export function compareCities(a: CitySummary, b: CitySummary): Verdict {
  if (a.kgTonight === b.kgTonight) return { winner: 'tie', pct: 0 }
  const [high, low] = a.kgTonight > b.kgTonight ? [a.kgTonight, b.kgTonight] : [b.kgTonight, a.kgTonight]
  return { winner: a.kgTonight > b.kgTonight ? 'a' : 'b', pct: Math.round(((high - low) / high) * 100) }
}

/** Bar widths in % of the larger value, so the bigger of the two always fills the track. */
export function barWidths(a: number, b: number): [number, number] {
  const max = Math.max(a, b)
  if (max <= 0) return [0, 0]
  return [(a / max) * 100, (b / max) * 100]
}
