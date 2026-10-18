import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { SavedOrder } from '../types/food'
import { formatMoney, formatNumber } from '../utils/format'

interface OrdersPanelProps {
  orders: SavedOrder[]
  onClear: () => void
}

/** Reservations made on this device, like a row of pickup tickets. */
export function OrdersPanel({ orders, onClear }: OrdersPanelProps) {
  const { t, lang } = useLanguage()
  if (orders.length === 0) return null

  // Savings are summed per currency — a lei and a yen don't add up.
  const savedByCurrency = new Map<string, number>()
  for (const o of orders) savedByCurrency.set(o.currency, (savedByCurrency.get(o.currency) ?? 0) + (o.originalTotal - o.total))
  const kg = orders.reduce((sum, o) => sum + o.kg, 0)

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <p className="eyebrow text-[var(--accent)]">{t.orders.eyebrow}</p>
          <h3 className="font-display mt-1 text-3xl text-[var(--text)]">{t.orders.title}</h3>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="eyebrow text-[0.58rem] text-[var(--text-soft)]">{t.orders.savedTotal}</p>
            <p className="font-display text-xl text-[var(--cocoa)]">
              {[...savedByCurrency].map(([currency, value]) => formatMoney(value, currency, lang)).join(' · ')}
            </p>
          </div>
          <div>
            <p className="eyebrow text-[0.58rem] text-[var(--text-soft)]">{t.orders.rescuedTotal}</p>
            <p className="font-display text-xl text-[var(--cocoa)]">{formatNumber(kg, lang, 1)} kg</p>
          </div>
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <li key={o.code} className="relative flex items-center gap-5 border border-dashed border-[var(--gold)] bg-[var(--bg-card)] px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-lg text-[var(--text)]">
                {o.quantity} × {t.items[o.item]}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {o.venueName}, {o.cityName} · {fill(t.orders.until, { time: o.pickupUntil })}
              </p>
            </div>
            <p className="font-display shrink-0 border-l border-dashed border-[var(--gold)] pl-5 text-lg tracking-[0.08em] text-[var(--cocoa)]">{o.code}</p>
          </li>
        ))}
      </ul>

      <button type="button" onClick={onClear} className="mt-4 text-xs text-[var(--text-soft)] underline underline-offset-4 hover:text-[var(--text)]">
        {t.orders.clear}
      </button>
    </section>
  )
}
