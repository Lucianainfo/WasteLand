import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { CityOffers, Offer, UserProfile } from '../types/food'
import { matchesProfile } from '../utils/recommendations'
import { OfferCard } from './OfferCard'
import { Reveal } from './Reveal'

type Sort = 'soonest' | 'discount' | 'price'

interface OffersSectionProps {
  data: CityOffers
  profile: UserProfile
  highlightId: string | null
  onReserve: (offer: Offer) => void
}

const SORTERS: Record<Sort, (a: Offer, b: Offer) => number> = {
  // Open offers first (soonest closing), then upcoming ones (soonest opening); sold-out last.
  soonest: (a, b) =>
    Number(a.quantityLeft === 0) - Number(b.quantityLeft === 0) ||
    a.minutesToOpen - b.minutesToOpen ||
    a.minutesToClose - b.minutesToClose,
  discount: (a, b) => Number(a.quantityLeft === 0) - Number(b.quantityLeft === 0) || b.discountPct - a.discountPct,
  price: (a, b) => Number(a.quantityLeft === 0) - Number(b.quantityLeft === 0) || a.price - b.price,
}

export function OffersSection({ data, profile, highlightId, onReserve }: OffersSectionProps) {
  const { t } = useLanguage()
  const hasFilters = profile.vegan || profile.vegetarian || profile.glutenFree
  const [onlyMine, setOnlyMine] = useState(hasFilters)
  const [sort, setSort] = useState<Sort>('soonest')

  const live = data.offers.filter((o) => o.status === 'live' && o.quantityLeft > 0).length
  const later = data.offers.filter((o) => o.status === 'upcoming').length
  const visible = data.offers.filter((o) => !onlyMine || matchesProfile(o, profile)).sort(SORTERS[sort])

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
      active ? 'border-[var(--cocoa-deep)] bg-[var(--cocoa-deep)] text-[var(--champagne)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)]'
    }`

  return (
    <div>
      <div className="flex flex-col gap-2 text-center">
        <p className="eyebrow text-[var(--accent)]">{fill(t.common.localTime, { time: data.city.localTime })}</p>
        <h3 className="font-display text-4xl text-[var(--text)] sm:text-5xl">{fill(t.home.offersTitle, { city: data.city.name })}</h3>
        <p className="text-sm text-[var(--text-muted)]">{fill(t.home.offersCount, { live, later })}</p>
      </div>

      {data.offers.length === 0 ? (
        <p className="font-display mx-auto mt-10 max-w-xl text-center text-2xl italic text-[var(--text-muted)]">
          {fill(t.home.allClosed, { city: data.city.name })}
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button type="button" className={chip(!onlyMine)} onClick={() => setOnlyMine(false)} aria-pressed={!onlyMine}>
              {t.home.filterAll}
            </button>
            <button type="button" className={chip(onlyMine)} onClick={() => setOnlyMine(true)} aria-pressed={onlyMine}>
              {t.home.filterMine}
            </button>
            <span className="mx-2 hidden h-5 w-px bg-[var(--border)] sm:block" />
            {(['soonest', 'discount', 'price'] as const).map((key) => (
              <button key={key} type="button" className={chip(sort === key)} onClick={() => setSort(key)} aria-pressed={sort === key}>
                {key === 'soonest' ? t.home.sortSoonest : key === 'discount' ? t.home.sortDiscount : t.home.sortPrice}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="font-display text-2xl italic text-[var(--text-muted)]">{t.home.noneMatching}</p>
              <button type="button" onClick={() => setOnlyMine(false)} className="btn-lux btn-ghost mt-6">
                {t.home.showAll}
              </button>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((offer, i) => (
                <Reveal key={offer.id} delay={Math.min(i, 5) * 70} className="h-full">
                  <OfferCard offer={offer} highlighted={offer.id === highlightId} onReserve={onReserve} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
