/**
 * Paired bootstrap for the pooled relative improvement of one method over another.
 *
 * Data come in cells (the nine demand scenarios). A pooled value is the equal-weight mean of the cell means.
 * Each resample redraws the trials of every cell with replacement, using the *same* trial indices for the
 * method and the baseline, so the pairing of customers is preserved.
 */
import { seededRandom } from '../api/_lib/random.ts'

/** One comparison: per-cell series for the method (`num`) and the baseline (`den`), same lengths. */
export interface Comparison {
  num: ArrayLike<number>[]
  den: ArrayLike<number>[]
}

export interface Interval {
  estimate: number
  low: number
  high: number
}

function pooledMean(cells: ArrayLike<number>[]): number {
  let total = 0
  for (const cell of cells) {
    let sum = 0
    for (let i = 0; i < cell.length; i++) sum += cell[i]
    total += sum / cell.length
  }
  return total / cells.length
}

/** Relative change of the pooled mean of `num` over the pooled mean of `den`: num/den − 1. */
export function pooledRelative(comparison: Comparison): number {
  return pooledMean(comparison.num) / pooledMean(comparison.den) - 1
}

/** Percentile of an ascending-sorted array (linear interpolation). */
export function percentile(sorted: ArrayLike<number>, q: number): number {
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

/**
 * 95% percentile intervals for several comparisons at once. All comparisons share the same resamples, so
 * the cost of drawing indices is paid once.
 */
export function bootstrapRelative(comparisons: Comparison[], resamples: number, seed: string): Interval[] {
  const rand = seededRandom(seed)
  const cellCount = comparisons[0].num.length
  const sizes = comparisons[0].num.map((cell) => cell.length)
  const draws = comparisons.map(() => new Float64Array(resamples))
  const indices = sizes.map((n) => new Int32Array(n))

  for (let b = 0; b < resamples; b++) {
    for (let c = 0; c < cellCount; c++) {
      const buffer = indices[c]
      const n = sizes[c]
      for (let i = 0; i < n; i++) buffer[i] = Math.floor(rand() * n)
    }
    comparisons.forEach((comparison, k) => {
      let numTotal = 0
      let denTotal = 0
      for (let c = 0; c < cellCount; c++) {
        const buffer = indices[c]
        const num = comparison.num[c]
        const den = comparison.den[c]
        let numSum = 0
        let denSum = 0
        for (let i = 0; i < buffer.length; i++) {
          numSum += num[buffer[i]]
          denSum += den[buffer[i]]
        }
        numTotal += numSum / buffer.length
        denTotal += denSum / buffer.length
      }
      draws[k][b] = numTotal / denTotal - 1
    })
  }

  return comparisons.map((comparison, k) => {
    const sorted = Float64Array.from(draws[k]).sort()
    return { estimate: pooledRelative(comparison), low: percentile(sorted, 0.025), high: percentile(sorted, 0.975) }
  })
}

export type Verdict = 'supported' | 'partial' | 'notSupported'

/** The pre-registered decision rule. */
export function hypothesisVerdict(estimate: number, low: number, target: number): Verdict {
  if (low > 0 && estimate >= target) return 'supported'
  if (low > 0) return 'partial'
  return 'notSupported'
}
