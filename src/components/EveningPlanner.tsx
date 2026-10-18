import { useEveningPlanner } from '../hooks/useEveningPlanner'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { UserProfile } from '../types/food'
import { formatMoney } from '../utils/format'
import { planEvening, type HourLevel } from '../utils/planner'
import { ErrorBanner } from './ErrorBanner'
import { SectionHeading } from './SectionHeading'

const LEVEL_STYLES: Record<HourLevel, { bg: string; text: string }> = {
  best: { bg: '#5a3a28', text: '#f3e7cf' },
  good: { bg: '#b8a58a', text: '#2a2118' },
  few: { bg: '#e8dcc6', text: '#5b4f43' },
  none: { bg: 'transparent', text: '#8a7a66' },
}

/** The rest of today in the user's home city, one tile per hour, coloured for their profile. */
export function EveningPlanner({ profile }: { profile: UserProfile }) {
  const { t, lang } = useLanguage()
  const { homeCity, setHomeCity, state, load } = useEveningPlanner(t)

  const traits = [
    profile.vegan ? t.common.vegan : profile.vegetarian ? t.common.vegetarian : null,
    profile.glutenFree ? t.common.glutenFree : null,
    profile.onBudget ? t.rec.onBudget : null,
  ].filter(Boolean) as string[]

  const plan = state.status === 'ready' ? planEvening(state.hours, profile) : null

  return (
    <section>
      <SectionHeading eyebrow={t.planner.eyebrow} line1={t.planner.title1} line2={t.planner.title2} />
      <p className="mx-auto mt-5 max-w-xl text-center text-[var(--text-muted)]">{t.planner.subtitle}</p>

      <form
        className="mx-auto mt-10 flex max-w-xl flex-col gap-5 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          load(homeCity)
        }}
      >
        <label className="flex-1">
          <span className="eyebrow text-[var(--accent)]">{t.planner.homeLabel}</span>
          <input
            type="text"
            value={homeCity}
            onChange={(e) => setHomeCity(e.target.value)}
            placeholder={t.planner.placeholder}
            className="field-line font-display !text-2xl"
          />
        </label>
        <button type="submit" disabled={state.status === 'loading' || !homeCity.trim()} className="btn-lux btn-solid">
          {state.status === 'loading' ? t.planner.loading : t.planner.button}
        </button>
      </form>

      <div className="mx-auto mt-10 max-w-4xl">
        {state.status === 'error' && <ErrorBanner message={state.message} />}

        {state.status === 'ready' && plan && (
          <div className="animate-[fadeIn_0.4s_ease-in]">
            {plan.hours.length === 0 ? (
              <p className="font-display text-center text-2xl italic text-[var(--text-muted)]">{fill(t.planner.dayOver, { city: state.city.name })}</p>
            ) : (
              <>
                <div className="text-center">
                  {plan.best ? (
                    <>
                      <p className="font-display text-4xl text-[var(--text)]">{fill(t.planner.bestTitle, { time: plan.best.label })}</p>
                      <p className="mt-2 text-[var(--text-muted)]">
                        {profile.onBudget && plan.best.cheapest !== null
                          ? fill(t.planner.bestDetailBudget, { n: plan.best.matching, price: formatMoney(plan.best.cheapest, state.city.currency, lang) })
                          : fill(t.planner.bestDetail, { n: plan.best.matching, pct: plan.best.bestDiscount })}
                      </p>
                    </>
                  ) : (
                    <p className="font-display text-2xl italic text-[var(--text-muted)]">{t.planner.noneForYou}</p>
                  )}
                </div>

                <ol className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {plan.hours.map((h) => {
                    const style = LEVEL_STYLES[h.level]
                    return (
                      <li
                        key={h.hour}
                        className={`flex flex-col items-center justify-center px-2 py-4 text-center ${h.level === 'none' ? 'border border-dashed border-[var(--border)]' : ''}`}
                        style={{ background: style.bg, color: style.text }}
                      >
                        <span className="font-display text-xl tabular-nums">{h.label}</span>
                        <span className="mt-1 text-[0.65rem] tracking-wide">{h.matching > 0 ? fill(t.planner.forYou, { n: h.matching }) : '—'}</span>
                        {h.bestDiscount > 0 && <span className="text-[0.65rem] opacity-80">−{h.bestDiscount}%</span>}
                      </li>
                    )
                  })}
                </ol>

                <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
                  {(['best', 'good', 'few', 'none'] as const).map((level) => (
                    <li key={level} className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 ${level === 'none' ? 'border border-dashed border-[var(--text-soft)]' : ''}`}
                        style={{ background: LEVEL_STYLES[level].bg }}
                      />
                      {t.planner.legend[level]}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-center text-xs italic text-[var(--text-soft)]">
                  {fill(t.planner.note, { city: state.city.name })}
                  {traits.length > 0 && ` · ${fill(t.planner.adjusted, { list: traits.join(', ').toLowerCase() })}`}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
