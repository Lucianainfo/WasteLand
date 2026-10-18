import type { Lang } from '../i18n/translations'

const LOCALES: Record<Lang, string> = { en: 'en-GB', ro: 'ro-RO', ru: 'ru-RU' }

export function localeFor(lang: Lang): string {
  return LOCALES[lang]
}

/** "4,50 lei", "£3.40", "¥740" — whole units once a price reaches 100. */
export function formatMoney(value: number, currency: string, lang: Lang): string {
  const whole = value >= 100
  return new Intl.NumberFormat(LOCALES[lang], {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : undefined,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value)
}

export function formatNumber(value: number, lang: Lang, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits }).format(value)
}

/** 1.05e9 → "1.05B" / "1,05 mld." / "1,05 млрд" */
export function formatCompact(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALES[lang], { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

/** 45 → "45 min", 80 → "1 h 20 min" (unit words come from the translation table). */
export function formatDuration(minutes: number, units: { h: string; min: string }): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (h === 0) return `${rest} ${units.min}`
  if (rest === 0) return `${h} ${units.h}`
  return `${h} ${units.h} ${rest} ${units.min}`
}
