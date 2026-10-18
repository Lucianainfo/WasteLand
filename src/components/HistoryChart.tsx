import { useState, type PointerEvent } from 'react'
import type { HistoryStatus } from '../hooks/useOffers'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { HistoryDay } from '../types/food'
import { areaPath, niceCeiling, smoothLinePath } from '../utils/chartPath'
import { formatNumber, localeFor } from '../utils/format'

const WIDTH = 600
const HEIGHT = 230
const PAD = { left: 44, right: 18, top: 18, bottom: 36 }
const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom
const BASE_Y = PAD.top + PLOT_H

function formatDay(date: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', ...options })
}

interface HistoryChartProps {
  cityName: string
  days: HistoryDay[]
  status: HistoryStatus
}

/** Portions rescued over the last seven evenings — hand-drawn SVG, no chart library. */
export function HistoryChart({ cityName, days, status }: HistoryChartProps) {
  const { t, lang } = useLanguage()
  const locale = localeFor(lang)
  const [active, setActive] = useState<number | null>(null)

  const ceiling = niceCeiling(Math.max(0, ...days.map((d) => d.meals)), 10)
  const xFor = (i: number) => PAD.left + (days.length === 1 ? PLOT_W / 2 : (i / (days.length - 1)) * PLOT_W)
  const yFor = (value: number) => PAD.top + PLOT_H - (value / ceiling) * PLOT_H
  const points = days.map((d, i) => ({ x: xFor(i), y: yFor(d.meals) }))
  const line = smoothLinePath(points, PAD.top, BASE_Y)
  const area = areaPath(line, points, BASE_Y)
  const gridValues = [0, ceiling / 2, ceiling]
  const weekMeals = days.reduce((sum, d) => sum + d.meals, 0)
  const weekKg = days.reduce((sum, d) => sum + d.kg, 0)

  function trackPointer(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    points.forEach((p, i) => {
      if (Math.abs(p.x - x) < Math.abs(points[nearest].x - x)) nearest = i
    })
    setActive(nearest)
  }

  const activeDay = active !== null ? days[active] : null

  return (
    <div className="card-lux p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h3 className="font-display text-3xl text-[var(--text)]">{fill(t.home.historyTitle, { city: cityName })}</h3>
        {status === 'ready' && (
          <div className="flex gap-6 text-right">
            <p>
              <span className="font-display block text-2xl text-[var(--cocoa)]">{formatNumber(weekMeals, lang)}</span>
              <span className="eyebrow text-[0.56rem] text-[var(--text-soft)]">{t.home.historyPortions}</span>
            </p>
            <p>
              <span className="font-display block text-2xl text-[var(--cocoa)]">{formatNumber(weekKg, lang)}</span>
              <span className="eyebrow text-[0.56rem] text-[var(--text-soft)]">{t.home.historyKg}</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        {status === 'loading' && (
          <div>
            <div className="skeleton-shimmer h-52" />
            <p className="mt-3 text-xs text-[var(--text-soft)]">{t.home.historyLoading}</p>
          </div>
        )}

        {status === 'error' && <p className="text-sm text-[var(--text-muted)]">{t.home.historyError}</p>}

        {status === 'ready' && days.length > 0 && (
          <div className="relative">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full touch-pan-y select-none"
              role="img"
              aria-label={`${fill(t.home.historyTitle, { city: cityName })}: ${days.map((d) => `${formatDay(d.date, locale, { weekday: 'long' })} ${d.meals}`).join(', ')}`}
              onPointerMove={trackPointer}
              onPointerDown={trackPointer}
              onPointerLeave={() => setActive(null)}
            >
              <defs>
                <linearGradient id="historyArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>

              {gridValues.map((value) => (
                <g key={value}>
                  <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(value)} y2={yFor(value)} stroke="var(--border)" strokeWidth="1" />
                  <text x={PAD.left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" fill="var(--text-soft)">
                    {value}
                  </text>
                </g>
              ))}

              <path d={area} fill="url(#historyArea)" className="chart-area" />
              <path d={line} fill="none" pathLength={1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="var(--cocoa)" className="chart-line" />

              {activeDay && <line x1={points[active!].x} x2={points[active!].x} y1={PAD.top} y2={BASE_Y} stroke="var(--gold)" strokeWidth="1" strokeDasharray="3 4" />}

              {days.map((d, i) => (
                <g key={d.date}>
                  <circle
                    cx={points[i].x}
                    cy={points[i].y}
                    r={active === i ? 7 : 4.5}
                    fill="var(--bg-card)"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    className="chart-dot"
                    style={{ animationDelay: `${0.9 + i * 0.1}s`, transition: 'r 0.15s ease' }}
                  />
                  <text x={points[i].x} y={HEIGHT - 12} textAnchor="middle" fontSize="11" letterSpacing="1.5" fill="var(--text-muted)" style={{ textTransform: 'uppercase' }}>
                    {formatDay(d.date, locale, { weekday: 'short' })}
                  </text>
                </g>
              ))}
            </svg>

            {activeDay && active !== null && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap bg-[var(--cocoa-deep)] px-4 py-2.5 text-xs text-[var(--champagne)] shadow-lg"
                style={{ left: `${(points[active].x / WIDTH) * 100}%`, top: `${(points[active].y / HEIGHT) * 100}%`, marginTop: -14 }}
              >
                <p className="eyebrow text-[0.55rem] text-[var(--gold)]">{formatDay(activeDay.date, locale, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                <p className="font-display text-lg text-[var(--bg-card)]">
                  {activeDay.meals} {t.home.historyPortions}
                </p>
                <p>
                  {formatNumber(activeDay.kg, lang, 1)} {t.home.historyKg}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs italic text-[var(--text-soft)]">{t.home.historyNote}</p>
    </div>
  )
}
