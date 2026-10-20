import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { NumberBadge } from '../components/NumberBadge'
import { PageHero } from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { STORY_IMAGES } from '../constants/images'
import { usePartnerListings } from '../hooks/usePartnerListings'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { Category, CreatedListing, GlobeCity, ItemKey } from '../types/food'
import { createListing, deleteListing, fetchCities } from '../utils/foodApi'
import { formatMoney } from '../utils/format'

const CATEGORIES: Category[] = ['bakery', 'cafe', 'restaurant', 'patisserie', 'grocery']

/** Which items each kind of venue can list — the same catalogue the server validates against. */
const ITEMS_BY_CATEGORY: Record<Category, ItemKey[]> = {
  bakery: ['sourdoughLoaf', 'croissantBox', 'baguettes', 'cinnamonRolls', 'glutenFreeLoaf'],
  cafe: ['sandwichBox', 'veggieWraps', 'quiche', 'fruitBowls', 'muffins'],
  restaurant: ['pastaTray', 'curryBowl', 'roastChicken', 'sushiSet', 'risotto', 'mezze'],
  patisserie: ['macarons', 'eclairs', 'fruitTart', 'cheesecake'],
  grocery: ['veggieBox', 'fruitCrate', 'dairyBundle', 'deliBundle'],
}

/** Mirrors the server's pricing window (3 hours, 30% → 70%) for the live preview only; the server sets the real price. */
const WINDOW_MINUTES = 180

function toMinutes(time: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

function toTime(minutes: number): string {
  const m = Math.max(0, minutes)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-[0.62rem] text-[var(--accent)]">{label}</span>
      {children}
    </label>
  )
}

export function PartnerPage() {
  const { t, lang } = useLanguage()
  const p = t.partner
  const { saved, add, markRemoved } = usePartnerListings()

  const [cities, setCities] = useState<GlobeCity[]>([])
  const [cityId, setCityId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [category, setCategory] = useState<Category>('bakery')
  const [item, setItem] = useState<ItemKey>('croissantBox')
  const [portions, setPortions] = useState(4)
  const [price, setPrice] = useState('')
  const [closeTime, setCloseTime] = useState('21:00')
  const [state, setState] = useState<{ step: 'form'; error?: string; detail?: string } | { step: 'sending' } | { step: 'done'; created: CreatedListing }>({ step: 'form' })

  useEffect(() => {
    let cancelled = false
    fetchCities().then((list) => {
      if (!cancelled && list) setCities([...list].sort((a, b) => a.name.localeCompare(b.name)))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const city = cities.find((c) => c.id === cityId)
  const priceValue = Number(price.replace(',', '.'))
  const close = toMinutes(closeTime)
  const money = (value: number) => (city ? formatMoney(value, city.currency, lang) : value.toFixed(2))

  function chooseCategory(next: Category) {
    setCategory(next)
    setItem(ITEMS_BY_CATEGORY[next][0])
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!city || close === null || !(priceValue > 0)) {
      setState({ step: 'form', error: p.errorInvalid })
      return
    }
    setState({ step: 'sending' })
    const result = await createListing({ city: city.id, venueName, category, item, portions, originalPrice: priceValue, closeTime })
    if (result.ok) {
      add({ listing: result.data.listing, token: result.data.token, cityName: city.name, currency: city.currency })
      setState({ step: 'done', created: result.data })
      return
    }
    const error = result.reason === 'invalid' ? p.errorInvalid : result.reason === 'rate' ? p.errorRate : result.reason === 'full' ? p.errorFull : p.errorGeneric
    setState({ step: 'form', error, detail: result.reason === 'invalid' ? result.message : undefined })
  }

  async function remove(id: string, token: string) {
    if (await deleteListing(id, token)) markRemoved(id)
  }

  const fieldClass = 'field-line'
  const preview =
    city && close !== null && priceValue > 0
      ? fill(p.preview, {
          open: toTime(close - WINDOW_MINUTES),
          close: closeTime,
          start: money(priceValue * 0.7),
          end: money(priceValue * 0.3),
        })
      : null
  const alreadyLive = city && close !== null && toMinutes(city.localTime)! >= close - WINDOW_MINUTES

  return (
    <div>
      <PageHero image={STORY_IMAGES.chef} eyebrow={p.heroEyebrow} title={p.heroTitle} subtitle={p.heroSubtitle} />

      <section className="relative py-24 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-5xl px-6">
          <SectionHeading line1={p.whyTitle1} line2={p.whyTitle2} />
          <ol className="mt-14 grid gap-12 sm:grid-cols-3">
            {p.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <li className="text-center">
                  <NumberBadge n={i + 1} />
                  <p className="font-display mt-5 text-3xl text-[var(--text)]">{step.title}</p>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative bg-[var(--bg-sand)] py-24 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-3xl px-6">
          {state.step === 'done' ? (
            <div className="card-lux p-8 text-center sm:p-12">
              <p className="eyebrow text-[var(--accent)]">{p.successEyebrow}</p>
              <h2 className="font-display mt-3 text-4xl text-[var(--text)]">{p.successTitle}</h2>
              <p className="mt-4 text-[var(--text-muted)]">
                {fill(p.successText, {
                  item: t.items[state.created.offer.item],
                  venue: state.created.offer.venueName,
                  price: formatMoney(state.created.offer.price, state.created.offer.currency, lang),
                  pct: state.created.offer.discountPct,
                  n: state.created.offer.quantityLeft,
                  until: state.created.offer.pickupUntil,
                })}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={`/?city=${state.created.listing.cityId}#tonight`} className="btn-lux btn-solid">
                  {p.seeLive}
                </Link>
                <button type="button" onClick={() => setState({ step: 'form' })} className="btn-lux btn-ghost">
                  {p.another}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="card-lux p-7 sm:p-10">
              <p className="eyebrow text-[var(--accent)]">{p.formEyebrow}</p>
              <h2 className="font-display mt-2 text-4xl text-[var(--text)]">{p.formTitle}</h2>

              <div className="mt-8 grid gap-7 sm:grid-cols-2">
                <Field label={p.city}>
                  <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={fieldClass} required>
                    <option value="">{p.cityPlaceholder}</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.localTime}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={p.venueName}>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder={p.venuePlaceholder}
                    minLength={2}
                    maxLength={40}
                    required
                    className={fieldClass}
                  />
                </Field>
                <Field label={p.category}>
                  <select value={category} onChange={(e) => chooseCategory(e.target.value as Category)} className={fieldClass}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t.categories[c]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={p.item}>
                  <select value={item} onChange={(e) => setItem(e.target.value as ItemKey)} className={fieldClass}>
                    {ITEMS_BY_CATEGORY[category].map((key) => (
                      <option key={key} value={key}>
                        {t.items[key]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={p.portions}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    value={portions}
                    onChange={(e) => setPortions(Math.max(1, Math.min(20, Math.round(Number(e.target.value) || 1))))}
                    className={fieldClass}
                  />
                </Field>
                <Field label={`${p.price}${city ? ` (${city.currency})` : ''}`}>
                  <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required className={fieldClass} />
                </Field>
                <Field label={p.closeTime}>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} required className={fieldClass} />
                </Field>
              </div>

              {preview && (
                <p className="mt-8 border-l-2 border-[var(--gold)] pl-4 text-sm text-[var(--text-muted)]">
                  {preview}
                  {alreadyLive && <span className="block italic">{p.previewLive}</span>}
                </p>
              )}

              {state.step === 'form' && state.error && (
                <div className="mt-6">
                  <ErrorBanner message={state.error}>{state.detail && <p className="mt-1 text-xs text-[var(--text-soft)]">{state.detail}</p>}</ErrorBanner>
                </div>
              )}

              <button type="submit" disabled={state.step === 'sending'} className="btn-lux btn-solid mt-8 w-full">
                {state.step === 'sending' ? p.submitting : p.submit}
              </button>
              <p className="mt-4 text-center text-xs italic text-[var(--text-soft)]">{p.honesty}</p>
            </form>
          )}

          {saved.length > 0 && (
            <div className="mt-14">
              <p className="eyebrow text-[var(--accent)]">{p.yourListings}</p>
              <p className="mt-1 text-xs italic text-[var(--text-soft)]">{p.yourListingsNote}</p>
              <ul className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {saved.map((s) => (
                  <li key={s.listing.id} className={`flex items-center justify-between gap-4 py-4 ${s.removed ? 'opacity-50' : ''}`}>
                    <div className="min-w-0">
                      <p className="font-display truncate text-xl text-[var(--text)]">
                        {s.listing.portions} × {t.items[s.listing.item]}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {s.listing.venueName}, {s.cityName} · {s.listing.date} · {toTime(s.listing.closeMinutes)} ·{' '}
                        {formatMoney(s.listing.originalPrice, s.currency, lang)}
                      </p>
                    </div>
                    {s.removed ? (
                      <span className="eyebrow shrink-0 text-[0.6rem] text-[var(--text-soft)]">{p.removed}</span>
                    ) : (
                      <button type="button" onClick={() => void remove(s.listing.id, s.token)} className="btn-lux btn-ghost shrink-0 !px-4 !py-2">
                        {p.remove}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
