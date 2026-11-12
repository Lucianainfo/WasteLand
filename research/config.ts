/**
 * Every setting of the registered benchmark, in one place. It mirrors research/PREREGISTRATION.md;
 * change a value here and the pre-registration no longer describes the run.
 */

/** Trials per demand cell. 9 cells × 2,000 = 18,000 venue-evenings (the requirement is N ≥ 100). */
export const TRIALS_PER_CELL = 2000
export const BOOTSTRAP_RESAMPLES = 2000
export const SEED_PREFIX = 'wl|v1'
export const BOOTSTRAP_SEED = 'wl|boot|v1'

/** Interested customers per portion during the 3-hour window (low / medium / high demand). */
export const DEMAND_LEVELS = [0.75, 1.5, 3.0] as const
/** Mean willingness to pay as a share of the full price. */
export const WTP_MEANS = [0.35, 0.45, 0.55] as const

export type ArrivalProfile = 'uniform' | 'late' | 'early'

export interface Scenario {
  /** Expected interested customers per portion in the window. */
  demand: number
  wtpMean: number
  wtpSd: number
  /** Share of customers who keep checking the price until the window closes instead of leaving. */
  patientShare: number
  arrivals: ArrivalProfile
}

export const BASE_ASSUMPTIONS = { wtpSd: 0.2, patientShare: 0.3, arrivals: 'uniform' as ArrivalProfile }

export interface Cell {
  id: number
  label: string
  scenario: Scenario
}

/** The nine primary cells, numbered 1–9 row by row (demand low→high, willingness to pay low→high). */
export function primaryCells(overrides: Partial<Scenario> = {}): Cell[] {
  const cells: Cell[] = []
  for (const demand of DEMAND_LEVELS) {
    for (const wtpMean of WTP_MEANS) {
      const id = cells.length + 1
      cells.push({ id, label: `D=${demand}, m=${wtpMean}`, scenario: { demand, wtpMean, ...BASE_ASSUMPTIONS, ...overrides } })
    }
  }
  return cells
}

/** Hypothesis targets, proposed by the supervisor and never adjusted. */
export const TARGETS = { sellThrough: 0.25, revenue: 0.18 } as const

/** Curve exponents of the sweep (pre-registered). */
export const GAMMAS = [0.5, 0.75, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0] as const

/** One assumption changed at a time (pre-registered sensitivity analysis). */
export const SENSITIVITY: { id: string; label: string; overrides: Partial<Scenario> }[] = [
  { id: 'patient0', label: 'Nobody waits (patient share 0%)', overrides: { patientShare: 0 } },
  { id: 'patient60', label: 'Many wait (patient share 60%)', overrides: { patientShare: 0.6 } },
  { id: 'late', label: 'Arrivals concentrated late', overrides: { arrivals: 'late' } },
  { id: 'early', label: 'Arrivals concentrated early', overrides: { arrivals: 'early' } },
  { id: 'sd10', label: 'Narrow willingness to pay (sd 0.10)', overrides: { wtpSd: 0.1 } },
  { id: 'sd30', label: 'Wide willingness to pay (sd 0.30)', overrides: { wtpSd: 0.3 } },
]

/** Reference bakery (the supervisor's example), for the B2B economics. */
export const BAKERY = {
  itemsPerDay: 15,
  priceMdl: 60,
  /** BNM official rate, 5–6 Nov 2026 pages showed 20.1773 and 20.1089; rounded. */
  mdlPerEur: 20.1,
  /** Rolls and loaves; the same order of magnitude as the catalogue's bakery items (0.4–0.8 kg). */
  kgPerItem: 0.5,
  daysPerMonth: 30,
} as const
