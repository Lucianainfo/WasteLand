import { Redis } from '@upstash/redis'
import type { Category, ItemKey } from './catalog.js'

/** A surplus listing created by a restaurant on the partner page. */
export interface PartnerListing {
  /** `${cityId}.p.${random}.${localDate}` — same 4-part shape as demo offer ids. */
  id: string
  cityId: string
  date: string
  venueName: string
  category: Category
  item: ItemKey
  portions: number
  /** Full price of one portion, in the city's currency. */
  originalPrice: number
  /** Local closing time, in minutes after midnight. */
  closeMinutes: number
  createdAt: number
  /** SHA-256 of the secret token given to the partner; only the hash is stored. */
  tokenHash: string
}

/**
 * Everything that must survive between requests. In production it lives in an Upstash Redis
 * database (connected through the Vercel marketplace); in local development and tests it lives
 * in memory, so the project still runs with no account and no setup.
 */
export interface Store {
  readonly kind: 'redis' | 'memory'
  /** Portions already reserved, per offer id. */
  reserved(offerIds: string[]): Promise<Map<string, number>>
  /** Adds `quantity` to an offer's reservations only if the total stays within `capacity`. Atomic in Redis. */
  tryReserve(offerId: string, quantity: number, capacity: number): Promise<boolean>
  listings(cityId: string, date: string): Promise<PartnerListing[]>
  saveListing(listing: PartnerListing): Promise<void>
  deleteListing(listing: PartnerListing): Promise<void>
  /** Counts one hit for `key`; returns false once there have been more than `limit` hits in the window. */
  allow(key: string, limit: number, windowSeconds: number): Promise<boolean>
}

/** Data is kept two days, then deleted automatically — enough for "today" in every time zone. */
const TTL_SECONDS = 2 * 24 * 3600

const reservedKey = (offerId: string) => `res:${offerId}`
const listingsKey = (cityId: string, date: string) => `listings:${cityId}:${date}`

export function createMemoryStore(): Store {
  const reservations = new Map<string, number>()
  const listings = new Map<string, Map<string, PartnerListing>>()
  const hits = new Map<string, { count: number; resetAt: number }>()

  return {
    kind: 'memory',
    async reserved(offerIds) {
      return new Map(offerIds.map((id) => [id, reservations.get(id) ?? 0]))
    },
    async tryReserve(offerId, quantity, capacity) {
      const current = reservations.get(offerId) ?? 0
      if (current + quantity > capacity) return false
      reservations.set(offerId, current + quantity)
      return true
    },
    async listings(cityId, date) {
      return [...(listings.get(listingsKey(cityId, date))?.values() ?? [])]
    },
    async saveListing(listing) {
      const key = listingsKey(listing.cityId, listing.date)
      if (!listings.has(key)) listings.set(key, new Map())
      listings.get(key)!.set(listing.id, listing)
    },
    async deleteListing(listing) {
      listings.get(listingsKey(listing.cityId, listing.date))?.delete(listing.id)
    },
    async allow(key, limit, windowSeconds) {
      const now = Date.now()
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
        return true
      }
      entry.count++
      return entry.count <= limit
    },
  }
}

export function createRedisStore(redis: Redis): Store {
  return {
    kind: 'redis',
    async reserved(offerIds) {
      if (offerIds.length === 0) return new Map()
      const values = await redis.mget<(number | null)[]>(...offerIds.map(reservedKey))
      return new Map(offerIds.map((id, i) => [id, Number(values[i] ?? 0)]))
    },
    async tryReserve(offerId, quantity, capacity) {
      // INCRBY is atomic: two people reserving the last portion at the same moment can't both win.
      const key = reservedKey(offerId)
      const total = await redis.incrby(key, quantity)
      if (total > capacity) {
        await redis.decrby(key, quantity)
        return false
      }
      await redis.expire(key, TTL_SECONDS)
      return true
    },
    async listings(cityId, date) {
      const all = await redis.hgetall<Record<string, PartnerListing>>(listingsKey(cityId, date))
      return all ? Object.values(all) : []
    },
    async saveListing(listing) {
      const key = listingsKey(listing.cityId, listing.date)
      await redis.hset(key, { [listing.id]: listing })
      await redis.expire(key, TTL_SECONDS)
    },
    async deleteListing(listing) {
      await redis.hdel(listingsKey(listing.cityId, listing.date), listing.id)
    },
    async allow(key, limit, windowSeconds) {
      const k = `rate:${key}`
      const count = await redis.incr(k)
      if (count === 1) await redis.expire(k, windowSeconds)
      return count <= limit
    },
  }
}

let shared: Store | null = null

/**
 * The store for this server process. Uses Redis when the Vercel/Upstash environment variables are
 * present (KV_REST_API_* or UPSTASH_REDIS_REST_*); otherwise falls back to memory.
 */
export function getStore(env: NodeJS.ProcessEnv = process.env): Store {
  if (shared) return shared
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  shared = url && token ? createRedisStore(new Redis({ url, token })) : createMemoryStore()
  return shared
}
