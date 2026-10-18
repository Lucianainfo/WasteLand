import { useEffect, useRef, useState } from 'react'
import { useEveningMood } from '../context/eveningMood'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import { lerp, paramsForEvening, type ParticleParams } from '../utils/mood'

const MAX_PARTICLES = 160

interface Particle {
  x: number
  y: number
  seed: number
  size: number
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Golden motes drifting over the whole page, like dust in candlelight. They follow the last
 * city looked at: more open offers = more motes; offers at last call = warmer, quicker light.
 * Parameters ease toward each new state instead of jumping.
 */
export function EveningBackground() {
  const { mood } = useEveningMood()
  const { t } = useLanguage()
  const [reduced] = useState(prefersReducedMotion)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef<ParticleParams>(paramsForEvening(null, false))

  useEffect(() => {
    targetRef.current = paramsForEvening(mood ? mood.liveOffers : null, mood?.lastCall ?? false)
  }, [mood])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (reduced || !canvas || !ctx) return

    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: Math.random(),
      y: Math.random(),
      seed: Math.random() * 1000,
      size: Math.random(),
    }))
    const current: ParticleParams = { ...targetRef.current, rgb: [...targetRef.current.rgb] }
    let width = 0
    let height = 0
    let phase = 0
    let last = performance.now()
    let frame = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const time = now / 1000
      const target = targetRef.current
      const ease = 1 - Math.exp(-dt * 1.4)

      current.count = lerp(current.count, target.count, ease)
      current.speed = lerp(current.speed, target.speed, ease)
      current.breathSeconds = lerp(current.breathSeconds, target.breathSeconds, ease)
      current.alpha = lerp(current.alpha, target.alpha, ease)
      current.rgb = [lerp(current.rgb[0], target.rgb[0], ease), lerp(current.rgb[1], target.rgb[1], ease), lerp(current.rgb[2], target.rgb[2], ease)]

      phase += (dt * Math.PI * 2) / current.breathSeconds
      const [r, g, b] = current.rgb.map(Math.round)
      ctx!.clearRect(0, 0, width, height)

      const speedPx = current.speed * 50
      const visible = Math.ceil(current.count)
      for (let i = 0; i < visible && i < MAX_PARTICLES; i++) {
        const p = particles[i]
        const fade = Math.min(1, Math.max(0, current.count - i))
        const angle = Math.sin(p.x * 4 + time * 0.15 + p.seed) * Math.PI + Math.cos(p.y * 3 - time * 0.1) * Math.PI * 0.5
        p.x += (Math.cos(angle) * speedPx * dt) / width
        p.y += (Math.sin(angle) * speedPx * dt - 5 * dt) / height
        if (p.x < 0) p.x += 1
        else if (p.x > 1) p.x -= 1
        if (p.y < 0) p.y += 1
        else if (p.y > 1) p.y -= 1

        // Each mote twinkles on its own rhythm, all of them swelling together with the "breath".
        const twinkle = 0.55 + 0.45 * Math.sin(phase + p.seed)
        const radius = 0.8 + p.size * 1.8
        const x = p.x * width
        const y = p.y * height
        const alpha = current.alpha * twinkle * fade
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha * 0.22})`
        ctx!.beginPath()
        ctx!.arc(x, y, radius * 3.2, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx!.beginPath()
        ctx!.arc(x, y, radius, 0, Math.PI * 2)
        ctx!.fill()
      }

      frame = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />
      {mood && (
        <div className="pointer-events-none fixed bottom-5 left-5 z-40 hidden max-w-[min(30rem,calc(100vw-2.5rem))] items-center gap-2.5 rounded-full bg-[var(--cocoa-deep)]/90 px-4 py-2 text-[11px] tracking-wide text-[var(--champagne)] shadow-lg backdrop-blur sm:flex">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ background: mood.lastCall ? '#c0683f' : '#e2b85c' }} />
          <span className="truncate">
            {fill(t.mood.reacts, { city: mood.city, n: mood.liveOffers })}
            {mood.lastCall && ` · ${t.mood.lastCall}`}
          </span>
        </div>
      )}
    </>
  )
}
