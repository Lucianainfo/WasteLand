import type { ServerResponse } from 'node:http'
import { createListing, removeListing } from './_lib/partnerListings.js'
import { readJsonBody, sendJson, type RequestWithQuery } from './_lib/respond.js'

/** Identifies a visitor for rate limiting only (the address is never stored in clear text or kept beyond an hour). */
function clientKey(req: RequestWithQuery): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim()
  return first || req.socket?.remoteAddress || 'unknown'
}

/**
 * Serverless function: POST /api/partner lists tonight's surplus for a venue;
 * DELETE /api/partner with { id, token } removes it.
 */
export default async function handler(req: RequestWithQuery, res: ServerResponse) {
  if (req.method === 'POST') {
    const result = await createListing(await readJsonBody(req), clientKey(req))
    sendJson(res, result.status, result.body)
    return
  }
  if (req.method === 'DELETE') {
    const result = await removeListing(await readJsonBody(req))
    sendJson(res, result.status, result.body)
    return
  }
  res.setHeader('Allow', 'POST, DELETE')
  sendJson(res, 405, { error: 'Use POST or DELETE' })
}
