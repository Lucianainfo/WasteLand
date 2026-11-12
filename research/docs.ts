/**
 * Builds the MoldSEF documents from the benchmark results and the cost model, so that no number in them is typed by
 * hand:  docs/moldsef/abstract.html (2 pages)  and  docs/moldsef/visual-annex.html (1 page).
 * The prose was written for the verdicts the benchmark produced; `assertVerdicts` stops the build if a re-run changed
 * them, so the text can never say the opposite of the data.
 */
import { BAKERY, BASE_ASSUMPTIONS, DEMAND_LEVELS, WTP_MEANS } from './config.ts'
import benchmark from './results/benchmark.json' with { type: 'json' }
import {
  afterCommission, breakEvenCommission, COMMISSION_RATES, DISPOSAL_PLACEHOLDER_EUR_PER_KG, disposalSavedEur, infraLoad,
  platformCostPerVenue, UPSTASH_FREE_COMMANDS, venueRecovery,
} from '../src/utils/economics.ts'

/** Numbers as in English text, with a real minus sign. */
export const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '−')
export const pct = (x: number, d = 1) => `${fmt(x * 100, d)}%`
export const signed = (x: number, d = 1) => `${x > 0 ? '+' : ''}${pct(x, d)}`
export const range = (low: number, high: number, d = 1) => `${fmt(low * 100, d)}% to ${fmt(high * 100, d)}%`
export const mdl = (x: number) => `${fmt(x)} MDL`
export const eur = (x: number, d = 0) => `€${fmt(x, d)}`

export const meta = benchmark.meta
export const hyp = benchmark.primary.hypotheses
export const pooled = benchmark.primary.pooled
export const extra = benchmark.primary.extra
export const sweep = benchmark.sweep
export const ablation = Object.fromEntries(benchmark.ablation.map((a) => [a.id, a]))
export const sens = Object.fromEntries(benchmark.sensitivity.map((s) => [s.id, s]))
export const bakery = benchmark.bakery

export function assertVerdicts(): void {
  for (const [id, h] of Object.entries(hyp)) {
    if (h.verdict !== 'partial' && h.verdict !== 'partially supported') {
      throw new Error(`The prose of the abstract was written for four "partial" verdicts, but ${id} is "${h.verdict}". Rewrite the text of research/docs.ts first.`)
    }
  }
}

// ---- derived numbers shared by the abstract, the annex, the poster and the pitch ------------------------------------

const venue = { itemsPerDay: BAKERY.itemsPerDay, priceMdl: BAKERY.priceMdl, kgPerItem: BAKERY.kgPerItem, daysPerMonth: BAKERY.daysPerMonth, mdlPerEur: BAKERY.mdlPerEur }
const yieldOf = (id: 'A' | 'B' | 'C' | 'A2') => ({ valueShare: bakery.methods[id].valueShare, sellThrough: bakery.methods[id].sellThrough })
export const recovery = {
  A: venueRecovery(yieldOf('A'), venue),
  B: venueRecovery(yieldOf('B'), venue),
  C: venueRecovery(yieldOf('C'), venue),
  A2: venueRecovery(yieldOf('A2'), venue),
}
export const platform = COMMISSION_RATES.map((rate) => ({
  rate,
  mdlPerMonth: afterCommission(recovery.A2.mdlPerMonth, rate),
  mdlPerYear: afterCommission(recovery.A2.mdlPerYear, rate),
  eurPerYear: afterCommission(recovery.A2.eurPerYear, rate),
}))
export const breakEven = breakEvenCommission(yieldOf('C'), yieldOf('A2'))
export const retailValuePerMonth = BAKERY.itemsPerDay * BAKERY.priceMdl * BAKERY.daysPerMonth
export const disposalPerMonth = disposalSavedEur(recovery.C.kgPerMonth, DISPOSAL_PLACEHOLDER_EUR_PER_KG)
export const traffic = [
  { label: 'Demo (jury)', sessions: 300, active: 0.02, commercial: false },
  { label: 'Pilot, steady evening traffic', sessions: 5000, active: 0.25, commercial: true },
  { label: 'Pilot, busy all day', sessions: 50000, active: 1, commercial: true },
].map((row) => {
  const load = infraLoad({ sessionsPerMonth: row.sessions, searchesPerSession: 3, reservationsPerSession: 0.1, activeShare: row.active })
  return { ...row, load, billEur: row.commercial ? platformCostPerVenue(1, load.extraUsd).eurPerMonth : 0 }
})
const plateau = sweep.gammas.filter((g) => g.gamma >= 1 && g.gamma <= 1.6)
export const plateauSpread = Math.max(...plateau.map((g) => Math.abs(g.revenueVsProduction.estimate)))
export const rowsOrder = ['A', 'B', 'C', 'A2'] as const
export const names = { A: 'Fixed 50% off', B: 'Linear 30→70%', C: 'WasteLand (p^1.3 + boost)', A2: 'Fixed 67% off' } as const

const resultRows = rowsOrder
  .map(
    (id) =>
      `<tr><td class="l">${id} · ${names[id]}</td><td>${pct(pooled[id].sellThrough)}</td><td>${eur(pooled[id].revenue, 2)}</td><td>${eur(pooled[id].surplus, 2)}</td><td>${fmt(pooled[id].kg, 2)} kg</td></tr>`
  )
  .join('\n')

export function abstractHtml(): string {
  assertVerdicts()
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WasteLand — MoldSEF abstract</title>
<style>
  @page { size: A4; margin: 2cm; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.15; color: #000; text-align: justify; }
  h1, h2, p, table, ol { font-size: 12pt; margin: 0; }
  h1 { text-align: center; font-weight: bold; margin-bottom: 2pt; }
  h2 { font-weight: bold; margin-top: 6pt; }
  .byline { text-align: center; margin-bottom: 3pt; }
  p { margin-bottom: 3pt; }
  table { border-collapse: collapse; width: 100%; margin: 3pt 0; text-align: center; }
  th, td { border: 0.5pt solid #000; padding: 0 3pt; font-weight: normal; }
  th { font-weight: bold; }
  td.l, th.l { text-align: left; }
  caption { caption-side: top; text-align: left; font-weight: bold; padding-bottom: 1pt; }
  ol { padding-left: 1.6em; text-align: left; }
  li { margin-bottom: 0; }
</style>
</head>
<body>

<h1>WasteLand: does a price that falls toward closing time rescue more surplus food and more revenue? A pre-registered simulation benchmark and venue cost model</h1>
<p class="byline">Luciana Posturusu (Grade 12) · Supervisor: Azamat Jayush · Software Development / Food waste</p>

<h2>1. Aim and hypotheses</h2>
<p>About 1.05 billion tonnes of food were wasted in 2022, and 19% of the food available to consumers ends up in the bin [1]. WasteLand lists a venue's unsold food in the last three hours before closing and lowers its price as closing approaches: the discount rises from 30% to 70% along p<sup>1.3</sup> (p is the share of the window elapsed), plus up to 5 points when much of the batch is still unsold. The exponent 1.3 and the boost were design choices, not results. We tested whether this rule beats the two simple rules a venue would otherwise use. The hypotheses, decision rule and demand scenarios were written on ${meta.date}, before the simulator was run (repository file <i>research/PREREGISTRATION.md</i>, SHA-256 ${meta.preregistrationSha256.slice(0, 12)}… recorded in the results). The targets were proposed by the supervisor and not changed afterwards. <b>H1a/H1b:</b> compared with a fixed 50% discount (A) or a linear 30%→70% markdown (B), the rule (C) raises the share of portions sold by at least ${pct(hyp.H1a.target, 0)}. <b>H2a/H2b:</b> it raises revenue recovered per evening by at least ${pct(hyp.H2a.target, 0)}. A hypothesis is supported only if the estimate reaches the target and the 95% interval excludes zero; if the interval is above zero but the estimate is below the target, it is partially supported.</p>

<h2>2. Methodology</h2>
<p><b>Simulator.</b> One trial is one venue-evening with 2–8 unsold portions of a catalogue item. Interested customers arrive as a Poisson process (D = ${DEMAND_LEVELS.join(", ")} per portion over the 180-minute window) at random minutes; each is willing to pay a share w of the full price, w ~ Normal(m, ${fmt(BASE_ASSUMPTIONS.wtpSd, 2)}) truncated to [0.05, 1] with m = ${WTP_MEANS.join(", ")}, and buys one portion if the displayed price is at or below that. A share of ${pct(BASE_ASSUMPTIONS.patientShare, 0)} are patient: they keep checking every minute and buy once the price has fallen enough, so a falling price is not rewarded by assuming nobody notices it [4]. The price is recomputed from the current stock before every decision, using the deployed functions <i>discountFor</i> and <i>discountedPrice</i> imported from the server code. <b>Design.</b> Nine demand scenarios (D × m), ${fmt(meta.trialsPerCell)} trials each, ${fmt(meta.totalTrials)} in total (the requirement is N ≥ 100); every rule sells to the same customers (paired design). Rule A2, a fixed 67% discount (one third of the value, the typical surprise-bag price [2]), was added for context and is not part of any hypothesis. <b>Statistics.</b> Pooled relative improvement with a paired 2,000-resample bootstrap [5]; seed ${meta.seedPrefix}, used once (debugging used another seed). <b>Limits.</b> <b>There is no real sales data</b>: the arrival rate, willingness to pay and patience are assumptions, bracketed by the grid and six one-at-a-time variations, not measured.</p>

<h2>3. Quantitative benchmark results</h2>
<table>
<caption>Table 1. Averages over the nine scenarios (N = ${fmt(meta.totalTrials)} venue-evenings)</caption>
<tr><th class="l">Pricing rule</th><th>Portions rescued</th><th>Revenue / evening</th><th>Customer surplus</th><th>Food rescued</th></tr>
${resultRows}
</table>
<p><b>All four hypotheses are partially supported.</b> Against the fixed 50% discount the rule rescues ${pct(hyp.H1a.estimate)} more portions (95% interval ${range(hyp.H1a.low, hyp.H1a.high)}, target ${pct(hyp.H1a.target, 0)}) and recovers ${pct(hyp.H2a.estimate)} more revenue (${range(hyp.H2a.low, hyp.H2a.high)}, target ${pct(hyp.H2a.target, 0)}), in ${hyp.H1a.cellsWon} of 9 scenarios. Against the linear markdown the difference is real but tiny: ${signed(hyp.H1b.estimate)} portions (${range(hyp.H1b.low, hyp.H1b.high)}) and ${signed(hyp.H2b.estimate)} revenue (${range(hyp.H2b.low, hyp.H2b.high)}), better in only ${hyp.H1b.cellsWon} and ${hyp.H2b.cellsWon} of 9 scenarios, because the two share their endpoints. <b>Why 1.3?</b> Sweeping the exponent from 0.5 to 3.0 shows a plateau, not a sharp optimum: revenue peaks at γ = ${sweep.bestRevenueGamma}, but every exponent from 1.0 to 1.6 is within ${pct(plateauSpread)} of it, and 1.3 is not statistically separable from 1.0 or 1.6. The ablation shows which ingredient works: the curve alone (γ = 1.3, no boost) is worse than the straight line (${signed(ablation['curve'].sellThroughVsB.estimate)} portions, ${signed(ablation['curve'].revenueVsB.estimate)} revenue); the boost for unsold stock adds the rescued portions (${signed(ablation['linear+boost'].sellThroughVsB.estimate)} on the straight line). Against the fixed 67% discount the rule rescues ${pct(Math.abs(extra.sellThrough_vs_A2.estimate))} fewer portions but recovers ${pct(extra.revenue_vs_A2.estimate)} more revenue, and customers keep ${pct(Math.abs(extra.surplus_vs_A2.estimate), 0)} less surplus: last-call pricing maximises money, a deep discount maximises food rescued. <b>Sensitivity:</b> the advantage over the fixed 50% discount depends on customers noticing the falling price. If nobody waits, it rescues ${signed(sens.patient0.sellThroughVsA.estimate)} portions but earns ${signed(sens.patient0.revenueVsA.estimate)} revenue, less than the fixed discount; if 60% wait, ${signed(sens.patient60.sellThroughVsA.estimate)} and ${signed(sens.patient60.revenueVsA.estimate)}. Medium-demand scenarios rescue ${pct(Math.min(...benchmark.primary.plausibility.mediumDemandCells.map((c) => c.sellThrough)), 0)}–${pct(Math.max(...benchmark.primary.plausibility.mediumDemandCells.map((c) => c.sellThrough)), 0)} of portions (the demo network assumes 65%).</p>

<h2>4. Economic and social applicability</h2>
<p><b>Venue ROI.</b> Reference bakery: ${BAKERY.itemsPerDay} unsold items a day at ${BAKERY.priceMdl} MDL (${mdl(retailValuePerMonth)} of retail value a month), €1 = ${BAKERY.mdlPerEur} MDL (BNM, early November 2026 [6]), 30 days a month. The food is already baked, so recovered revenue is pure gain. Thrown away it brings 0. With the benchmark's yields the rule recovers ${mdl(recovery.C.mdlPerMonth)} a month (${eur(recovery.C.eurPerMonth)}), ${mdl(recovery.C.mdlPerYear)} (${eur(recovery.C.eurPerYear)}) a year, ${pct(bakery.methods.C.valueShare, 0)} of retail value, and rescues ${fmt(recovery.C.itemsRescuedPerDay, 1)} items a day (${fmt(recovery.C.kgPerMonth)} kg a month); the fixed 50% discount recovers ${mdl(recovery.A.mdlPerMonth)} a month and the linear markdown ${mdl(recovery.B.mdlPerMonth)}. A surprise-bag app selling at 67% off keeps ${mdl(platform[0].mdlPerMonth)} a month after a 25% commission and ${mdl(platform[1].mdlPerMonth)} after 30%; a commission above about ${pct(breakEven, 0)} would make an uncharged fixed 67% discount worth more than WasteLand. The 25–30% rates come from the supervisor and could not be confirmed on Too Good To Go's own pages [2]. If binning costs ${eur(DISPOSAL_PLACEHOLDER_EUR_PER_KG, 2)} per kg (a placeholder, not a source), a further ${eur(disposalPerMonth)} a month is saved. <b>Cost of running WasteLand.</b> The prototype costs 0 on Vercel's Hobby plan and Upstash's free tier, but Hobby is limited to personal, non-commercial use, so a pilot that charges venues needs Vercel Pro (about USD 20 a month) [7]. Counting the Redis commands in the code, the globe endpoint alone spends 56 commands per 60-second cache refresh, so steady traffic passes Upstash's ${fmt(UPSTASH_FREE_COMMANDS)} free commands a month: ${fmt(traffic[1].load.commands)} commands (${eur(traffic[1].billEur, 2)} a month) for ${fmt(traffic[1].sessions)} visits at steady evening traffic [8]. <b>Social value:</b> ${fmt(pooled.C.kg, 2)} kg of food per venue-evening rescued instead of binned. <b>Unverified:</b> commission rates, Vercel Pro price, the disposal placeholder and all demand parameters.</p>

<h2>5. Conclusions</h2>
<p>In this simulation, last-call pricing rescues about a fifth more portions and about a tenth more revenue than a fixed 50% discount, short of the pre-registered 25% and 18% targets; it is practically indistinguishable from a plain linear markdown, and 1.3 is one point on a flat plateau rather than a proven optimum. The unsold-stock boost, not the curve, is what adds rescued portions; a deep fixed discount rescues more food but returns less money. The result holds only if some customers notice and wait for the price to fall. The missing experiment is a pilot with one real bakery: measure arrivals and willingness to pay, then re-run this benchmark with those numbers as an amendment.</p>

<h2>References</h2>
<ol>
<li>UNEP. Food Waste Index Report 2024. United Nations Environment Programme; 2024. unep.org.</li>
<li>Too Good To Go. Business pages (Surprise Bags sold at 25–50% of retail value; annual fee plus a commission that varies by country). toogoodtogo.com.</li>
<li>Gallego G., van Ryzin G. Optimal dynamic pricing of inventories with stochastic demand over finite horizons. Management Science 1994;40(8):999–1020.</li>
<li>Su X. Intertemporal pricing with strategic customer behavior. Management Science 2007;53(5):726–741.</li>
<li>Efron B., Tibshirani R.J. An Introduction to the Bootstrap. Chapman &amp; Hall; 1993.</li>
<li>National Bank of Moldova. Official exchange rate pages, 5–6 November 2026 (20.1773 and 20.1089 MDL per EUR). bnm.md.</li>
<li>Vercel. Pricing (Hobby: personal, non-commercial use; Pro about USD 20 a month, from secondary sources). vercel.com/pricing.</li>
<li>Upstash. Redis pricing (500,000 free commands a month, then USD 0.20 per 100,000). upstash.com/pricing/redis.</li>
</ol>
<p><b>Availability.</b> Code, pre-registration, results and logbook: <i>research/</i>, <i>docs/moldsef/</i> in the repository.</p>

</body>
</html>
`
}

// ---- visual annex -----------------------------------------------------------------------------------------------------

const COLORS = { A: '#9a9a9a', B: '#c4a46a', C: '#1d3f5c', A2: '#7a5a3a' } as const

/** Horizontal bars for one metric across the four rules. */
export function ruleBars(metric: 'sellThrough' | 'revenue'): string {
  const max = Math.max(...rowsOrder.map((id) => pooled[id][metric]))
  return rowsOrder
    .map((id, i) => {
      const v = pooled[id][metric]
      const y = 12 + i * 28
      const w = (v / max) * 130
      const label = metric === 'sellThrough' ? pct(v, 1) : eur(v, 2)
      return `<text x="0" y="${y + 13}" font-size="11">${id} · ${names[id].replace(' (p^1.3 + boost)', '')}</text><rect x="128" y="${y}" width="${w.toFixed(1)}" height="18" fill="${COLORS[id]}"/><text x="${(132 + w).toFixed(1)}" y="${y + 13}" font-size="11">${label}</text>`
    })
    .join('')
}

/** Revenue against the curve exponent, deployed exponent marked. */
export function sweepLine(): string {
  const pts = sweep.gammas
  const lo = Math.min(...pts.map((p) => p.revenue))
  const hi = Math.max(...pts.map((p) => p.revenue))
  const W = 330
  const H = 100
  const x = (i: number) => 36 + (i / (pts.length - 1)) * (W - 72)
  const y = (v: number) => 12 + (1 - (v - lo) / (hi - lo)) * (H - 24)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(' ')
  const dots = pts
    .map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.revenue).toFixed(1)}" r="${p.gamma === 1.3 ? 4.5 : 3}" fill="${p.gamma === 1.3 ? '#c4a46a' : '#1d3f5c'}" stroke="#000" stroke-width="${p.gamma === 1.3 ? 1 : 0}"/><text x="${x(i).toFixed(1)}" y="${H + 12}" font-size="10" text-anchor="middle">${p.gamma}</text><text x="${x(i).toFixed(1)}" y="${(y(p.revenue) - 6).toFixed(1)}" font-size="9" text-anchor="middle">${fmt(p.revenue, 2)}</text>`)
    .join('')
  return `<path d="${d}" fill="none" stroke="#1d3f5c" stroke-width="1.6"/>${dots}`
}

/** Change against the fixed 50% discount under each assumption, as paired bars (rescued, revenue). */
export function sensitivityBars(): string {
  const rows = [{ label: 'Primary (30% patient)', rescued: hyp.H1a.estimate, revenue: hyp.H2a.estimate }, ...benchmark.sensitivity.map((s) => ({ label: s.label.replace(/ \(.*\)$/, ''), rescued: s.sellThroughVsA.estimate, revenue: s.revenueVsA.estimate }))]
  const zero = 150
  const scale = 140 / 0.5
  const bar = (v: number, yy: number, color: string) => {
    const xx = v >= 0 ? zero : zero + v * scale
    return `<rect x="${xx.toFixed(1)}" y="${yy}" width="${(Math.abs(v) * scale).toFixed(1)}" height="7" fill="${color}"/><text x="${(v >= 0 ? zero + v * scale + 3 : zero + 3).toFixed(1)}" y="${yy + 7}" font-size="8">${signed(v, 0)}</text>`
  }
  const body = rows
    .map((r, i) => {
      const y = 6 + i * 19
      return `<text x="0" y="${y + 11}" font-size="9.5">${r.label}</text>${bar(r.rescued, y, '#1d3f5c')}${bar(r.revenue, y + 8, '#c4a46a')}`
    })
    .join('')
  return `<line x1="${zero}" x2="${zero}" y1="0" y2="${rows.length * 19 + 4}" stroke="#000" stroke-width="0.8"/>${body}`
}

export function annexHtml(): string {
  assertVerdicts()
  const roiRows = [
    ['Throws it away', '0.0', '0', '0', '0'],
    [names.A, fmt(recovery.A.itemsRescuedPerDay, 1), fmt(recovery.A.mdlPerMonth), fmt(recovery.A.mdlPerYear), fmt(recovery.A.eurPerYear)],
    [names.B, fmt(recovery.B.itemsRescuedPerDay, 1), fmt(recovery.B.mdlPerMonth), fmt(recovery.B.mdlPerYear), fmt(recovery.B.eurPerYear)],
    ['<b>WasteLand</b>', `<b>${fmt(recovery.C.itemsRescuedPerDay, 1)}</b>`, `<b>${fmt(recovery.C.mdlPerMonth)}</b>`, `<b>${fmt(recovery.C.mdlPerYear)}</b>`, `<b>${fmt(recovery.C.eurPerYear)}</b>`],
    ...platform.map((p) => [`Surprise-bag app, 67% off, ${p.rate * 100}% commission`, fmt(recovery.A2.itemsRescuedPerDay, 1), fmt(p.mdlPerMonth), fmt(p.mdlPerYear), fmt(p.eurPerYear)]),
  ]
    .map(([a, b, c, d, e]) => `<tr><td class="l">${a}</td><td>${b}</td><td>${c}</td><td>${d}</td><td>${e}</td></tr>`)
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WasteLand — visual annex</title>
<style>
  @page { size: A4; margin: 1.3cm 1.6cm; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.12; color: #000; }
  h1 { font-size: 13pt; margin: 0 0 2pt; text-align: center; }
  h2 { font-size: 12pt; margin: 5pt 0 1pt; }
  p { margin: 0 0 1pt; }
  svg { width: 100%; height: auto; display: block; font-family: "Times New Roman", Times, serif; }
  .row { display: flex; gap: 12pt; align-items: flex-start; }
  .row > div { flex: 1; min-width: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 10.5pt; }
  th, td { border: 0.5pt solid #000; padding: 0 3pt; text-align: center; }
  td.l, th.l { text-align: left; }
  .note { font-size: 9.5pt; }
</style>
</head>
<body>
<h1>WasteLand — visual annex</h1>

<h2>Figure 1. System architecture and how the experiment is built</h2>
<svg viewBox="0 0 700 118" font-size="11">
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#333"/></marker></defs>
  <g stroke="#333" fill="#eef2f5">
    <rect x="4" y="6" width="118" height="40" rx="4"/><rect x="170" y="6" width="150" height="40" rx="4"/><rect x="368" y="6" width="150" height="40" rx="4"/>
    <rect x="170" y="72" width="150" height="40" rx="4" fill="#f4efe4"/><rect x="368" y="72" width="150" height="40" rx="4" fill="#f4efe4"/><rect x="566" y="72" width="130" height="40" rx="4" fill="#f4efe4"/>
  </g>
  <g text-anchor="middle">
    <text x="63" y="22">Browser (React)</text><text x="63" y="37" font-size="9.5">EN / RO / RU, canvas globe</text>
    <text x="245" y="22">Serverless API (Vercel)</text><text x="245" y="37" font-size="9.5">prices computed on the server</text>
    <text x="443" y="22">Upstash Redis</text><text x="443" y="37" font-size="9.5">atomic INCRBY reservations</text>
    <text x="245" y="88">Pricing code</text><text x="245" y="103" font-size="9.5">discountFor, discountedPrice</text>
    <text x="443" y="88">Simulator, 18,000 evenings</text><text x="443" y="103" font-size="9.5">same customers, 4 rules</text>
    <text x="631" y="88">benchmark.json</text><text x="631" y="103" font-size="9.5">Research page, documents</text>
  </g>
  <g stroke="#333" stroke-width="1.3" marker-end="url(#a)" fill="none">
    <line x1="122" y1="26" x2="168" y2="26"/><line x1="320" y1="26" x2="366" y2="26"/><line x1="245" y1="46" x2="245" y2="70"/>
    <line x1="320" y1="92" x2="366" y2="92"/><line x1="518" y1="92" x2="564" y2="92"/>
  </g>
</svg>
<p class="note">The simulator imports the deployed pricing functions, so the benchmark tests the code that runs on the server.</p>

<div class="row">
  <div>
    <h2>Figure 2. Portions rescued, ${meta.totalTrials.toLocaleString('en-US')} evenings</h2>
    <svg viewBox="0 0 310 118">${ruleBars('sellThrough')}</svg>
  </div>
  <div>
    <h2>Figure 3. Revenue per evening</h2>
    <svg viewBox="0 0 310 118">${ruleBars('revenue')}</svg>
  </div>
</div>
<p class="note">Same simulated customers for every rule. All four hypotheses are partially supported: ${signed(hyp.H1a.estimate)} portions and ${signed(hyp.H2a.estimate)} revenue against the fixed 50% discount (targets +25% and +18%), ${signed(hyp.H1b.estimate)} and ${signed(hyp.H2b.estimate)} against the linear markdown.</p>

<div class="row">
  <div>
    <h2>Figure 4. Why 1.3? Revenue against the exponent</h2>
    <svg viewBox="0 0 330 114">${sweepLine()}</svg>
    <p class="note">Plateau between 1.0 and 1.6 (within ${pct(plateauSpread)}); the gold point is the deployed 1.3.</p>
  </div>
  <div>
    <h2>Figure 5. Change vs fixed 50%, by assumption</h2>
    <svg viewBox="0 0 330 ${6 + 7 * 19 + 6}">${sensitivityBars()}</svg>
    <p class="note">Blue: portions rescued. Gold: revenue. If nobody waits, revenue falls below the fixed discount.</p>
  </div>
</div>

<h2>Table 1. B2B return for the reference bakery (${BAKERY.itemsPerDay} unsold items a day at ${BAKERY.priceMdl} MDL; €1 = ${BAKERY.mdlPerEur} MDL)</h2>
<table>
<tr><th class="l">If the venue…</th><th>Items rescued / day</th><th>MDL / month</th><th>MDL / year</th><th>€ / year</th></tr>
${roiRows}
</table>
<p class="note">Retail value ${mdl(retailValuePerMonth)} a month. Platform cost: 0 on Vercel Hobby and Upstash free tier for the demo; Hobby is non-commercial, so a pilot needs Vercel Pro (about USD 20 a month, ${eur(traffic[1].billEur, 2)} with steady traffic). The 25% and 30% commissions are the supervisor's figures and are unverified. Revenue comes from the simulation, scaled linearly; there is no real sales data.</p>
</body>
</html>
`
}
