import { categoryImage, unsplash } from '../constants/images'
import { URGENCY_COLORS, urgencyOf } from '../constants/urgency'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { Offer } from '../types/food'
import { formatDuration, formatMoney } from '../utils/format'

interface OfferCardProps {
  offer: Offer
  highlighted?: boolean
  onReserve: (offer: Offer) => void
}

export function OfferCard({ offer, highlighted = false, onReserve }: OfferCardProps) {
  const { t, lang } = useLanguage()
  const urgency = urgencyOf(offer)
  const soldOut = urgency === 'soldOut'
  const money = (value: number) => formatMoney(value, offer.currency, lang)

  const tags = [
    offer.diet === 'vegan' ? t.common.vegan : offer.diet === 'vegetarian' ? t.common.vegetarian : null,
    offer.glutenFree ? t.common.glutenFree : null,
  ].filter(Boolean)

  return (
    <article
      className={`card-lux hoverable group flex h-full flex-col overflow-hidden ${soldOut ? 'opacity-60 saturate-50' : ''} ${
        highlighted ? 'ring-1 ring-[var(--accent)] ring-offset-4 ring-offset-[var(--bg)]' : ''
      }`}
    >
      <div className="relative h-52 overflow-hidden bg-[var(--bg-sand)]">
        <img
          src={unsplash(categoryImage(offer.category, offer.venueId), 700, 460)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        <span
          className={`absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[var(--bg-card)]/95 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--text)] ${
            urgency === 'lastCall' ? 'pulse-last-call' : ''
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: URGENCY_COLORS[urgency] }} />
          {t.urgency[urgency]}
        </span>

        {!soldOut && (
          <span className="font-display absolute right-4 top-3 text-right text-[var(--bg-card)] drop-shadow">
            <span className="block text-3xl leading-none">−{offer.discountPct}%</span>
            {offer.status === 'upcoming' && <span className="eyebrow text-[0.55rem]">{t.common.from}</span>}
          </span>
        )}

        <p className="eyebrow absolute bottom-3 left-4 text-[0.6rem] text-[var(--champagne)]">
          {t.categories[offer.category]} · {offer.venueName}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl leading-tight text-[var(--text)]">{t.items[offer.item]}</h3>

        {tags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="border border-[var(--gold)]/60 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--cocoa)]">
                {tag}
              </span>
            ))}
          </p>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-3xl text-[var(--cocoa)]">{money(offer.price)}</span>
          <span className="text-sm text-[var(--text-soft)] line-through">{money(offer.originalPrice)}</span>
        </div>

        <dl className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-muted)]">
          <div className="flex justify-between gap-3">
            <dt>{fill(t.offer.pickup, { from: offer.pickupFrom, until: offer.pickupUntil })}</dt>
            <dd className="tabular-nums">
              {offer.status === 'upcoming'
                ? fill(t.offer.opensIn, { time: formatDuration(offer.minutesToOpen, t.common) })
                : fill(t.offer.closesIn, { time: formatDuration(offer.minutesToClose, t.common) })}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{fill(t.common.left, { n: offer.quantityLeft })}</dt>
            <dd className="flex gap-1" aria-hidden="true">
              {Array.from({ length: offer.quantityTotal }, (_, i) => (
                <span key={i} className={`h-1.5 w-3 ${i < offer.quantityLeft ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
              ))}
            </dd>
          </div>
        </dl>

        <button type="button" onClick={() => onReserve(offer)} disabled={soldOut} className="btn-lux btn-ghost mt-6 w-full">
          {soldOut ? t.urgency.soldOut : t.offer.reserve}
        </button>
      </div>
    </article>
  )
}
