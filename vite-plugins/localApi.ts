import type { Plugin } from 'vite'
import citiesHandler from '../api/cities.js'
import eveningHandler from '../api/evening.js'
import historyHandler from '../api/offer-history.js'
import offersHandler from '../api/offers.js'
import partnerHandler from '../api/partner.js'
import reserveHandler from '../api/reserve.js'

/**
 * Serves the /api/* endpoints from Vite's own dev server, running the exact same
 * handlers as the serverless functions in api/ — no Vercel CLI, account or deploy needed.
 */
export function localApiPlugin(): Plugin {
  const routes = {
    '/api/offers': offersHandler,
    '/api/offer-history': historyHandler,
    '/api/evening': eveningHandler,
    '/api/cities': citiesHandler,
    '/api/reserve': reserveHandler,
    '/api/partner': partnerHandler,
  }

  return {
    name: 'local-api-wasteland',
    configureServer(server) {
      for (const [route, handler] of Object.entries(routes)) {
        // Connect strips the mount path from req.url; restore it so handlers can read the query string.
        server.middlewares.use(route, (req, res) => handler(Object.assign(req, { url: req.originalUrl ?? req.url }), res))
      }
    },
  }
}
