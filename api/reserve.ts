import type { ServerResponse } from 'node:http'
import { readJsonBody, sendJson, type RequestWithQuery } from './_lib/respond.js'
import { reserveOffer } from './_lib/reserveOffer.js'

/** Serverless function: POST /api/reserve with { offerId, quantity } — holds portions and returns a pickup code. */
export default async function handler(req: RequestWithQuery, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    sendJson(res, 405, { error: 'Use POST' })
    return
  }
  const result = reserveOffer(await readJsonBody(req))
  sendJson(res, result.status, result.body)
}
