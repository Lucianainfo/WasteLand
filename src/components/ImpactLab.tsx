import { useState, type CSSProperties } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import { computeImpact, HOUSEHOLD_WASTE_KG_PER_YEAR, RESCUE_ROUTINE, ZERO_ROUTINE, type ImpactInput } from '../utils/impact'
import { formatMoney, formatNumber } from '../utils/format'

const SLIDER_COLOR = '#9e7c4f'
const MAX_TREES_DRAWN = 48

const BREAKDOWN_COLORS = { bags: '#e2b85c', pastries: '#f3e7cf', groceries: '#9aa874' } as const

interface SliderProps {
  label: string
  unit: string
  value: number
  max: number
  onChange: (value: number) => void
}

function Slider({ label, unit, value, max, onChange }: SliderProps) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-[var(--text)]">{label}</span>
        <span className="font-display text-2xl text-[var(--cocoa)] tabular-nums">
          {value} <span className="text-xs not-italic text-[var(--text-soft)]">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider mt-3 w-full"
        style={{ '--slider-color': SLIDER_COLOR, '--fill': `${(value / max) * 100}%` } as CSSProperties}
      />
    </label>
  )
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-4xl leading-none text-[var(--bg-card)] tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-[var(--champagne)]/75">{label}</p>
    </div>
  )
}

function Tree({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 20 28" className="h-7 w-5 animate-[fadeIn_0.5s_ease-out_both]" style={{ animationDelay: `${delay}ms` }} aria-hidden="true">
      <path d="M10 1 C 4 8, 3 14, 5 18 C 7 21, 13 21, 15 18 C 17 14, 16 8, 10 1 Z" fill="#7d8a5f" />
      <path d="M10 6 V 27" stroke="#e8d9b8" strokeWidth="1" />
    </svg>
  )
}

/** Sliders → a year of rescued food, CO2e, water and money, with the factors listed openly. */
export function ImpactLab() {
  const { t, lang } = useLanguage()
  const [input, setInput] = useState<ImpactInput>(ZERO_ROUTINE)
  const result = computeImpact(input)

  const kg = useCountUp(result.kgPerYear)
  const co2 = useCountUp(result.co2KgPerYear)
  const water = useCountUp(result.waterLitresPerYear)
  const money = useCountUp(result.eurSavedPerYear)

  const set = (key: keyof ImpactInput) => (value: number) => setInput((prev) => ({ ...prev, [key]: value }))
  const householdMax = Math.max(HOUSEHOLD_WASTE_KG_PER_YEAR, result.kgPerYear)

  return (
    <div className="grid overflow-hidden lg:grid-cols-[1fr_1.05fr]">
      <div className="card-lux space-y-7 p-7 sm:p-10">
        <div>
          <p className="eyebrow text-[var(--accent)]">{t.lab.title}</p>
          <p className="font-display mt-2 text-3xl italic text-[var(--text)]">{t.lab.intro}</p>
        </div>
        <Slider label={t.lab.bags} unit={t.lab.bagsUnit} value={input.bagsPerWeek} max={10} onChange={set('bagsPerWeek')} />
        <Slider label={t.lab.pastries} unit={t.lab.pastriesUnit} value={input.pastriesPerWeek} max={14} onChange={set('pastriesPerWeek')} />
        <Slider label={t.lab.groceries} unit={t.lab.groceriesUnit} value={input.groceryKgPerMonth} max={20} onChange={set('groceryKgPerMonth')} />
        <Slider label={t.lab.friends} unit={t.lab.friendsUnit} value={input.friends} max={10} onChange={set('friends')} />

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={() => setInput(RESCUE_ROUTINE)} className="btn-lux btn-solid">
            {t.lab.routine}
          </button>
          <button type="button" onClick={() => setInput(ZERO_ROUTINE)} className="btn-lux btn-ghost">
            {t.lab.reset}
          </button>
        </div>

        <details className="group border-t border-[var(--border)] pt-5 text-sm text-[var(--text-muted)]">
          <summary className="eyebrow cursor-pointer list-none text-[var(--accent)]">
            {t.lab.howTitle} <span className="inline-block transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3">{t.lab.howText}</p>
        </details>
      </div>

      <div className="relative bg-[var(--cocoa-deep)] p-7 text-[var(--champagne)] sm:p-10" aria-live="polite">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
          <Figure value={formatNumber(kg, lang)} label={t.lab.foodLabel} />
          <Figure value={formatNumber(co2, lang)} label={t.lab.co2Label} />
          <Figure value={formatNumber(water, lang)} label={t.lab.waterLabel} />
          <Figure value={formatMoney(Math.round(money), 'EUR', lang)} label={t.lab.moneyLabel} />
        </div>

        <div className="mt-10">
          <div className="flex h-2 overflow-hidden bg-white/10">
            {(['bags', 'pastries', 'groceries'] as const).map((key) => (
              <div key={key} style={{ width: `${result.breakdown[key] * 100}%`, background: BREAKDOWN_COLORS[key], transition: 'width 0.6s ease' }} />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--champagne)]/75">
            {(['bags', 'pastries', 'groceries'] as const).map((key) => (
              <li key={key} className="flex items-center gap-2">
                <span className="h-2 w-2" style={{ background: BREAKDOWN_COLORS[key] }} />
                {key === 'bags' ? t.lab.breakdownBags : key === 'pastries' ? t.lab.breakdownPastries : t.lab.breakdownGroceries}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 space-y-3 text-xs">
          <p className="text-[var(--champagne)]/80">{fill(t.lab.householdLabel, { kg: HOUSEHOLD_WASTE_KG_PER_YEAR })}</p>
          {[
            { label: t.lab.you, value: result.kgPerYear, color: '#e2b85c' },
            { label: t.lab.average, value: HOUSEHOLD_WASTE_KG_PER_YEAR, color: 'rgba(232,217,184,0.35)' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[var(--champagne)]/70">{row.label}</span>
              <div className="h-1.5 flex-1 bg-white/10">
                <div className="h-full" style={{ width: `${(row.value / householdMax) * 100}%`, background: row.color, transition: 'width 0.6s ease' }} />
              </div>
              <span className="w-14 text-right tabular-nums">{row.value} kg</span>
            </div>
          ))}
        </div>

        {result.trees > 0 && (
          <div className="mt-10 border-t border-[var(--champagne)]/15 pt-6">
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: Math.min(result.trees, MAX_TREES_DRAWN) }, (_, i) => (
                <Tree key={i} delay={i * 18} />
              ))}
              {result.trees > MAX_TREES_DRAWN && <span className="font-display self-end pl-2 text-lg">+{result.trees - MAX_TREES_DRAWN}</span>}
            </div>
            <p className="mt-3 text-xs text-[var(--champagne)]/75">{fill(t.lab.treesLabel, { n: result.trees })}</p>
          </div>
        )}

        <p className="mt-8 text-[0.68rem] italic text-[var(--champagne)]/50">{t.lab.disclaimer}</p>
      </div>
    </div>
  )
}
