// Lets `node --import ./research/register.mjs research/benchmark.ts` run the project's own TypeScript:
// the api/ files import each other as './x.js' (what Vercel's build expects), which Node would not map to x.ts.
import { register } from 'node:module'

register('./resolveTs.mjs', import.meta.url)
