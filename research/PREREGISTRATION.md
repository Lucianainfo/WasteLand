# Pre-registration: last-call pricing benchmark

Written on **2026-11-12**, **before** the benchmark simulator or any strategy comparison was run. Nothing below was changed after a result was seen. The benchmark (`research/benchmark.ts`) implements exactly this document; anything it reports beyond this list is labelled *exploratory*.

## Question

WasteLand lists a venue's unsold food in the last three hours before closing and lowers the price as closing approaches. The production rule (`discountFor` in `api/_lib/pricing.ts`) is a discount that rises from 30% to 70% along `p^1.3`, plus up to 5 extra points when much of the batch is still unsold. Does this rule recover more food and more money than the two simple rules a venue would otherwise use: one fixed discount all evening, or a linear markdown?

## Hypotheses

The supervisor proposed the wording and the numbers (≥ 25% more sell-through, ≥ 18% more revenue recovered, against static or linear discounts). They are used here as the targets and were **not** adjusted after any result.

| Id | Statement | Target |
|---|---|---|
| **H1a** | Method C raises the end-of-evening **sell-through** (share of portions sold) relative to Baseline A (fixed 50% off) | ≥ +25% |
| **H1b** | Method C raises sell-through relative to Baseline B (linear 30%→70%) | ≥ +25% |
| **H2a** | Method C raises the **venue revenue recovered** (EUR per venue-evening) relative to Baseline A | ≥ +18% |
| **H2b** | Method C raises revenue recovered relative to Baseline B | ≥ +18% |

*Remark written before the run:* B and C share the same endpoints (30% at opening, 70% at closing), so the gap between them is limited by construction. H1b and H2b are tested because the supervisor asked for the comparison; they are reported in the same words whichever way they land.

## Methods compared

| Id | Rule | Where it comes from |
|---|---|---|
| **A** | Fixed 50% off all evening | The supervisor's description of the surprise-bag model |
| **B** | Linear markdown: discount = round(30 + 40·p) % | Supervisor's Baseline B |
| **C** | Production rule: `discountFor(p, left/Q)`, price by `discountedPrice` | The code that is deployed (imported, not re-implemented) |
| **A2** | Fixed 67% off all evening (price = one third of full value) | Added for context: Too Good To Go states its bags are sold at about one third of the contents' retail value. **Reported, not part of any hypothesis.** |

`p` is the share of the 180-minute window already elapsed. All prices pass through the production `discountedPrice` rounding.

## Simulation model

One **trial** is one venue-evening. All four methods are run on the *same* simulated customers (paired comparison).

* **Stock.** Q portions left when the window opens, Q uniform on {2,…,8} (the range used by the demo network, `batchFor`). The item is drawn uniformly from the 24 catalogue items; its full price P is the catalogue `baseEur`.
* **Customers.** The number of interested customers arriving during the window is Poisson(D·Q). Each arrives at a minute drawn uniformly from the window, wants one portion, and has a **willingness to pay** w·P, where w ~ Normal(m, 0.20) truncated to [0.05, 1].
* **Purchase rule.** A customer buys if the displayed price at that moment is ≤ w·P and stock remains. The displayed price is recomputed from the current stock before every decision (the leftover boost depends on it, as in the app).
* **Patient customers.** A share h = 0.30 of customers do not leave when the price is too high: they keep checking every minute until the window closes and buy at the first minute the price is low enough and stock remains. This stops the simulation from rewarding a falling price by assuming nobody notices it will fall.
* **Time grid.** One-minute steps, minutes 0…179.

**Demand grid (primary).** Nine cells, equal weight, all reported:

| | m = 0.35 | m = 0.45 | m = 0.55 |
|---|---|---|---|
| D = 0.75 (low demand) | cell 1 | cell 2 | cell 3 |
| D = 1.5 (medium) | cell 4 | cell 5 | cell 6 |
| D = 3.0 (high) | cell 7 | cell 8 | cell 9 |

**There is no real WasteLand sales data.** D, m and the Normal shape are assumptions chosen to bracket plausible situations; they are **not** calibrated to any venue. Every number the benchmark produces is therefore a statement about *this model*, not a measurement of real customers. The grid is the guard against choosing one flattering setting. *Plausibility check, not calibration:* the demo network assumes that 65% of a batch is rescued by closing; the medium cells under C should be of that order of magnitude, and this will be reported.

**Size.** N = 2,000 trials per cell, 18,000 trials in total (the requirement is N ≥ 100). Seed string of trial *i* in cell *c*: `wl|v1|c|i` (mulberry32 over FNV-1a, the generator already used by the app).

## Metrics (per trial, then averaged)

1. **Sell-through** = portions sold / Q (share of portions rescued from the bin). *Primary for H1.*
2. **Revenue recovered** = Σ of prices paid, EUR. *Primary for H2.*
3. Customer surplus = Σ (w·P − price paid) over buyers, EUR.
4. Food rescued, kg = Σ catalogue weight of the portions sold.

Pooled value of a method = the equal-weight mean of its nine cell means.

## Decision rule

Relative improvement = pooled mean of C ÷ pooled mean of the baseline − 1. A 95% **paired bootstrap interval** (2,000 resamples of trials *within each cell*, the same trial indices for both methods; seed string `wl|boot|v1`) gives the uncertainty.

| Outcome | Condition |
|---|---|
| **Supported** | point estimate ≥ target **and** interval lower bound > 0 |
| **Partially supported** | interval lower bound > 0, but point estimate < target |
| **Not supported** | otherwise (including any result where C is not better) |

Also reported for each hypothesis: in how many of the nine cells C beats the baseline.

## Reported but not part of the decision rule

1. **Exponent sweep.** The pricing curve's exponent γ ∈ {0.5, 0.75, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0} (boost kept at 5 points), on the primary grid: pooled revenue and sell-through for each γ, the γ with the highest revenue, and whether γ = 1.3 is statistically distinguishable from it. This is how "why 1.3?" is answered: by showing how flat or steep the revenue curve is, not by assuming 1.3 is optimal. *The production code is not changed by what this shows.* Any change would be a dated amendment before a new run.
2. **Ablation.** γ = 1 without boost (= B), γ = 1 with boost, γ = 1.3 without boost, γ = 1.3 with boost (= C).
3. **Sensitivity** (each changes one assumption of the primary model): patient share h = 0 and h = 0.6; arrivals concentrated late (density ∝ time elapsed) or early (density ∝ time remaining); WTP spread 0.10 and 0.30.
4. Per-cell tables for every method, including A2.

## Economics (no hypothesis test)

The B2B model is built on the same simulator, so no revenue figure is typed by hand.

* **Reference bakery** (the supervisor's example): Q = 15 unsold items a day, full price 60 MDL, at the BNM official rate of about 20.1 MDL per EUR (5–6 Nov 2026 pages showed 20.1773 and 20.1089; rounded). 30 trading days a month, 360 a year. Revenue per day for each method comes from the simulator on the nine-cell grid (Q fixed at 15, P fixed).
* **Comparison with the bin:** the food is already produced, so its cost is sunk; recovered revenue is the venue's gain. Disposal cost avoided is added separately with an **unsourced placeholder rate**, shown separately and left out of the headline.
* **Comparison with a commission platform:** a fixed-67%-off surprise-bag rule (A2) with a commission of 25% and 30% of revenue. *These percentages are the supervisor's figures; they could not be confirmed from Too Good To Go's own pages (which say only that there is an annual fee plus a commission that varies by country).*
* **Cost of running WasteLand:** Vercel Hobby and the Upstash free tier cost nothing, but Vercel's Hobby plan is limited to personal, non-commercial use, so a paying venue pilot needs at least Vercel Pro (about USD 20 a month, from secondary sources). The Upstash command budget is computed from the actual number of Redis commands per request in `api/_lib/`.

## What this study cannot show

* How real customers behave. There is no sales data from any venue; a field pilot is the missing experiment.
* That 1.3 is *the* optimum in any absolute sense. It can only be compared with its neighbours under the assumed demand.
* Effects beyond one-portion purchases, no-shows, venue labour or packaging cost, and any change in what venues cook because they expect to sell leftovers.
* Anything about customers outside the nine demand cells.

## Process commitments

* The simulator is debugged with a different seed prefix (`dev|`) and N = 200; those numbers are discarded and no registered setting is changed because of them.
* The registered run is made once with the settings above. If a bug is found afterwards, it is fixed and the run is repeated with the same settings, and the logbook says so.
* Anything learned later is added as a dated amendment, never by editing this file.
