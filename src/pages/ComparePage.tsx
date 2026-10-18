import { useEffect, useState } from 'react'
import { ErrorBanner } from '../components/ErrorBanner'
import { PageHero } from '../components/PageHero'
import { HERO_IMAGES } from '../constants/images'
import { useCompare } from '../hooks/useCompare'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { CityOffers } from '../types/food'
import { barWidths, compareCities, summarize, type CitySummary } from '../utils/compare'
import { formatNumber } from '../utils/format'

const METRICS: Array<keyof CitySummary> = ['portionsTonight', 'liveNow', 'avgDiscount', 'kgTonight', 'co2Tonight']

const MATCHUPS: Array<[string, string]> = [
  ['Bucharest', 'Chisinau'],
  ['Paris', 'London'],
  ['New York', 'Toronto'],
  ['Tokyo', 'Seoul'],
]

const COLOR_A = 'var(--cocoa)'
const COLOR_B = '#c2a46e'

function Bar({ width, color, delay }: { width: number; color: string; delay: number }) {
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="h-1.5 overflow-hidden bg-[var(--border)]">
      <div
        className="h-full"
        style={{
          width: grown ? `${width > 0 ? Math.max(width, 1.5) : 0}%` : '0%',
          background: color,
          transition: 'width 1.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  )
}

function CityTile({ data, summary, side, winner }: { data: CityOffers; summary: CitySummary; side: 'A' | 'B'; winner: boolean }) {
  const { t, lang } = useLanguage()
  return (
    <div
      className={`relative min-w-0 px-4 py-8 text-center transition-transform duration-700 sm:px-6 ${
        winner ? 'bg-[var(--cocoa-deep)] text-[var(--champagne)] sm:scale-[1.03]' : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]'
      }`}
    >
      <span className={`font-display absolute left-4 top-3 text-lg italic ${winner ? 'text-[var(--gold)]' : 'text-[var(--text-soft)]'}`}>{side}</span>
      <p className="eyebrow text-[0.6rem] opacity-70">{fill(t.common.localTime, { time: data.city.localTime })}</p>
      <p className="font-display mt-2 break-words text-3xl sm:text-4xl">{data.city.name}</p>
      <p className="font-display mt-3 text-5xl tabular-nums">{formatNumber(summary.kgTonight, lang, 1)}</p>
      <p className="mt-1 text-xs opacity-75">{t.compare.metrics.kgTonight}</p>
    </div>
  )
}

function Results({ a, b }: { a: CityOffers; b: CityOffers }) {
  const { t, lang } = useLanguage()
  const sa = summarize(a)
  const sb = summarize(b)
  const verdict = compareCities(sa, sb)
  const winner = verdict.winner === 'a' ? a : b
  const loser = verdict.winner === 'a' ? b : a

  return (
    <div className="mt-14 space-y-10 animate-[fadeIn_0.4s_ease-in]">
      <div className="grid grid-cols-2 items-center gap-3 sm:gap-6">
        <CityTile data={a} summary={sa} side="A" winner={verdict.winner === 'a'} />
        <CityTile data={b} summary={sb} side="B" winner={verdict.winner === 'b'} />
      </div>

      <div className="text-center">
        <span className="ornament mx-auto w-40" aria-hidden="true">
          ◆
        </span>
        {verdict.winner === 'tie' ? (
          <p className="font-display mt-5 text-3xl italic text-[var(--cocoa)]">{t.compare.tie}</p>
        ) : (
          <>
            <p className="font-display mt-5 text-3xl text-[var(--text)] sm:text-4xl">{fill(t.compare.winner, { city: winner.city.name })}</p>
            {verdict.pct > 0 && <p className="mt-2 text-[var(--text-muted)]">{fill(t.compare.winnerDetail, { pct: verdict.pct, other: loser.city.name })}</p>}
          </>
        )}
      </div>

      <div className="card-lux p-6 sm:p-9">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl text-[var(--text)]">{t.compare.metricsTitle}</h3>
          <span className="text-xs italic text-[var(--text-soft)]">{t.compare.higherIsBetter}</span>
        </div>
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--text-muted)]">
          {[
            { name: a.city.name, color: COLOR_A },
            { name: b.city.name, color: COLOR_B },
          ].map((c) => (
            <span key={c.name} className="flex items-center gap-2">
              <span className="inline-block h-2 w-5" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>

        <div className="space-y-7">
          {METRICS.map((key, i) => {
            const valueA = sa[key]
            const valueB = sb[key]
            const [widthA, widthB] = barWidths(valueA, valueB)
            return (
              <div key={key}>
                <p className="eyebrow mb-2.5 text-[0.62rem] text-[var(--text)]">{t.compare.metrics[key]}</p>
                <div className="space-y-2">
                  {[
                    { value: valueA, width: widthA, color: COLOR_A, other: valueB, extraDelay: 0 },
                    { value: valueB, width: widthB, color: COLOR_B, other: valueA, extraDelay: 70 },
                  ].map((row, side) => (
                    <div key={side} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Bar width={row.width} color={row.color} delay={i * 140 + row.extraDelay} />
                      </div>
                      <span
                        className={`font-display w-16 text-right text-lg tabular-nums ${row.value >= row.other ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'}`}
                      >
                        {formatNumber(row.value, lang, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ComparePage() {
  const { t } = useLanguage()
  const { cityA, setCityA, cityB, setCityB, state, race } = useCompare(t)
  const loading = state.status === 'loading'

  return (
    <div>
      <PageHero image={HERO_IMAGES.compare} eyebrow={t.compare.heroEyebrow} title={t.compare.heroTitle} subtitle={t.compare.heroSubtitle} />

      <section className="relative py-24 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-4xl px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void race()
            }}
          >
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                { label: t.compare.labelA, value: cityA, set: setCityA, placeholder: t.compare.placeholderA, color: COLOR_A },
                { label: t.compare.labelB, value: cityB, set: setCityB, placeholder: t.compare.placeholderB, color: COLOR_B },
              ].map((field) => (
                <label key={field.label} className="block">
                  <span className="eyebrow flex items-center gap-2 text-[var(--accent)]">
                    <span className="inline-block h-2 w-5" style={{ background: field.color }} />
                    {field.label}
                  </span>
                  <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} className="field-line font-display !text-2xl" />
                </label>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button type="submit" disabled={loading} className="btn-lux btn-solid min-w-56">
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                    {t.compare.running}
                  </>
                ) : (
                  t.compare.button
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="eyebrow mr-2 text-[0.6rem] text-[var(--text-soft)]">{t.compare.examplesTitle}</span>
            {MATCHUPS.map(([x, y]) => (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => void race(x, y)}
                disabled={loading}
                className="border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--gold)] hover:text-[var(--text)] disabled:opacity-50"
              >
                {x} <em className="font-display text-sm text-[var(--accent)]">vs</em> {y}
              </button>
            ))}
          </div>

          {state.status === 'error' && (
            <div className="mt-10">
              <ErrorBanner message={state.message} />
            </div>
          )}

          {state.status === 'done' && <Results key={state.runId} a={state.a} b={state.b} />}
        </div>
      </section>
    </div>
  )
}
