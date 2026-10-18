/**
 * Units reserved per offer id. Kept in memory: enough for a demo, and each serverless
 * instance starts empty — a production version would store this in a database
 * (see "Problems faced" in the README).
 */
const store = new Map<string, number>()

export function reservedUnits(offerId: string): number {
  return store.get(offerId) ?? 0
}

export function addReservation(offerId: string, quantity: number): void {
  store.set(offerId, reservedUnits(offerId) + quantity)
}

/** Number of reservations made so far — used to make pickup codes unique. */
export function reservationCount(): number {
  let total = 0
  for (const value of store.values()) total += value
  return total
}

/** Test helper. */
export function clearReservations(): void {
  store.clear()
}
