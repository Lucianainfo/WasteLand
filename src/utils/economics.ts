/**
 * The B2B money model behind the "Research" page and docs/moldsef/. Pure functions, no I/O.
 *
 * Two separate questions, kept apart on purpose:
 *  1. Venue ROI: how much money does a venue recover from food it would otherwise bin? The *yield* of each
 *     pricing rule (what share of the full retail value comes back) is not typed here — it is measured by
 *     research/benchmark.ts and passed in. Only the scaling to a given bakery happens in this file.
 *  2. Cost of running WasteLand: how many Redis commands one request costs (counted from api/_lib/store.ts and
 *     the handlers), and when the free tiers stop being free.
 */

// ---------------------------------------------------------------------------------------------
// 1. Venue ROI
// ---------------------------------------------------------------------------------------------

/** Euro to Moldovan leu: BNM official rate, pages for 5–6 Nov 2026 showed 20.1773 and 20.1089; rounded. */
export const MDL_PER_EUR = 20.1

/**
 * Commission rates quoted by the supervisor for "commercial platforms". NOT verified: Too Good To Go's own
 * pages say only that partners pay an annual fee plus a commission that varies by country.
 */
export const COMMISSION_RATES = [0.25, 0.3] as const

/** What a pricing rule returned in the benchmark, per unit of full retail value. */
export interface RuleYield {
  /** Revenue ÷ full retail value of the batch (0…1). */
  valueShare: number
  /** Portions sold ÷ portions left (0…1). */
  sellThrough: number
}

export interface Venue {
  itemsPerDay: number
  /** Full price of one item, in MDL. */
  priceMdl: number
  /** Weight of one item, kg. */
  kgPerItem: number
  daysPerMonth: number
  mdlPerEur?: number
}

export interface Recovery {
  itemsRescuedPerDay: number
  mdlPerDay: number
  mdlPerMonth: number
  mdlPerYear: number
  eurPerMonth: number
  eurPerYear: number
  kgPerMonth: number
}

/** What a venue recovers per day, month and year from a rule's yield. Linear scaling of the simulated bakery. */
export function venueRecovery(rule: RuleYield, venue: Venue): Recovery {
  const rate = venue.mdlPerEur ?? MDL_PER_EUR
  const itemsRescuedPerDay = venue.itemsPerDay * rule.sellThrough
  const mdlPerDay = venue.itemsPerDay * venue.priceMdl * rule.valueShare
  const mdlPerMonth = mdlPerDay * venue.daysPerMonth
  const mdlPerYear = mdlPerMonth * 12
  return {
    itemsRescuedPerDay,
    mdlPerDay,
    mdlPerMonth,
    mdlPerYear,
    eurPerMonth: mdlPerMonth / rate,
    eurPerYear: mdlPerYear / rate,
    kgPerMonth: itemsRescuedPerDay * venue.kgPerItem * venue.daysPerMonth,
  }
}

/** Revenue left after a platform keeps `commission` (0…1) of every sale. */
export function afterCommission(amount: number, commission: number): number {
  return amount * (1 - Math.min(1, Math.max(0, commission)))
}

/**
 * The commission at which a rule with yield `a` and no fee earns exactly what rule `b` earns with no fee:
 * above it, paying the commission is worse than the alternative.
 */
export function breakEvenCommission(a: RuleYield, b: RuleYield): number {
  return Math.max(0, 1 - b.valueShare / a.valueShare)
}

/** Disposal cost avoided. The rate is a placeholder to be replaced by the venue's own waste invoice. */
export const DISPOSAL_PLACEHOLDER_EUR_PER_KG = 0.1
export function disposalSavedEur(kgPerMonth: number, eurPerKg: number): number {
  return kgPerMonth * Math.max(0, eurPerKg)
}

// ---------------------------------------------------------------------------------------------
// 2. Cost of running WasteLand
// ---------------------------------------------------------------------------------------------

/** Vercel Hobby is for personal, non-commercial use; a paying venue needs Pro (~USD 20/month, secondary sources). */
export const VERCEL_PRO_USD_PER_MONTH = 20
/** The catalogue's own USD rate (api/_lib/catalog.ts): 1 EUR = 1.08 USD. */
export const USD_PER_EUR = 1.08

/** Upstash Redis (upstash.com/pricing/redis): 500,000 free commands a month, then USD 0.20 per 100,000. */
export const UPSTASH_FREE_COMMANDS = 500_000
export const UPSTASH_USD_PER_100K = 0.2

/** Redis commands per request, counted from api/_lib/store.ts (HGETALL + MGET for a city's offers, etc.). */
export const REDIS_COMMANDS = {
  /** GET /api/offers and GET /api/evening: listings (1) + reservations (1). */
  cityRead: 2,
  /** POST /api/reserve: city read (2) + reservation lookup (1) + INCRBY (1) + EXPIRE (1). */
  reservation: 5,
  /** GET /api/cities, one cache miss: a city read for each of the 28 cities. */
  globeRefresh: 56,
} as const

/** /api/cities is cached for 60 s (`s-maxage`), so it can reach Redis at most once a minute per CDN region. */
export const GLOBE_CACHE_SECONDS = 60
export const MINUTES_PER_MONTH = 30 * 24 * 60

export interface Traffic {
  sessionsPerMonth: number
  /** City searches per session (each opens the offers and the evening planner). */
  searchesPerSession: number
  reservationsPerSession: number
  /** Share of the month during which at least one visitor per minute keeps the globe cache refreshing (0…1). */
  activeShare: number
  cdnRegions?: number
}

export interface InfraLoad {
  commands: number
  globeCommands: number
  overFreeTier: number
  extraUsd: number
}

export function infraLoad(traffic: Traffic): InfraLoad {
  const regions = traffic.cdnRegions ?? 1
  const globeRefreshes = Math.min(traffic.sessionsPerMonth, MINUTES_PER_MONTH * traffic.activeShare) * regions
  const globeCommands = globeRefreshes * REDIS_COMMANDS.globeRefresh
  // one search = offers (not cached) + evening planner (cached 60 s, so counting it every time is an upper bound)
  const sessionCommands =
    traffic.sessionsPerMonth * (traffic.searchesPerSession * REDIS_COMMANDS.cityRead * 2 + traffic.reservationsPerSession * REDIS_COMMANDS.reservation)
  const commands = Math.round(globeCommands + sessionCommands)
  const overFreeTier = Math.max(0, commands - UPSTASH_FREE_COMMANDS)
  return { commands, globeCommands: Math.round(globeCommands), overFreeTier, extraUsd: (overFreeTier / 100_000) * UPSTASH_USD_PER_100K }
}

/** Monthly bill in EUR for a commercial deployment shared by `venues` partners. */
export function platformCostPerVenue(venues: number, extraUsd: number): { eurPerMonth: number; eurPerVenue: number } {
  const eurPerMonth = (VERCEL_PRO_USD_PER_MONTH + extraUsd) / USD_PER_EUR
  return { eurPerMonth, eurPerVenue: eurPerMonth / Math.max(1, venues) }
}
