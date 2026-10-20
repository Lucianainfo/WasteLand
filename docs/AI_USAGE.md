# Responsible AI usage log

Infomatrix asks Software Development entrants to *"cite all prompts, models, or AI resources used and give proper credit in their documentation and presentation."* This file is that citation: what was used, the prompts, what the AI produced, and how a human checked it.

## Tool and model

| | |
|---|---|
| Tool | [Claude Code](https://claude.com/claude-code), Anthropic's AI coding assistant (desktop app) |
| Model | Claude Opus 5.5 (`claude-opus-5-5`), Anthropic |
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

## What the AI did with them

| Prompt | Output |
|---|---|
| 1 | Read the student's earlier project (ClimaWatch) and mirrored its structure: same five pages, serverless `api/` + local Vite emulator, EN/RO/RU, tests. Studied the reference site's visual language (palette, typefaces, layout) without copying its code or images. Designed the food-rescue model: time-zone-aware pickup windows, server-side dynamic pricing, reservations, profile-based recommendation, globe, impact lab, planner. Wrote the code, 91 tests and the README. |
| 2 | Configured Git in this repository only, using GitHub's private no-reply address. |
| 4–5 | Added the partner page where restaurants list their own surplus (validated on the server, rate-limited, removable only with a secret token), connected an Upstash Redis database through Vercel so reservations and listings persist and the last portion can't be sold twice, added the "Not another surprise bag" comparison and 21 new tests, then explained the technologies to the student in plain language. |
| 3 | Read the Infomatrix regulations and the Software Development rubric, added this log, the "About the project" page, the design sketches, the third-party licence list and the requirements checklist in the README, then deployed to Vercel. |

## Human oversight

- Every product decision came from the student: the problem, the win-win-win model, the reference design, and the requirement to follow ClimaWatch's structure.
- The code is run, not just generated. 112 automated tests (`npm test`), a TypeScript build (`npm run build`) and a linter (`npm run lint`) all pass.
- Every page was checked in a real browser on desktop and at phone width (375 px), in all three languages. Problems found in that review were fixed before release (see the iterations in the README), for example a dish labelled vegetarian that contains bacon.
- Every statistic links to its source. The impact calculator lists its factors and sources in the interface.
- The site says openly that the partner venues are a simulated demo network.

## Reproducing the process

```bash
npm install
npm test        # 112 tests
npm run lint
npm run build
npm run dev     # http://localhost:5173
```

The Git history shows each step of the work.
