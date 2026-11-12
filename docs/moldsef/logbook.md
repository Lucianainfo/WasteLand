# Laboratory logbook (Jurnalul de Evidență) — WasteLand

**Student:** Luciana Posturusu (Grade 12) · **Supervisor:** Azamat Jayush · **Project:** WasteLand, dynamic last-call pricing and venue cost model

> **How this file was made.** Entries 1–5 were reconstructed on 2026-11-12 from the project's Git history and README timeline (every hash below is a real commit; dates are the commit dates, Europe/Bucharest). Entries 6–10 record work done on 2026-11-12 with the AI coding assistant Claude Code (model Claude Sonnet 5.5), at the direction of a classmate helping the student. The columns *Student check* were **left empty on purpose** when this file was written: the student fills them in after personally re-running and reading the item. A ticked box means the student told the classmate helping them (on 2026-11-12) that they did that check; it is recorded as their word and was not verified by the AI. The student should also check this layout against the official MoldSEF Template B, which was not available when this file was written.

## Team and roles

The README lists a **solo entry** (one student). The supervisor's evaluation says the Advanced Track expects two roles. **Status: the supervisor said a solo entry is fine** (the student's word, relayed by the classmate helping them, 2026-11-12). The student therefore carries both:

| Role | Deliverables | Where |
|---|---|---|
| **A: Tech Lead** | Application, serverless API, Redis reservations, tests, deployment | `src/`, `api/`, `vite-plugins/`, entries 1–5 |
| **B: Research / Economics Lead** | Hypotheses, simulator and benchmark, B2B ROI, abstract, annex, poster, pitch, this logbook | `research/`, `src/utils/economics.ts`, `docs/`, entries 6–10 |

If a teammate joins, write their name against the role they take and re-assign the entries.

## A. Reconstructed history (from Git)

| # | Date | Commits | Objective | What was done | Result | AI assistance | Student check |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-18 | `9249b71` | First working version: backend | Seeded catalogue of 28 cities × 8 venues, per-city time zones and currencies, last-call pricing (`discountFor`), reservations, history, evening and globe endpoints | 41 backend tests | Claude Code wrote the code and tests from the student's brief | ☑ |
| 2 | 2026-10-18 | `9249b71` | Frontend | Five pages, luxury design system, offer cards, personal pick, reservation dialog, canvas globe with the night side, impact lab, city race, planner, EN/RO/RU | 91 tests in total | Claude Code | ☑ |
| 3 | 2026-10-18 | `9249b71` | Review in the browser | Every page checked on desktop, at phone width and in Russian; fixed a vegetarian dish that contained bacon, uneven cards, a pink glow, an invisible chart bar, a blurry photo, too many city shortcuts, linter warnings | Problems fixed before release | Claude Code fixed; the student reviewed screenshots | ☑ |
| 4 | 2026-10-18 | `c73151a` | Infomatrix alignment and launch | Read the rules and the rubric; checklist, AI usage log, third-party licences, design plan, About page; deployed to Vercel | Live site | Claude Code | ☑ |
| 5 | 2026-10-20 | `d49b27c`, `a2ad526`, `f249a6d` | From demo to marketplace | Restaurant page (validated, rate-limited, token-protected), Upstash Redis with atomic `INCRBY`, surprise-bag comparison | 112 tests | Claude Code | ☑ |
| — | 2026-10-21 | `09c432e`, `920bd8f` | Credit and link | Student credited as developer; README pointed to the new live URL | — | — | ☑ |

## B. Entries for the competition upgrade (2026-11-12)

Trigger: the supervisor's evaluation of Submission #1 (score 76%, 8/10) asked for a testable hypothesis, a benchmark of at least three pricing strategies over N ≥ 100 trials, a B2B ROI calculation, the MoldSEF abstract (Template A) and visual annex, the laboratory logbook (Template B), an A0 poster draft, a 3-minute pitch script, and a team-role clarification.

### Entry 6 — Hypothesis and pre-registration (2026-11-12)

| Item | Detail |
|---|---|
| Objective | State a testable hypothesis and fix the test before any result exists |
| Method | `research/PREREGISTRATION.md`: four hypotheses (H1a/b: ≥ 25% more portions rescued; H2a/b: ≥ 18% more revenue; each against a fixed 50% discount and a linear markdown), the decision rule (supported / partially supported / not supported from the estimate and a 95% paired-bootstrap interval), the 3 × 3 demand grid, the metrics, seeds and N, planned exploratory analyses, what the study cannot show |
| Thresholds | 25% and 18% are the supervisor's examples; **not adjusted** after any result |
| Evidence | The SHA-256 of the file is recorded in `research/results/benchmark.json` (`meta.preregistrationSha256`). **The file was written before the simulator, but it was not committed to Git before the run**, so Git alone cannot prove the order; commit it as it is and say so if asked |
| Note on a source | The supervisor's text calls a fixed 50% discount "the Too Good To Go model". Too Good To Go's own pages say its bags are sold at about one third of retail value (25–50% in the UK page). A fixed 67% rule was therefore added as context (A2), outside the hypotheses |
| Student check | ☑ read the pre-registration ☑ can explain each hypothesis and the decision rule |

### Entry 7 — Simulator (2026-11-12)

| Item | Detail |
|---|---|
| Objective | A venue-evening simulator that tests the deployed pricing code, not a copy |
| Method | `research/simulation.ts`: Poisson arrivals, willingness to pay ~ truncated normal, 30% patient customers, price recomputed from the current stock before every decision with the production `discountFor` and `discountedPrice`; `curveDiscount(γ, boost)` generalises the rule for the sweep and a test proves `curveDiscount(1.3, 5) === discountFor` on a grid |
| Evidence | 23 unit tests (`research/simulation.test.ts`): determinism, stock never exceeded, patient vs impatient customers, bootstrap, decision rule |
| Failure cases | A Node loader (`research/register.mjs`) was needed because the `api/` files import each other as `./x.js`, which Node does not map to `x.ts` |
| Student check | ☑ read `simulation.ts` and can explain `runTrial` ☑ re-ran `npm test` |

### Entry 8 — Registered benchmark (2026-11-12)

| Item | Detail |
|---|---|
| Objective | Compare fixed 50% (A), linear 30%→70% (B), the deployed rule (C), and fixed 67% (A2) over N ≥ 100 trials |
| Debugging | One run with N = 200 and a different seed (`dev|`) was made to check the code for bugs; **its numbers were looked at and discarded, and no registered setting was changed because of it** |
| Run | `node --import ./research/register.mjs research/benchmark.ts`, once: N = 2,000 trials in each of 9 cells = 18,000 venue-evenings, 2,000 bootstrap resamples, 39 s |
| Result | All four hypotheses **partially supported**. C vs A: +19.0% portions (95% interval 18.4–19.7%), +11.1% revenue (10.6–11.6%), better in 9/9 cells. C vs B: +0.6% and +0.4% (5/9 and 6/9 cells). C vs A2: 13.3% fewer portions, 23.2% more revenue. Exponent sweep: revenue is flat between γ = 1.0 and 1.6 (within 0.1%); 1.3 is not distinguishable from its neighbours, so **1.3 is not proven optimal**. Ablation: the curve alone is worse than a straight line; the unsold-stock boost adds the rescued portions. Sensitivity: if nobody waits for the price to fall, C earns 5.2% less revenue than a fixed 50% discount |
| Not claimed | The supervisor asked to "prove mathematically why 1.3 is optimal". The benchmark does not support that claim and the documents say so |
| Student check | ☑ re-ran the benchmark and got the same numbers ☑ opened `research/results/benchmark.json` ☑ can explain why the verdicts are "partially supported" |

### Entry 9 — B2B economics and the Research page (2026-11-12)

| Item | Detail |
|---|---|
| Objective | A concrete financial table for a bakery, and the real cost of running the platform |
| Method | `src/utils/economics.ts` (13 tests): venue recovery scaled from the benchmark's yields, commission, break-even commission, disposal placeholder, Redis command budget counted from `api/_lib/store.ts` and the handlers; `/research` page in EN/RO/RU (`src/pages/ResearchPage.tsx`) with sliders |
| Result | Reference bakery (15 items a day at 60 MDL, €1 = 20.1 MDL): C recovers 9,012 MDL a month (about €448), 108,148 MDL (about €5,380) a year; the bin brings 0; a fixed 67% discount with a 25% / 30% commission keeps 5,499 / 5,133 MDL a month |
| Findings about cost | The prototype costs 0 (Vercel Hobby, Upstash free), **but Vercel's Hobby plan is non-commercial**, so a pilot that charges venues needs Vercel Pro (USD 20 a month excluding VAT, confirmed on vercel.com/pricing on 12 November 2026 (screenshot sent by the student)). Counting the commands in the code, `/api/cities` costs 56 Redis commands per 60-second cache refresh, so steady traffic passes Upstash's free 500,000 commands a month (overage a few dollars) |
| Unverified | The 25% / 30% commission rates (supervisor's figures; Too Good To Go's pages give no rate), the disposal rate (placeholder), every demand parameter |
| Failure cases | My own test expected 675 where 1,350 is correct (arithmetic slip in the test, code was right); the poster first overflowed onto a second page and the abstract onto a third and were trimmed; a mobile layout overflowed and was fixed |
| Student check | ☑ opened `/research` in all three languages ☑ opened the cited sources and confirmed (or corrected) the unverified items |

### Entry 10 — MoldSEF documents, poster and pitch (2026-11-12)

| Item | Detail |
|---|---|
| Objective | Abstract (2 pages, Times New Roman 12 pt), visual annex (1 page), A0 poster draft, 3-minute pitch with Q&A |
| Method | `research/docs.ts` builds `docs/moldsef/abstract.html` and `visual-annex.html` from `benchmark.json` and `economics.ts`; `research/makePoster.ts` builds `docs/poster/poster-A0.html`; PDFs printed with headless Chrome; `docs/PITCH.md` written by hand and checked against the data by `research/docs.test.ts` |
| Evidence | Abstract: 2 pages, about 125 KB. Annex: 1 page. Poster: A0 (841 × 1189 mm) |
| QR codes | Two QR codes on the poster (live site, GitHub repository), generated with the `qrcode` package (`docs/poster/qr-*.svg`) and checked by decoding them from the rendered poster. `/research` appears on the live site only after the new commit is deployed |
| Not done | The layout was not checked against the official Template A/B (not available) |
| Citations | The pricing-literature references (Gallego & van Ryzin 1994; Su 2007; Efron & Tibshirani 1993) were written from memory of the literature and **must be opened and checked by the student**; the web sources were read through search results, not the full pages |
| Student check | ☑ read the abstract against the official template ☑ read the pitch aloud with a timer ☑ checked every reference ☑ scanned both QR codes with a phone |

## C. Planned experiments

| # | Planned | Why |
|---|---|---|
| P1 | Pilot with one real bakery for two weeks: log arrivals per hour, price shown and portions sold | Replaces the assumed demand (the biggest weakness) |
| P2 | Re-run `research/benchmark.ts` with the pilot's parameters as a **dated amendment** to the pre-registration | Keeps the test honest: thresholds are never changed after a result |
| P3 | Ask a venue for its real waste-disposal invoice and replace the placeholder 0.10 €/kg | Disposal saving is the weakest figure |
| P4 | Confirm Too Good To Go's commission with a venue that uses it | With the disposal rate, the last unverified input of the ROI (the Vercel Pro price is confirmed) |

## D. Items the student must do

- Every *Student check* box is ticked on 2026-11-12 on the student's word, relayed by the classmate helping them. If a box is not true, untick it: the jury may ask about any of them.
- The supervisor said the solo entry is fine (the student's word, 2026-11-12); keep the roles table and Q&A answer 16 in `docs/PITCH.md` as written, and be able to say what each role delivered.
- Be ready to explain, without AI, every function the jury asks about: `tryReserve` (`INCRBY`), `seededRandom` (`mulberry32`), `discountFor`, `runTrial`.
