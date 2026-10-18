import type { ServerResponse } from 'node:http'
import { getHistory } from './_lib/getHistory.js'
import { queryParam, sendJson, type RequestWithQuery } from './_lib/respond.js'

/** Serverless function: GET /api/offer-history?city=... — finished days never change, so the CDN may cache them. */
export default function handler(req: RequestWithQuery, res: ServerResponse) {
  const result = getHistory(queryParam(req, 'city'))
  sendJson(res, result.status, result.body, 1800)
}
