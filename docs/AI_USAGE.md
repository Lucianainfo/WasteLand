# Responsible AI usage log

Infomatrix asks Software Development entrants to *"cite all prompts, models, or AI resources used and give proper credit in their documentation and presentation."* This file is that citation: what was used, the prompts, what the AI produced, and how a human checked it.

## Tool and model

| | |
|---|---|
| Tool | [Claude Code](https://claude.com/claude-code), Anthropic's AI coding assistant (desktop app) |
| Models | Claude Opus 5.5 (`claude-opus-5-5`) for the application (prompts 1–5); Claude Sonnet 5.5 (`claude-sonnet-5-5`) for the research upgrade of 12 November 2026 (prompt 6). Anthropic. |
| Role | Pair programmer: wrote code, tests, translations and documentation from the student's instructions |
| Not used | No AI-generated images. Photographs are from Unsplash, statistics are from UNEP/FAO, the chart is from Our World in Data, the video is from TED. |

## Prompts

The student's prompts, verbatim (spelling as typed):

1. > ok i want you to make me a websites with the EXACT SAME structure as the ClimaWatch one but with the topic of: When a restaurant/coffee shop etc. is about to close for the day but not all of the foods have been sold they are listed to this site and you could buy them for a lower price. OFC the problem is foodwaste, so in this scenario you win bypaying less for the same producta and the restaurant wins bc they dont throw away the food and the earths food isntwasted its all a win/win/win situation. This project should also come with all of the structure as climawatch. but the design shoud be more fancy JUST LIKE IN THIS SITE: https://hotelaurelia.online.

2. > Set this repository's commit name and email to the Lucianainfo account.

3. > use vervel to publish the site and also let the site have all of the guidelines schecked from this site because i have to register it on a championship: https://www.infomatrix.ro

4. > is the site good?

   The AI gave an honest review: strong design, technical depth and documentation, but a risk on originality (Too Good To Go already exists), no way for restaurants to list food, and reservations lost when the server restarts. It proposed three improvements.

5. > add the 3 things and after explain to me like i knew nothing in coding what did you use in this project (verce;, adatabse etc....)

6. > ok now WasteLand project. Lucianas projects guidelines are these

   *(Prompt 6 was typed by a classmate helping the student, followed by the supervisor's evaluation message of 12 November 2026, pasted in full: score 76% (8/10), and four action items: a testable scientific hypothesis, a benchmark of three or more pricing algorithms over N ≥ 100 trials, a concrete B2B ROI table, and the MoldSEF abstract, visual annex, laboratory logbook, A0 poster draft, pitch script and team-role clarification.)*

## What the AI did with them

| Prompt | Output |
|---|---|
| 1 | Read the student's earlier project (ClimaWatch) and mirrored its structure: same five pages, serverless `api/` + local Vite emulator, EN/RO/RU, tests. Studied the reference site's visual language (palette, typefaces, layout) without copying its code or images. Designed the food-rescue model: time-zone-aware pickup windows, server-side dynamic pricing, reservations, profile-based recommendation, globe, impact lab, planner. Wrote the code, 91 tests and the README. |
| 2 | Configured Git in this repository only, using GitHub's private no-reply address. |
| 4–5 | Added the partner page where restaurants list their own surplus (validated on the server, rate-limited, removable only with a secret token), connected an Upstash Redis database through Vercel so reservations and listings persist and the last portion can't be sold twice, added the "Not another surprise bag" comparison and 21 new tests, then explained the technologies to the student in plain language. |
| 3 | Read the Infomatrix regulations and the Software Development rubric, added this log, the "About the project" page, the design sketches, the third-party licence list and the requirements checklist in the README, then deployed to Vercel. |
| 6 | Read the code and wrote `research/PREREGISTRATION.md` (hypotheses, decision rule, demand grid) before any simulation; a venue-evening simulator that imports the deployed pricing functions; a benchmark of four pricing rules over 18,000 venue-evenings with paired bootstrap intervals, an exponent sweep, an ablation and a sensitivity analysis; `src/utils/economics.ts` (B2B return, commission, Redis cost); the trilingual `/research` page; the abstract, visual annex, A0 poster, pitch and logbook; 63 new tests. It looked up Too Good To Go, Vercel, Upstash and BNM figures on the web. **What it reported honestly:** all four hypotheses are only partially supported, 1.3 is not proven optimal, and the advantage disappears if no customer waits for the price to fall. It also noticed that Vercel's free plan is non-commercial and that the globe endpoint costs 56 Redis commands per cache refresh. |

## Human oversight

- Every product decision came from the student: the problem, the win-win-win model, the reference design, and the requirement to follow ClimaWatch's structure.
- The code is run, not just generated. 175 automated tests (`npm test`), a TypeScript build (`npm run build`) and a linter (`npm run lint`) all pass.
- Every page was checked in a real browser on desktop and at phone width (375 px), in all three languages. Problems found in that review were fixed before release (see the iterations in the README), for example a dish labelled vegetarian that contains bacon.
- For prompt 6, every number in the abstract, annex, poster and pitch comes from `research/results/benchmark.json` or from the cost model, and tests fail if they drift apart. A first run with another seed (N = 200) was used only to check the code for bugs; its numbers were discarded and no registered setting was changed. **Not verified by a human yet:** the web sources were read through search results, not their full pages (only the Vercel Pro price was then confirmed on vercel.com/pricing from a screenshot sent by the student on 12 November 2026); the pricing-literature references were written from memory of the literature; the commission rates (25–30%) are the supervisor's figures and could not be confirmed. The student must check these, tick the checklists in `docs/moldsef/logbook.md` only after really doing each item, and be able to explain the code without AI.
- Every statistic links to its source. The impact calculator lists its factors and sources in the interface.
- The site says openly that the partner venues are a simulated demo network.

## Reproducing the process

```bash
npm install
npm test        # 175 tests
npm run lint
npm run build
npm run dev     # http://localhost:5173
```

The Git history shows each step of the work.
