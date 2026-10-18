import { useEffect, useRef } from 'react'
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import landData from 'world-atlas/land-110m.json'
import { PULSE_COLORS } from '../constants/urgency'
import type { GlobeCity } from '../types/food'
import { angleDelta, antisolarPoint } from '../utils/sun'

const topology = landData as unknown as Topology<{ land: GeometryCollection }>
const land = feature(topology, topology.objects.land)
const graticule = geoGraticule10()

const MAX_LAT = 60
const HIT_RADIUS = 18
const TAP_MAX_MOVE = 6

interface RescueGlobeProps {
  cities: GlobeCity[]
  selectedId: string | null
  ariaLabel: string
  onHover: (city: GlobeCity | null) => void
  onSelect: (city: GlobeCity) => void
}

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function nightPolygon(date: Date) {
  return geoCircle().center(antisolarPoint(date)).radius(90)()
}

export function RescueGlobe({ cities, selectedId, ariaLabel, onHover, onSelect }: RescueGlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const citiesRef = useRef(cities)
  const selectedRef = useRef(selectedId)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    citiesRef.current = cities
    selectedRef.current = selectedId
    onHoverRef.current = onHover
    onSelectRef.current = onSelect
  })

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const reduced = prefersReducedMotion()
    const projection = geoOrthographic().clipAngle(90).precision(0.5)
    const path = geoPath(projection, ctx)

    // Start over Europe in the evening light.
    const center = { lon: 20, lat: 30 }
    const velocity = { lon: 0 }
    let focus: { lon: number; lat: number } | null = null
    let hovered: GlobeCity | null = null
    let pointerInside = false
    let idleUntil = 0
    let size = 0
    let last = performance.now()
    let raf = 0
    let running = false
    let night = nightPolygon(new Date())
    let nightUpdatedAt = performance.now()
    const drag = { active: false, id: -1, startX: 0, startY: 0, lastX: 0, lastY: 0, lastT: 0, moved: false }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = Math.round(wrap!.getBoundingClientRect().width)
      if (size === 0) return
      canvas!.width = size * dpr
      canvas!.height = size * dpr
      canvas!.style.height = `${size}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      projection.translate([size / 2, size / 2]).scale(size / 2 - 12)
    }

    function visibleCities(): Array<{ city: GlobeCity; x: number; y: number; facing: number }> {
      const centerPoint: [number, number] = [center.lon, center.lat]
      const out: Array<{ city: GlobeCity; x: number; y: number; facing: number }> = []
      for (const city of citiesRef.current) {
        const coords: [number, number] = [city.lon, city.lat]
        const distance = geoDistance(coords, centerPoint)
        if (distance >= Math.PI / 2) continue
        const p = projection(coords)
        if (p) out.push({ city, x: p[0], y: p[1], facing: Math.cos(distance) })
      }
      return out
    }

    function cityAt(clientX: number, clientY: number): GlobeCity | null {
      const rect = canvas!.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      let best: GlobeCity | null = null
      let bestDistance = HIT_RADIUS
      for (const v of visibleCities()) {
        const d = Math.hypot(v.x - x, v.y - y)
        if (d < bestDistance) {
          best = v.city
          bestDistance = d
        }
      }
      return best
    }

    function setHovered(city: GlobeCity | null) {
      if (hovered?.id === city?.id) return
      hovered = city
      canvas!.style.cursor = city ? 'pointer' : drag.active ? 'grabbing' : 'grab'
      onHoverRef.current(city)
    }

    function draw(now: number) {
      if (!running) return
      const dt = Math.min(now - last, 50)
      last = now

      if (now - nightUpdatedAt > 60_000) {
        night = nightPolygon(new Date())
        nightUpdatedAt = now
      }

      if (focus) {
        const dLon = angleDelta(center.lon, focus.lon)
        const dLat = focus.lat - center.lat
        center.lon += dLon * 0.09
        center.lat += dLat * 0.09
        if (Math.abs(dLon) < 0.15 && Math.abs(dLat) < 0.15) focus = null
      } else if (!drag.active) {
        if (Math.abs(velocity.lon) > 0.0005) {
          center.lon += velocity.lon * dt
          velocity.lon *= 0.94
        } else if (!reduced && !pointerInside && now > idleUntil) {
          center.lon -= dt * 0.006
        }
      }
      center.lat = clamp(center.lat, -MAX_LAT, MAX_LAT)
      center.lon = angleDelta(0, center.lon)
      projection.rotate([-center.lon, -center.lat])

      const radius = projection.scale()
      const cx = size / 2
      const cy = size / 2
      ctx!.clearRect(0, 0, size, size)

      // Soft golden halo around the planet
      const halo = ctx!.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.08)
      halo.addColorStop(0, 'rgba(226,184,92,0.18)')
      halo.addColorStop(1, 'rgba(226,184,92,0)')
      ctx!.fillStyle = halo
      ctx!.fillRect(0, 0, size, size)

      const ocean = ctx!.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.1, cx, cy, radius)
      ocean.addColorStop(0, '#3a2c20')
      ocean.addColorStop(1, '#17110c')
      ctx!.beginPath()
      path({ type: 'Sphere' })
      ctx!.fillStyle = ocean
      ctx!.fill()

      ctx!.beginPath()
      path(graticule)
      ctx!.strokeStyle = 'rgba(232,217,184,0.07)'
      ctx!.lineWidth = 0.6
      ctx!.stroke()

      ctx!.beginPath()
      path(land)
      ctx!.fillStyle = '#6b5440'
      ctx!.fill()
      ctx!.strokeStyle = 'rgba(232,217,184,0.35)'
      ctx!.lineWidth = 0.5
      ctx!.stroke()

      // The night side, where most kitchens have already closed
      ctx!.beginPath()
      path(night)
      ctx!.fillStyle = 'rgba(8,6,4,0.5)'
      ctx!.fill()

      ctx!.beginPath()
      path({ type: 'Sphere' })
      ctx!.strokeStyle = 'rgba(232,217,184,0.45)'
      ctx!.lineWidth = 1
      ctx!.stroke()

      const time = now / 1000
      const labelled: Array<{ name: string; x: number; y: number }> = []

      for (const { city, x, y, facing } of visibleCities()) {
        const hex = PULSE_COLORS[city.pulse]
        const isHovered = hovered?.id === city.id
        const isSelected = selectedRef.current === city.id
        const scale = 0.55 + 0.45 * facing

        if (city.pulse === 'live') {
          const pulse = reduced ? 0.35 : ((time + city.lon * 0.013) % 2.4) / 2.4
          ctx!.beginPath()
          ctx!.arc(x, y, (4 + pulse * 16) * scale, 0, Math.PI * 2)
          ctx!.strokeStyle = rgba(hex, (1 - pulse) * 0.7)
          ctx!.lineWidth = 1.3
          ctx!.stroke()

          const glow = ctx!.createRadialGradient(x, y, 0, x, y, 18 * scale)
          glow.addColorStop(0, rgba(hex, isHovered ? 0.6 : 0.42))
          glow.addColorStop(1, rgba(hex, 0))
          ctx!.fillStyle = glow
          ctx!.beginPath()
          ctx!.arc(x, y, 18 * scale, 0, Math.PI * 2)
          ctx!.fill()
        }

        ctx!.beginPath()
        ctx!.arc(x, y, (isHovered ? 6.5 : city.pulse === 'live' ? 4.6 : 3.4) * scale, 0, Math.PI * 2)
        ctx!.fillStyle = hex
        ctx!.fill()
        ctx!.strokeStyle = 'rgba(23,17,12,0.9)'
        ctx!.lineWidth = 1.4
        ctx!.stroke()

        if (isSelected) {
          ctx!.beginPath()
          ctx!.arc(x, y, 11 * scale, 0, Math.PI * 2)
          ctx!.strokeStyle = '#f3e7cf'
          ctx!.lineWidth = 1.2
          ctx!.stroke()
        }
        if (isHovered || isSelected) labelled.push({ name: city.name, x, y: y - 16 * scale })
      }

      ctx!.font = 'italic 500 15px "Cormorant Garamond", Georgia, serif'
      ctx!.textAlign = 'center'
      for (const label of labelled) {
        ctx!.lineWidth = 4
        ctx!.strokeStyle = 'rgba(23,17,12,0.85)'
        ctx!.strokeText(label.name, label.x, label.y)
        ctx!.fillStyle = '#f3e7cf'
        ctx!.fillText(label.name, label.x, label.y)
      }

      raf = requestAnimationFrame(draw)
    }

    function start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(draw)
    }

    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    function onPointerDown(e: PointerEvent) {
      canvas!.setPointerCapture(e.pointerId)
      Object.assign(drag, { active: true, id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), moved: false })
      velocity.lon = 0
      focus = null
      canvas!.style.cursor = 'grabbing'
    }

    function onPointerMove(e: PointerEvent) {
      if (drag.active && e.pointerId === drag.id) {
        const degreesPerPixel = 57.3 / projection.scale()
        const dx = e.clientX - drag.lastX
        const dy = e.clientY - drag.lastY
        const now = performance.now()
        center.lon -= dx * degreesPerPixel
        center.lat = clamp(center.lat + dy * degreesPerPixel, -MAX_LAT, MAX_LAT)
        velocity.lon = (-dx * degreesPerPixel) / Math.max(now - drag.lastT, 1)
        drag.lastX = e.clientX
        drag.lastY = e.clientY
        drag.lastT = now
        if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_MAX_MOVE) drag.moved = true
        return
      }
      pointerInside = true
      setHovered(cityAt(e.clientX, e.clientY))
    }

    function onPointerUp(e: PointerEvent) {
      if (!drag.active || e.pointerId !== drag.id) return
      drag.active = false
      idleUntil = performance.now() + 2500
      if (!drag.moved) {
        velocity.lon = 0
        const city = cityAt(e.clientX, e.clientY)
        if (city) {
          setHovered(city)
          focus = { lon: city.lon, lat: clamp(city.lat, -50, 50) }
          onSelectRef.current(city)
        }
      } else if (Math.abs(velocity.lon) > 0.08) {
        velocity.lon = Math.sign(velocity.lon) * 0.08
      }
      canvas!.style.cursor = hovered ? 'pointer' : 'grab'
    }

    function onPointerLeave() {
      pointerInside = false
      if (!drag.active) setHovered(null)
    }

    function onPointerCancel() {
      drag.active = false
    }

    resize()
    canvas.style.cursor = 'grab'
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(wrap)
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.01 })
    visibility.observe(wrap)

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointercancel', onPointerCancel)

    return () => {
      stop()
      resizeObserver.disconnect()
      visibility.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [])

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-[520px]">
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} className="block w-full select-none" style={{ touchAction: 'pan-y' }} />
    </div>
  )
}
