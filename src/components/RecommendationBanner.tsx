import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { UserProfile } from '../types/food'
import { formatDuration, formatMoney } from '../utils/format'
import type { Recommendation } from '../utils/recommendations'

interface RecommendationBannerProps {
  recommendation: Recommendation
  profile: UserProfile
  onReserve?: () => void
}

/** The one concrete pick for tonight, framed like a maître d's suggestion. */
export function RecommendationBanner({ recommendation, profile, onReserve }: RecommendationBannerProps) {
  const { t, lang } = useLanguage()

  const traits = [
    profile.vegan ? t.common.vegan : profile.vegetarian ? t.common.vegetarian : null,
    profile.glutenFree ? t.common.glutenFree : null,
    profile.onBudget ? t.rec.onBudget : null,
  ].filter(Boolean) as string[]
  const basedOn = fill(t.rec.basedOn, { list: traits.length ? traits.join(', ').toLowerCase() : t.rec.noRestrictions })

  let title: string
  let detail: string
  if (recommendation.level === 'none') {
    title = t.rec.none
    detail = t.rec.noneDetail
  } else {
    const { offer } = recommendation
    const vars = { item: t.items[offer.item], venue: offer.venueName }
    if (recommendation.level === 'now') {
      title = fill(t.rec.now, vars)
      detail = fill(t.rec.nowDetail, {
        pct: offer.discountPct,
        price: formatMoney(offer.price, offer.currency, lang),
        original: formatMoney(offer.originalPrice, offer.currency, lang),
        until: offer.pickupUntil,
      })
    } else {
      title = fill(t.rec.later, vars)
      detail = fill(t.rec.laterDetail, { time: formatDuration(offer.minutesToOpen, t.common), pct: offer.discountPct })
    }
  }

  return (
    <div className="relative overflow-hidden bg-[var(--cocoa-deep)] px-7 py-8 text-[var(--champagne)] sm:px-10">
      <span aria-hidden="true" className="font-script pointer-events-none absolute -right-4 -top-10 text-[9rem] leading-none text-[var(--gold)] opacity-15">
        W
      </span>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow text-[var(--gold)]">{t.rec.eyebrow}</p>
          <p className="font-display mt-3 text-3xl leading-tight text-[var(--bg-card)]">{title}</p>
          <p className="mt-2 text-sm text-[var(--champagne)]/85">{detail}</p>
          <p className="mt-3 text-xs italic text-[var(--champagne)]/60">
            {basedOn} · <Link to="/profile" className="underline decoration-[var(--gold)] underline-offset-4 hover:text-[var(--bg-card)]">{t.nav.profile}</Link>
          </p>
        </div>
        {recommendation.level === 'now' && onReserve && (
          <button type="button" onClick={onReserve} className="btn-lux btn-light shrink-0">
            {t.offer.reserve}
          </button>
        )}
      </div>
    </div>
  )
}
