import type { IncomingMessage, ServerResponse } from 'node:http'

/** Writes a JSON response; successful responses can opt into CDN caching. */
export function sendJson(res: ServerResponse, status: number, body: unknown, cacheSeconds = 0) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  if (status === 200 && cacheSeconds > 0) {
    res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`)
  } else {
    res.setHeader('Cache-Control', 'no-store')
  }
  res.end(JSON.stringify(body))
}

export interface RequestWithQuery extends IncomingMessage {
  query?: Record<string, string | string[]>
  body?: unknown
}

/** Reads one query parameter, whether the platform pre-parsed the query (Vercel) or not (Vite dev server). */
export function queryParam(req: RequestWithQuery, name: string): string | null {
  const parsed = req.query?.[name]
  if (typeof parsed === 'string') return parsed
  return new URL(req.url ?? '', 'http://localhost').searchParams.get(name)
}

const MAX_BODY_BYTES = 2048

/** Reads a small JSON request body; returns null if it is missing, too large or not valid JSON. */
export async function readJsonBody(req: RequestWithQuery): Promise<unknown> {
  if (req.body !== undefined) return req.body
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY_BYTES) return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
