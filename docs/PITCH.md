# WasteLand — 3-minute pitch and 7-minute Q&A

Speaker: Luciana Posturusu. This is a script to learn from, not to read out: say it in your own words and practise with a timer. Every number below is in `research/results/benchmark.json`, the abstract or the Research page; `research/docs.test.ts` fails if they drift apart.

## The pitch (about 3 minutes, about 430 words)

**0:00 · The problem (25 s)**
"1.05 billion tonnes of food were wasted in 2022, and 19% of the food that reaches consumers ends up in the bin. A lot of it is wasted at one moment: closing time. The bakery has bread it cannot keep until tomorrow, the restaurant has dishes it cannot resell, and it pays to throw them away."

**0:25 · The idea (30 s)**
"WasteLand lists that food in the last three hours before closing, in every city's own time zone, and the price falls as closing approaches, from 30% off to 70% off. The customer pays less, the venue recovers money instead of paying to bin the food, and the food is eaten. A win, win, win. The server computes every price, so nobody can edit a request to pay less."

**0:55 · The question (40 s)**
"But I did not want to just say the price curve is good. So I asked: does it beat the simple rules a venue would use anyway, a fixed 50% discount or a straight linear markdown? I wrote the hypotheses before running anything: at least 25% more portions rescued and at least 18% more revenue. Then I simulated 18,000 venue-evenings in nine demand scenarios, with four pricing rules selling to exactly the same customers. The prices come from the code that runs on the server."

**1:35 · The honest result (50 s)**
"All four hypotheses are only partially supported. Against a fixed 50% discount, WasteLand rescues 19.0% more portions and recovers 11.1% more revenue, in all nine scenarios. That is real, but below my targets, and I did not move the targets. Against the linear markdown the difference is 0.6% and 0.4%: practically the same. My exponent 1.3 is not a sharp optimum: anything from 1.0 to 1.6 gives the same revenue within 0.1%. What actually adds rescued portions is the boost for unsold stock. A deep fixed 67% discount rescues more food: WasteLand rescues 13.3% fewer portions than it, but recovers 23.2% more revenue. And if nobody waits for the price to fall, a fixed 50% discount earns more than WasteLand."

**2:25 · The money (25 s)**
"For a bakery with 15 unsold items a day at 60 lei, WasteLand recovers about 9,012 lei a month, around 448 euro, and about 5,380 euro a year, against zero if the food is thrown away. The demo costs nothing, but Vercel's free plan is non-commercial, so a paying pilot needs about 18.52 euro a month."

**2:50 · Demo, limits and AI (10 s)**
"This is a simulation with assumed customers; the next step is a pilot with one real bakery. Claude Code wrote much of the code, and every prompt is in AI_USAGE.md."

### Demo steps

1. Open the live site, page *Tonight*, search *Chișinău*: offers with price, discount and pickup window.
2. Open one offer: show the discount badge and the portions left. Reserve one portion: the pickup code appears; the portions left drop.
3. Page *Research*: the four verdicts, the benchmark table, the exponent sweep, and the bakery calculator (move the sliders).
4. Fallback if the site is slow: screenshots of steps 1–3.

## Questions and short answers (7 minutes)

Before you use any answer, read the code or the page it points to, so that it is true for you.

1. **Why did you not change the targets when you saw the result?** `research/PREREGISTRATION.md` was written before the simulator was run. Changing a target after seeing the result would make the test meaningless.
2. **Is this real data?** No. It is a simulation with assumed customers; the page, the abstract and the poster say so. A pilot with one bakery is the missing experiment.
3. **How does the simulation work?** One trial is one venue-evening: 2 to 8 unsold portions, customers arrive at random minutes of the 3-hour window, each is willing to pay a share of the full price, and a customer buys if the price shown at that moment is low enough and stock remains. 30% of customers are patient: they keep checking until the price has fallen. All four rules sell to the same customers.
4. **Why is the benchmark fair?** The customers are generated once per trial and reused for every rule, and the confidence intervals come from a paired bootstrap that resamples the same trials for both rules.
5. **What is a bootstrap?** Resample the 18,000 trials with replacement, recompute the improvement, repeat 2,000 times; the middle 95% of those results is the interval.
6. **Why 1.3?** It was a design choice, not a result. The sweep shows revenue is flat between 1.0 and 1.6; 1.3 is the highest point but cannot be told apart from its neighbours. I cannot claim it is optimal.
7. **What does the boost do?** When much of the batch is still unsold late in the window, the discount gets up to 5 extra points. In the ablation it is the boost, not the curve, that adds rescued portions.
8. **Why "partially supported"?** The rule was fixed in advance: supported only if the estimate reaches the target and the 95% interval stays above zero. Here the interval is above zero but the estimate is below the target.
9. **Why does a deep fixed discount rescue more food?** Because its price is below WasteLand's for most of the evening, so more customers buy. It also earns the venue less. Which is better depends on whether you want money or food rescued.
10. **What if customers do not wait for lower prices?** Then WasteLand earns less than a fixed 50% discount (−5.2% revenue in the "nobody waits" variation). The whole advantage depends on some customers noticing the price fall.
11. **Where do the money numbers come from?** The bakery is the supervisor's example. The exchange rate (about 20.1 lei per euro) is from the National Bank of Moldova pages of 5–6 November 2026. The 25% and 30% commissions are the supervisor's figures, not confirmed on Too Good To Go's pages. The Vercel Pro price, USD 20 a month excluding VAT, is on vercel.com/pricing (checked on 12 November 2026).
12. **Why is it not free to run?** Vercel's Hobby plan is for personal, non-commercial use. The globe endpoint also costs 56 Redis commands per cache refresh, so steady traffic goes over Upstash's 500,000 free commands a month; the overage is a few dollars.
13. **How do two people not buy the last portion?** `tryReserve` in `api/_lib/store.ts` runs the Redis command `INCRBY`, which is atomic: it adds the quantity and returns the new total. If the total is above the capacity, it undoes it with `DECRBY` and the server answers 409. Two simultaneous buyers cannot both be under the limit. Known limit: for a few milliseconds a failed attempt is counted, so another visitor may briefly see one portion fewer.
14. **How does `mulberry32` work?** It is a small random-number generator. `seededRandom` turns a text seed such as `paris|2026-10-18` into a 32-bit number with the FNV-1a hash, then every call adds the constant `0x6D2B79F5` to the state and scrambles the bits with multiplications and xor-shifts. Same seed, same sequence: so every visitor sees the same offers on a given day, and the tests can check exact values.
15. **How does the price stay correct across time zones?** `localClock` reads the wall time in the city's IANA zone with `Intl.DateTimeFormat`, the offer id contains the local date, and the server recomputes the price from its own clock at every reservation.
16. **Team roles?** *(Fill in with the supervisor's answer: if this is a solo entry, say that you carried both Role A, tech lead, and Role B, research and economics. If a teammate joins, name who did what.)*
17. **How did you use AI?** Claude Code wrote the code, tests and documents from my directions. The prompts, what it did and how I checked it are in `docs/AI_USAGE.md`. *(Say honestly what you did yourself and be ready to explain every function.)*
18. **What would you do next?** A pilot with one bakery, measuring arrivals and what customers will pay, then re-running this benchmark with those numbers as a dated amendment.
