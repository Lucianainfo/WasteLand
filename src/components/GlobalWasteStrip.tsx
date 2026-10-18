import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCompact, formatNumber } from '../utils/format'

/** 1.05 billion tonnes in 2022 (UNEP Food Waste Index Report 2024), spread over a year. */
const TONNES_PER_YEAR = 1.05e9
const TONNES_PER_SECOND = TONNES_PER_YEAR / (365.25 * 24 * 3600)
/** UN Sustainable Development Goal 12.3: halve per-capita food waste by 2030. */
const SDG_DEADLINE = new Date('2030-12-31T23:59:59Z')

function yearsUntil(date: Date): string {
  const years = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.max(0, years).toFixed(1)
}

interface FigureProps {
  value: string
  label: string
  source?: string
  live?: boolean
}

function Figure({ value, label, source, live = false }: FigureProps) {
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <p className={`font-display text-[clamp(2.4rem,5vw,3.5rem)] leading-none text-[var(--bg-card)] tabular-nums ${live ? 'italic' : ''}`}>{value}</p>
      <div className="my-4 h-px w-8 bg-[var(--gold)]" />
      <p className="max-w-[15rem] text-sm text-[var(--champagne)]/85">{label}</p>
      {source && <p className="eyebrow mt-3 text-[0.58rem] text-[var(--gold)]/80">{source}</p>}
    </div>
  )
}

/** Global context — the scale of the problem, with one figure that keeps counting while you read. */
export function GlobalWasteStrip() {
  const { t, lang } = useLanguage()
  const [openedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((Date.now() - openedAt) / 1000), 200)
    return () => window.clearInterval(id)
  }, [openedAt])

  return (
    <div className="grid gap-12 sm:grid-cols-3 sm:gap-4 sm:divide-x sm:divide-[var(--champagne)]/15">
      <Figure value={formatCompact(TONNES_PER_YEAR, lang)} label={t.home.wastedLabel} source={t.home.wastedSource} />
      <Figure value={formatNumber(elapsed * TONNES_PER_SECOND, lang)} label={t.home.counterLabel} source={t.home.counterNote} live />
      <Figure value={yearsUntil(SDG_DEADLINE)} label={t.home.sdgLabel} source={t.home.sdgSource} />
    </div>
  )
}
