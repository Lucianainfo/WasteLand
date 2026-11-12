/**
 * The registered benchmark (research/PREREGISTRATION.md): four pricing rules on identical simulated customers.
 *
 *   node --import ./research/register.mjs research/benchmark.ts          registered run → research/results/benchmark.json
 *   node --import ./research/register.mjs research/benchmark.ts --dev    N = 200, other seeds, prints only (debugging)
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  BAKERY, BOOTSTRAP_RESAMPLES, BOOTSTRAP_SEED, GAMMAS, SEED_PREFIX, SENSITIVITY, TARGETS, TRIALS_PER_CELL,
  primaryCells, type Cell,
} from './config.ts'
import { curveDiscount, generateTrial, mean, runTrial, STRATEGIES, type DiscountRule, type Trial } from './simulation.ts'
import { bootstrapRelative, hypothesisVerdict, type Comparison, type Interval } from './stats.ts'

const dev = process.argv.includes('--dev')
const N = dev ? 200 : TRIALS_PER_CELL
const RESAMPLES = dev ? 300 : BOOTSTRAP_RESAMPLES
const PREFIX = dev ? 'dev|v1' : SEED_PREFIX
const BOOT_SEED = dev ? 'dev|boot' : BOOTSTRAP_SEED

const METRICS = ['sellThrough', 'revenue', 'surplus', 'kg'] as const
type Metric = (typeof METRICS)[number]
/** series[metric][cellIndex][trialIndex] */
type Series = Record<Metric, Float64Array[]>

function simulate(trials: Trial[][], rule: DiscountRule): Series {
  const series = Object.fromEntries(METRICS.map((m) => [m, [] as Float64Array[]])) as Series
  for (const cellTrials of trials) {
    const columns = Object.fromEntries(METRICS.map((m) => [m, new Float64Array(cellTrials.length)])) as Record<Metric, Float64Array>
    cellTrials.forEach((trial, i) => {
      const outcome = runTrial(trial, rule)
      for (const m of METRICS) columns[m][i] = outcome[m]
    })
    for (const m of METRICS) series[m].push(columns[m])
  }
  return series
}

function makeTrials(cells: Cell[], tag = 'main', fixed?: { quantity: number; price: number; kgPerPortion: number }): Trial[][] {
  return cells.map((cell) => Array.from({ length: N }, (_, i) => generateTrial(cell.scenario, `${PREFIX}|${tag}|${cell.id}|${i}`, fixed)))
}

const pooledOf = (cells: Float64Array[]) => mean(cells.map((cell) => mean(cell)))
const cellMeans = (cells: Float64Array[]) => cells.map((cell) => mean(cell))
const round = (x: number) => Number(x.toFixed(6))

function compare(method: Series, base: Series, metric: Metric): Comparison {
  return { num: method[metric], den: base[metric] }
}

function cellsWon(method: Series, base: Series, metric: Metric): number {
  const a = cellMeans(method[metric])
  const b = cellMeans(base[metric])
  return a.filter((value, i) => value > b[i]).length
}

function pooledSummary(series: Series): Record<Metric, number> {
  return Object.fromEntries(METRICS.map((m) => [m, round(pooledOf(series[m]))])) as Record<Metric, number>
}

function interval(i: Interval) {
  return { estimate: round(i.estimate), low: round(i.low), high: round(i.high) }
}

const started = Date.now()
// hashed with LF line endings, so the value does not depend on how Git checked the file out
const prereg = (await readFile(fileURLToPath(new URL('./PREREGISTRATION.md', import.meta.url)), 'utf8')).replaceAll('\r\n', '\n')
const cells = primaryCells()
const trials = makeTrials(cells)

// ---- Primary: four rules on the same customers
const rules = { A: STRATEGIES.A, B: STRATEGIES.B, C: STRATEGIES.C, A2: STRATEGIES.A2 }
const results = Object.fromEntries(Object.entries(rules).map(([id, strategy]) => [id, simulate(trials, strategy.discount)])) as Record<
  keyof typeof rules,
  Series
>
const { A, B, C, A2 } = results

const hypothesisDefs = [
  { id: 'H1a', metric: 'sellThrough' as const, base: A, baseId: 'A', target: TARGETS.sellThrough },
  { id: 'H1b', metric: 'sellThrough' as const, base: B, baseId: 'B', target: TARGETS.sellThrough },
  { id: 'H2a', metric: 'revenue' as const, base: A, baseId: 'A', target: TARGETS.revenue },
  { id: 'H2b', metric: 'revenue' as const, base: B, baseId: 'B', target: TARGETS.revenue },
]
const extraDefs = [
  { id: 'surplus_vs_A', metric: 'surplus' as const, base: A },
  { id: 'surplus_vs_B', metric: 'surplus' as const, base: B },
  { id: 'kg_vs_A', metric: 'kg' as const, base: A },
  { id: 'kg_vs_B', metric: 'kg' as const, base: B },
  { id: 'sellThrough_vs_A2', metric: 'sellThrough' as const, base: A2 },
  { id: 'revenue_vs_A2', metric: 'revenue' as const, base: A2 },
  { id: 'surplus_vs_A2', metric: 'surplus' as const, base: A2 },
  { id: 'revenue_A2_vs_A', metric: 'revenue' as const, base: A, method: A2 },
]
const primaryIntervals = bootstrapRelative(
  [...hypothesisDefs.map((h) => compare(C, h.base, h.metric)), ...extraDefs.map((e) => compare(e.method ?? C, e.base, e.metric))],
  RESAMPLES,
  BOOT_SEED
)

const hypotheses = Object.fromEntries(
  hypothesisDefs.map((h, k) => {
    const result = primaryIntervals[k]
    return [
      h.id,
      {
        metric: h.metric,
        baseline: h.baseId,
        target: h.target,
        ...interval(result),
        verdict: hypothesisVerdict(result.estimate, result.low, h.target),
        cellsWon: cellsWon(C, h.base, h.metric),
      },
    ]
  })
)
const extra = Object.fromEntries(
  extraDefs.map((e, k) => [e.id, { ...interval(primaryIntervals[hypothesisDefs.length + k]), cellsWon: cellsWon(e.method ?? C, e.base, e.metric) }])
)

const cellTable = cells.map((cell, c) => ({
  id: cell.id,
  demand: cell.scenario.demand,
  wtpMean: cell.scenario.wtpMean,
  methods: Object.fromEntries(
    Object.entries(results).map(([id, series]) => [id, Object.fromEntries(METRICS.map((m) => [m, round(mean(series[m][c]))]))])
  ),
}))

// ---- Exploratory: exponent sweep and ablation, same customers
const sweepSeries = GAMMAS.map((gamma) => ({ gamma, series: simulate(trials, curveDiscount(gamma, 5)) }))
const production = sweepSeries.find((s) => s.gamma === 1.3)!.series
const bestRevenue = sweepSeries.reduce((best, s) => (pooledOf(s.series.revenue) > pooledOf(best.series.revenue) ? s : best))
const bestSellThrough = sweepSeries.reduce((best, s) => (pooledOf(s.series.sellThrough) > pooledOf(best.series.sellThrough) ? s : best))
const sweepIntervals = bootstrapRelative(
  sweepSeries.map((s) => compare(s.series, production, 'revenue')),
  RESAMPLES,
  BOOT_SEED
)
const sweep = sweepSeries.map((s, k) => ({
  gamma: s.gamma,
  ...pooledSummary(s.series),
  revenueVsProduction: interval(sweepIntervals[k]),
}))

const ablationDefs = [
  { id: 'linear', label: 'γ = 1, no boost (Baseline B)', gamma: 1, boost: 0 },
  { id: 'linear+boost', label: 'γ = 1, boost 5', gamma: 1, boost: 5 },
  { id: 'curve', label: 'γ = 1.3, no boost', gamma: 1.3, boost: 0 },
  { id: 'curve+boost', label: 'γ = 1.3, boost 5 (Method C)', gamma: 1.3, boost: 5 },
]
const ablationSeries = ablationDefs.map((d) => ({ ...d, series: simulate(trials, curveDiscount(d.gamma, d.boost)) }))
const ablationIntervals = bootstrapRelative(
  ablationSeries.flatMap((a) => [compare(a.series, B, 'revenue'), compare(a.series, B, 'sellThrough')]),
  RESAMPLES,
  BOOT_SEED
)
const ablation = ablationSeries.map((a, k) => ({
  id: a.id,
  label: a.label,
  ...pooledSummary(a.series),
  revenueVsB: interval(ablationIntervals[2 * k]),
  sellThroughVsB: interval(ablationIntervals[2 * k + 1]),
}))

// ---- Exploratory: sensitivity, one assumption changed at a time
const sensitivity = SENSITIVITY.map((variant) => {
  const variantCells = primaryCells(variant.overrides)
  const variantTrials = makeTrials(variantCells, variant.id)
  const a = simulate(variantTrials, STRATEGIES.A.discount)
  const b = simulate(variantTrials, STRATEGIES.B.discount)
  const c = simulate(variantTrials, STRATEGIES.C.discount)
  const pairs = [
    compare(c, a, 'sellThrough'), compare(c, a, 'revenue'), compare(c, b, 'sellThrough'), compare(c, b, 'revenue'),
  ]
  const [csA, crA, csB, crB] = bootstrapRelative(pairs, RESAMPLES, BOOT_SEED)
  return {
    id: variant.id,
    label: variant.label,
    sellThroughVsA: interval(csA),
    revenueVsA: interval(crA),
    sellThroughVsB: interval(csB),
    revenueVsB: interval(crB),
    pooledSellThrough: { A: round(pooledOf(a.sellThrough)), B: round(pooledOf(b.sellThrough)), C: round(pooledOf(c.sellThrough)) },
    pooledRevenue: { A: round(pooledOf(a.revenue)), B: round(pooledOf(b.revenue)), C: round(pooledOf(c.revenue)) },
  }
})

// ---- Reference bakery: 15 unsold items a day at 60 MDL
const bakeryPriceEur = BAKERY.priceMdl / BAKERY.mdlPerEur
const bakeryTrials = makeTrials(cells, 'bakery', { quantity: BAKERY.itemsPerDay, price: bakeryPriceEur, kgPerPortion: BAKERY.kgPerItem })
const bakerySeries = Object.fromEntries(Object.entries(rules).map(([id, strategy]) => [id, simulate(bakeryTrials, strategy.discount)])) as Record<
  keyof typeof rules,
  Series
>
const fullValueEur = BAKERY.itemsPerDay * bakeryPriceEur
// a mean's 95% bootstrap interval, obtained as the "relative change" of the series over a series of ones
const ones = bakeryTrials.map((t) => new Float64Array(t.length).fill(1))
const bakeryIds = Object.keys(rules) as (keyof typeof rules)[]
const bakeryRevenueCis = bootstrapRelative(
  bakeryIds.map((id) => ({ num: bakerySeries[id].revenue, den: ones })),
  RESAMPLES,
  BOOT_SEED
)
const bakery = {
  itemsPerDay: BAKERY.itemsPerDay,
  priceMdl: BAKERY.priceMdl,
  mdlPerEur: BAKERY.mdlPerEur,
  priceEur: round(bakeryPriceEur),
  fullValueEurPerDay: round(fullValueEur),
  kgPerItem: BAKERY.kgPerItem,
  daysPerMonth: BAKERY.daysPerMonth,
  methods: Object.fromEntries(
    bakeryIds.map((id, k) => {
      const pooled = pooledSummary(bakerySeries[id])
      return [
        id,
        {
          itemsSoldPerDay: round(pooled.sellThrough * BAKERY.itemsPerDay),
          sellThrough: pooled.sellThrough,
          revenueEurPerDay: pooled.revenue,
          revenueEurPerDayLow: round(bakeryRevenueCis[k].low + 1),
          revenueEurPerDayHigh: round(bakeryRevenueCis[k].high + 1),
          valueShare: round(pooled.revenue / fullValueEur),
          surplusEurPerDay: pooled.surplus,
          kgPerDay: pooled.kg,
          perCell: cells.map((_, c) => ({
            itemsSold: round(mean(bakerySeries[id].sellThrough[c]) * BAKERY.itemsPerDay),
            revenueEur: round(mean(bakerySeries[id].revenue[c])),
          })),
        },
      ]
    })
  ),
}

const output = {
  meta: {
    run: dev ? 'dev (discarded)' : 'registered',
    date: new Date().toISOString().slice(0, 10),
    node: process.version,
    trialsPerCell: N,
    cells: cells.length,
    totalTrials: N * cells.length,
    bootstrapResamples: RESAMPLES,
    seedPrefix: PREFIX,
    bootstrapSeed: BOOT_SEED,
    preregistrationSha256: createHash('sha256').update(prereg).digest('hex'),
    seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
  },
  primary: {
    cells: cellTable,
    pooled: Object.fromEntries(Object.entries(results).map(([id, series]) => [id, pooledSummary(series)])),
    hypotheses,
    extra,
    plausibility: {
      note: 'Sell-through of Method C in the medium-demand cells (cells 4–6), to compare in order of magnitude with the demo network assumption of 65%.',
      mediumDemandCells: [4, 5, 6].map((id) => ({ id, sellThrough: cellTable[id - 1].methods.C.sellThrough })),
      demoNetworkAssumption: 0.65,
    },
  },
  sweep: {
    gammas: sweep,
    bestRevenueGamma: bestRevenue.gamma,
    bestSellThroughGamma: bestSellThrough.gamma,
  },
  ablation,
  sensitivity,
  bakery,
}

const text = JSON.stringify(output, null, 1)
if (dev) {
  console.log(text)
} else {
  await writeFile(fileURLToPath(new URL('./results/benchmark.json', import.meta.url)), text + '\n')
  console.log(`wrote research/results/benchmark.json in ${output.meta.seconds}s`)
}

// a short summary for the terminal
const pct = (x: number) => `${(x * 100).toFixed(1)}%`
for (const [id, h] of Object.entries(hypotheses)) {
  console.error(`${id}  C vs ${h.baseline}: ${pct(h.estimate)} [${pct(h.low)}, ${pct(h.high)}]  target ≥ ${pct(h.target)}  → ${h.verdict}  (C wins ${h.cellsWon}/9 cells)`)
}
