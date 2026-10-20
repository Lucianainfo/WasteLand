import type { ServerResponse } from 'node:http'
import { getEvening } from './_lib/getEvening.js'
import { queryParam, sendJson, type RequestWithQuery } from './_lib/respond.js'

/** Serverless function: GET /api/evening?city=... — the rest of today, hour by hour. */
export default async function handler(req: RequestWithQuery, res: ServerResponse) {
  const result = await getEvening(queryParam(req, 'city'))
  sendJson(res, result.status, result.body, 60)
}
