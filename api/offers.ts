import type { ServerResponse } from 'node:http'
import { getOffers } from './_lib/getOffers.js'
import { queryParam, sendJson, type RequestWithQuery } from './_lib/respond.js'

/**
 * Serverless function (Vercel format): GET /api/offers?city=...
 * Not cached — prices change minute by minute as closing time approaches.
 */
export default async function handler(req: RequestWithQuery, res: ServerResponse) {
  const result = await getOffers(queryParam(req, 'city'))
  sendJson(res, result.status, result.body)
}
