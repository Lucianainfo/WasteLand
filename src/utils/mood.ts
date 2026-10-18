export interface ParticleParams {
  count: number
  speed: number
  /** Seconds per "glow" cycle. */
  breathSeconds: number
  rgb: [number, number, number]
  alpha: number
}

/** No city chosen yet: a few slow motes of champagne gold. */
const CALM: ParticleParams = { count: 34, speed: 0.16, breathSeconds: 8, rgb: [184, 165, 138], alpha: 0.32 }

/**
 * The background follows the last city looked at. The more offers are open, the more golden
 * motes drift by; when some of them are at last call, the light warms toward copper and the
 * rhythm quickens — food is about to be thrown away somewhere close.
 */
export function paramsForEvening(liveOffers: number | null, lastCall: boolean): ParticleParams {
  if (liveOffers === null) return CALM
  const busy = Math.min(1, liveOffers / 10)
  const base: ParticleParams = {
    count: 34 + Math.round(busy * 110),
    speed: 0.16 + busy * 0.22,
    breathSeconds: 8 - busy * 2.5,
    rgb: [196, 164, 104],
    alpha: 0.34 + busy * 0.08,
  }
  if (!lastCall) return base
  return { ...base, speed: base.speed + 0.12, breathSeconds: Math.max(3, base.breathSeconds - 2), rgb: [190, 128, 62] }
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
