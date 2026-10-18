/** Signed shortest angular difference from `from` to `to`, in degrees. */
export function angleDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180
}

/**
 * The point on Earth where the sun is directly overhead, as [lon, lat]. Approximate: it ignores the
 * equation of time, which moves it by at most about 4°. The night side is the hemisphere around
 * its antipode — where most kitchens have already closed for the day.
 */
export function subsolarPoint(date: Date): [number, number] {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = (date.getTime() - start) / 86_400_000
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10))
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60
  return [angleDelta(0, (12 - utcHours) * 15), declination]
}

/** Centre of the night hemisphere. */
export function antisolarPoint(date: Date): [number, number] {
  const [lon, lat] = subsolarPoint(date)
  return [angleDelta(0, lon + 180), -lat]
}
