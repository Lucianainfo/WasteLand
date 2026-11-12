/**
 * Builds docs/poster/poster-A0.html: an A0 vertical poster (841 x 1189 mm) from the same data as the abstract.
 *
 *   node --import ./research/register.mjs research/makePoster.ts
 *   chrome --headless --no-pdf-header-footer --print-to-pdf=docs/poster/poster-A0.pdf file:///.../docs/poster/poster-A0.html
 *
 * The two QR codes are the SVG files docs/poster/qr-site.svg and qr-code.svg, inlined into the poster.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { BAKERY } from './config.ts'
import {
  assertVerdicts, breakEven, eur, extra, fmt, hyp, mdl, meta, names, platform, plateauSpread, pct, pooled, range, recovery, retailValuePerMonth,
  ruleBars, rowsOrder, sens, signed, sensitivityBars, sweep, sweepLine, traffic,
} from './docs.ts'

assertVerdicts()

const OUT = fileURLToPath(new URL('../docs/poster/poster-A0.html', import.meta.url))
// QR codes (docs/poster/qr-*.svg) were generated once with the `qrcode` package and checked by decoding them
const qr = async (name: string) => (await readFile(new URL(`../docs/poster/${name}.svg`, import.meta.url), 'utf8')).replace(/^<?xml[^>]*>/, '')
const qrSite = await qr('qr-site')
const qrCode = await qr('qr-code')

const rows = rowsOrder
  .map((id) => `<tr><td class="l">${names[id]}</td><td>${pct(pooled[id].sellThrough)}</td><td>${eur(pooled[id].revenue, 2)}</td><td>${eur(pooled[id].surplus, 2)}</td></tr>`)
  .join('')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WasteLand — poster A0</title>
<style>
  @page { size: 841mm 1189mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { width: 841mm; height: 1189mm; font-family: Arial, Helvetica, sans-serif; font-size: 36pt; line-height: 1.22; color: #2a2118; background: #fff; position: relative; overflow: hidden; }
  header { background: #3f281c; color: #f4ead5; padding: 30mm 40mm 24mm; }
  header h1 { font-size: 90pt; line-height: 1.05; margin: 0; }
  header p { font-size: 36pt; margin: 10mm 0 0; color: #e8d9b8; }
  .band { display: flex; gap: 20mm; padding: 18mm 40mm; background: #f1e9dd; }
  .band > div { flex: 1; }
  .big { font-size: 100pt; font-weight: bold; color: #3f281c; line-height: 1; }
  .bandcap { font-size: 30pt; margin-top: 4mm; }
  main { padding: 16mm 40mm 0; }
  .cols { display: flex; gap: 14mm; }
  .cols > section { flex: 1; min-width: 0; }
  h2 { font-size: 53pt; margin: 0 0 6mm; color: #3f281c; border-bottom: 3mm solid #b8a58a; padding-bottom: 3mm; }
  section { margin-bottom: 12mm; }
  p { margin: 0 0 5mm; }
  .cap { font-size: 29pt; margin: 1mm 0 6mm; }
  .badge { display: inline-block; border: 1.2mm solid #b07a3a; color: #7a4d12; border-radius: 10mm; padding: 0.5mm 6mm; font-weight: bold; font-size: 29pt; margin: 2mm 0; }
  .hyp { border-left: 4mm solid #b8a58a; padding-left: 7mm; margin-bottom: 8mm; }
  svg { width: 100%; height: auto; display: block; font-family: Arial, Helvetica, sans-serif; }
  table { border-collapse: collapse; width: 100%; font-size: 29pt; margin-bottom: 5mm; }
  th, td { border: 0.8mm solid #2a2118; padding: 1.5mm 3mm; text-align: center; }
  td.l, th.l { text-align: left; }
  th { background: #f1e9dd; }
  ul { margin: 0; padding-left: 10mm; }
  li { margin-bottom: 3mm; }
  .qr { display: flex; gap: 12mm; align-items: center; }
  .qr .qrbox { width: 64mm; flex: none; text-align: center; font-size: 20pt; color: #e8d9b8; }
  .qr .qrbox svg { width: 64mm; height: 64mm; display: block; border: 2mm solid #fff; }
  footer { position: absolute; left: 0; right: 0; bottom: 0; background: #3f281c; color: #f4ead5; padding: 9mm 40mm; font-size: 26pt; }
  .url { font-size: 36pt; font-weight: bold; word-break: break-all; color: #fff; }
</style>
</head>
<body>
<header>
  <h1>Does a price that falls toward closing time rescue more food?</h1>
  <p>WasteLand · Luciana Posturusu (Grade 12) · Supervisor: Azamat Jayush · Software Development / Food waste</p>
</header>

<div class="band">
  <div><div class="big">1.05 bn t</div><div class="bandcap">of food were wasted worldwide in 2022 (UNEP Food Waste Index 2024)</div></div>
  <div><div class="big">${signed(hyp.H1a.estimate, 0)}</div><div class="bandcap">more portions rescued than with a fixed 50% discount (simulation)</div></div>
  <div><div class="big">${fmt(recovery.C.mdlPerMonth)} MDL</div><div class="bandcap">a month recovered by a bakery with ${BAKERY.itemsPerDay} unsold items a day at ${BAKERY.priceMdl} MDL</div></div>
</div>

<main>
<div class="cols">
  <section>
    <h2>Question and hypotheses</h2>
    <p>A venue has unsold food at closing time. WasteLand lowers its price from 30% to 70% off as closing approaches. Does that beat the simple rules a venue would otherwise use? Written down <b>before the simulation was run</b>, with the supervisor's targets.</p>
    <div class="hyp"><b>H1</b> Portions rescued: at least +25% against a fixed 50% discount (a) and a linear markdown (b).<br><span class="badge">PARTIALLY SUPPORTED</span><br>Observed ${signed(hyp.H1a.estimate)} (${range(hyp.H1a.low, hyp.H1a.high)}) and ${signed(hyp.H1b.estimate)}.</div>
    <div class="hyp"><b>H2</b> Revenue recovered: at least +18% against the same two rules.<br><span class="badge">PARTIALLY SUPPORTED</span><br>Observed ${signed(hyp.H2a.estimate)} (${range(hyp.H2a.low, hyp.H2a.high)}) and ${signed(hyp.H2b.estimate)}.</div>
    <p><b>The targets were missed and were not changed afterwards.</b></p>

    <h2>Method</h2>
    <p>${fmt(meta.totalTrials)} simulated venue-evenings in 9 demand scenarios. Customers arrive at random, each willing to pay a share of the full price; some wait for the price to fall. Four rules sell to <b>exactly the same customers</b>. The prices come from the deployed server code.</p>
    <p><b>There is no real sales data</b>: demand is an assumption, tested in 9 scenarios and 6 variations.</p>

    <h2>Limits and honesty</h2>
    <ul>
      <li>A simulation with assumed customers; no real sales data.</li>
      <li>1.3 is compared only with its neighbours; it is not proven optimal.</li>
      <li>Next: a pilot with one real bakery, then re-run the benchmark with its numbers.</li>
    </ul>
  </section>

  <section>
    <h2>Results</h2>
    <svg viewBox="0 0 310 118" style="font-size:11px">${ruleBars('sellThrough')}</svg>
    <p class="cap">Portions rescued</p>
    <svg viewBox="0 0 310 118" style="font-size:11px">${ruleBars('revenue')}</svg>
    <p class="cap">Revenue per evening</p>
    <table>
      <tr><th class="l">Rule</th><th>Rescued</th><th>Revenue</th><th>Surplus</th></tr>
      ${rows}
    </table>
    <p>Against a deep fixed 67% discount (the surprise-bag price) WasteLand rescues <b>${pct(Math.abs(extra.sellThrough_vs_A2.estimate))} fewer</b> portions but recovers <b>${pct(extra.revenue_vs_A2.estimate)} more</b> revenue.</p>

    <h2>Why 1.3?</h2>
    <svg viewBox="0 0 330 114">${sweepLine()}</svg>
    <p style="margin-top:4mm">Revenue against the exponent of the price curve: a <b>plateau, not a sharp optimum</b> (1.0 to 1.6 within ${pct(plateauSpread)}; peak at ${sweep.bestRevenueGamma}). The curve alone does not beat a straight line; the <b>boost for unsold stock</b> adds the rescued portions.</p>
  </section>

  <section>
    <h2>Money for a bakery</h2>
    <table>
      <tr><th class="l"></th><th>MDL / month</th><th>€ / year</th></tr>
      <tr><td class="l">Throws it away</td><td>0</td><td>0</td></tr>
      <tr><td class="l">Fixed 50% off</td><td>${fmt(recovery.A.mdlPerMonth)}</td><td>${fmt(recovery.A.eurPerYear)}</td></tr>
      <tr><td class="l"><b>WasteLand</b></td><td><b>${fmt(recovery.C.mdlPerMonth)}</b></td><td><b>${fmt(recovery.C.eurPerYear)}</b></td></tr>
      <tr><td class="l">App, 25% commission</td><td>${fmt(platform[0].mdlPerMonth)}</td><td>${fmt(platform[0].eurPerYear)}</td></tr>
      <tr><td class="l">App, 30% commission</td><td>${fmt(platform[1].mdlPerMonth)}</td><td>${fmt(platform[1].eurPerYear)}</td></tr>
    </table>
    <p>${BAKERY.itemsPerDay} unsold items a day at ${BAKERY.priceMdl} MDL (${mdl(retailValuePerMonth)} of retail value a month); €1 = ${BAKERY.mdlPerEur} MDL (BNM). Above about ${pct(breakEven, 0)} commission a fixed 67% discount without commission would earn more. <b>Commissions are the supervisor's figures, unverified.</b></p>
    <p><b>Cost to run:</b> 0 for the demo (Vercel Hobby + Upstash free). Hobby is non-commercial, so a paying pilot needs Vercel Pro, about ${eur(traffic[1].billEur, 2)} a month.</p>

    <h2>What it depends on</h2>
    <svg viewBox="0 0 330 ${6 + 7 * 19 + 6}">${sensitivityBars()}</svg>
    <p style="margin-top:4mm">Change against a fixed 50% discount (blue: portions, gold: revenue). If <b>nobody waits</b> for the price to fall, WasteLand earns ${signed(sens.patient0.revenueVsA.estimate)} revenue.</p>
  </section>
</div>
</main>

<footer>
  <div class="qr">
    <div class="qrbox">${qrSite}<div>live site</div></div>
    <div class="qrbox">${qrCode}<div>source code</div></div>
    <div>
      <div class="url">waste-land-beta.vercel.app</div>
      <div class="url">github.com/Lucianainfo/WasteLand</div>
      <div style="margin-top:5mm"><b>AI cited:</b> Claude Code (Anthropic): Claude Opus 5.5 (app) and Claude Sonnet 5.5 (research upgrade). Every prompt: docs/AI_USAGE.md. Code MIT-licensed.</div>
    </div>
  </div>
</footer>
</body>
</html>
`

await mkdir(fileURLToPath(new URL('../docs/poster/', import.meta.url)), { recursive: true })
await writeFile(OUT, html)
console.log(`wrote ${OUT}`)
