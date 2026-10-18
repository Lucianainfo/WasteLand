import { useEffect, useState } from 'react'
import { PULSE_COLORS } from '../constants/urgency'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { CityPulse, GlobeCity } from '../types/food'
import { fetchCities } from '../utils/foodApi'
import { RescueGlobe } from './RescueGlobe'
import { SectionHeading } from './SectionHeading'

interface GlobeSectionProps {
  selectedId: string | null
  onSelect: (city: GlobeCity) => void
}

const PULSES: CityPulse[] = ['live', 'later', 'closed']

export default function GlobeSection({ selectedId, onSelect }: GlobeSectionProps) {
  const { t } = useLanguage()
  const [cities, setCities] = useState<GlobeCity[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hovered, setHovered] = useState<GlobeCity | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCities().then((result) => {
      if (cancelled) return
      if (result) {
        setCities(result)
        setStatus('ready')
      } else {
        setStatus('error')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  let caption = t.globe.idle
  if (status === 'loading') caption = t.globe.loading
  else if (status === 'error') caption = t.globe.error
  else if (hovered) {
    const template = hovered.pulse === 'live' ? t.globe.detailLive : hovered.pulse === 'later' ? t.globe.detailLater : t.globe.detailClosed
    caption = fill(template, { city: hovered.name, time: hovered.localTime, n: hovered.liveNow })
  }

  // Shortcut chips: the busiest cities at last call right now.
  const liveCities = cities
    .filter((c) => c.pulse === 'live')
    .sort((a, b) => b.liveNow - a.liveNow)
    .slice(0, 8)

  return (
    <section className="relative overflow-hidden bg-[var(--bg-dark)] py-24 text-[var(--champagne)] sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(158,124,79,0.22),transparent_60%)]" />
      <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="text-center lg:text-left">
          <SectionHeading eyebrow={t.globe.eyebrow} line1={t.globe.title1} line2={t.globe.title2} dark align="left" className="!text-center lg:!text-left" />
          <p className="mx-auto mt-6 max-w-md text-[var(--champagne)]/80 lg:mx-0">{t.globe.subtitle}</p>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
            {PULSES.map((pulse) => (
              <li key={pulse} className="flex items-center gap-2 text-xs tracking-wide text-[var(--champagne)]/80">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PULSE_COLORS[pulse] }} />
                {t.globe[pulse]}
              </li>
            ))}
          </ul>

          {liveCities.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {liveCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelect(city)}
                  className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
                    selectedId === city.id ? 'border-[var(--champagne)] bg-[var(--champagne)] text-[var(--cocoa-deep)]' : 'border-[var(--champagne)]/30 hover:border-[var(--champagne)]'
                  }`}
                >
                  {city.name} · {city.localTime}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <RescueGlobe cities={cities} selectedId={selectedId} ariaLabel={t.globe.ariaLabel} onHover={setHovered} onSelect={onSelect} />
          <p className="font-display mt-4 flex min-h-[2rem] items-center justify-center gap-2 text-center text-lg italic text-[var(--bg-card)]" aria-live="polite">
            {hovered && <span className="inline-block h-2 w-2 rounded-full not-italic" style={{ background: PULSE_COLORS[hovered.pulse] }} />}
            {caption}
          </p>
          <p className="mt-1 text-center text-xs text-[var(--champagne)]/55">{t.globe.hint}</p>
        </div>
      </div>

      <ul className="sr-only">
        {cities.map((city) => (
          <li key={city.id}>
            <button type="button" onClick={() => onSelect(city)}>
              {city.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
