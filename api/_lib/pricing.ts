/** How long before closing a venue starts listing its surplus. */
export const WINDOW_MINUTES = 180
/** Discount when the window opens, and the discount it climbs to by closing time. */
export const START_DISCOUNT = 30
export const MAX_DISCOUNT = 70
/** Extra points when most of the batch is still unsold late in the window. */
export const LEFTOVER_BOOST = 5

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Dynamic "last call" pricing: the discount grows from 30% when the window opens to 70%
 * at closing time (slowly at first, faster near the end), plus up to 5 points when much of
 * the batch is still unsold late in the window. The later you come, the less you pay — and
 * the venue still sells food it would otherwise throw away.
 *
 * @param progress  0 = window just opened, 1 = closing time
 * @param leftRatio share of the batch still unsold, 0..1
 */
export function discountFor(progress: number, leftRatio: number): number {
  const p = clamp(progress, 0, 1)
  const curve = START_DISCOUNT + (MAX_DISCOUNT - START_DISCOUNT) * Math.pow(p, 1.3)
  const boost = LEFTOVER_BOOST * clamp(leftRatio, 0, 1) * p
  return Math.round(clamp(curve + boost, START_DISCOUNT, MAX_DISCOUNT + LEFTOVER_BOOST))
}

/** Rounds a price to two significant steps of its own magnitude: 4.47 → 4.5, 742 → 740, 12 345 → 12 000. */
export function niceRound(value: number): number {
  if (value <= 0) return 0
  const step = 10 ** (Math.floor(Math.log10(value)) - 1)
  return Number((Math.round(value / step) * step).toFixed(2))
}

/** Price after the discount, rounded to a nice figure but always strictly cheaper than the original. */
export function discountedPrice(original: number, discountPct: number): number {
  const raw = original * (1 - discountPct / 100)
  const rounded = niceRound(raw)
  return rounded < original ? rounded : niceRound(raw * 0.95)
}
