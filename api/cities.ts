import type { ServerResponse } from 'node:http'
import { getCities } from './_lib/getCities.js'
import { sendJson, type RequestWithQuery } from './_lib/respond.js'

/** Serverless function: GET /api/cities — every partner city and its pulse right now, for the globe. */
export default function handler(_req: RequestWithQuery, res: ServerResponse) {
  const result = getCities()
  sendJson(res, result.status, result.body, 60)
}
