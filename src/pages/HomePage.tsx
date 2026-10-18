import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBanner } from '../components/ErrorBanner'
import { GlobalWasteStrip } from '../components/GlobalWasteStrip'
import { HistoryChart } from '../components/HistoryChart'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { NumberBadge } from '../components/NumberBadge'
import { OffersSection } from '../components/OffersSection'
import { OrdersPanel } from '../components/OrdersPanel'
import { PageHero } from '../components/PageHero'
import { RecommendationBanner } from '../components/RecommendationBanner'
import { ReserveDialog } from '../components/ReserveDialog'
import { Reveal } from '../components/Reveal'
import { SearchBar } from '../components/SearchBar'
import { SectionHeading } from '../components/SectionHeading'
import { SideNote } from '../components/SideNote'
import { HERO_IMAGES, STORY_IMAGES, unsplash } from '../constants/images'
import { urgencyOf } from '../constants/urgency'
import { useEveningMood } from '../context/eveningMood'
import { useOffers } from '../hooks/useOffers'
import { useOrders } from '../hooks/useOrders'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../i18n/LanguageContext'
import type { GlobeCity, Offer } from '../types/food'
import { requestNotificationPermission } from '../utils/notifications'
import { getRecommendation } from '../utils/recommendations'

const GlobeSection = lazy(() => import('../components/GlobeSection'))

export function HomePage() {
  const { t } = useLanguage()
  const { profile } = useProfile()
  const { orders, addOrder, clearOrders } = useOrders()
  const { setMood } = useEveningMood()
  const { city, setCity, data, history, historyStatus, loading, error, available, search, refresh } = useOffers(profile, t)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reserving, setReserving] = useState<Offer | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const closeDialog = useCallback(() => setReserving(null), [])

  useEffect(() => {
    if (profile.lastCallAlerts) void requestNotificationPermission()
  }, [profile.lastCallAlerts])

  useEffect(() => {
    if (!data) return
    const open = data.offers.filter((o) => o.status === 'live' && o.quantityLeft > 0)
    setMood({ city: data.city.name, liveOffers: open.length, lastCall: open.some((o) => urgencyOf(o) === 'lastCall') })
  }, [data, setMood])

  function handleGlobeSelect(selected: GlobeCity) {
    setSelectedId(selected.id)
    void search(selected.id, selected.name)
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const recommendation = data ? getRecommendation(data.offers, profile) : null

  return (
    <div>
      <PageHero
        tall
        image={HERO_IMAGES.home}
        eyebrow={t.home.heroEyebrow}
        title={t.home.heroTitle}
        subtitle={t.home.heroSubtitle}
        scrollLabel={t.common.discover}
        scrollTarget="#story"
      >
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#tonight" className="btn-lux btn-light">
            {t.home.heroCta}
          </a>
          <a href="#story" className="eyebrow px-4 py-3 text-[var(--champagne)] underline decoration-[var(--champagne)]/40 underline-offset-8 hover:decoration-[var(--champagne)]">
            {t.home.heroCta2}
          </a>
        </div>
      </PageHero>

      {/* Story — two photographs framing a centred text, as on the hotel's "our story" section */}
      <section id="story" className="relative bg-[var(--bg-sand)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1.4fr_1fr]">
          <Reveal className="hidden lg:block">
            <img src={unsplash(STORY_IMAGES.bread, 600, 820)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
          </Reveal>
          <Reveal>
            <SectionHeading line1={t.home.introTitle1} line2={t.home.introTitle2} />
            <p className="mx-auto mt-8 max-w-xl text-center text-lg text-[var(--text-muted)]">{t.home.introText}</p>
          </Reveal>
          <Reveal className="hidden lg:block" delay={150}>
            <img src={unsplash(STORY_IMAGES.pastries, 600, 820)} alt="" loading="lazy" className="aspect-[3/4] w-full translate-y-12 object-cover" />
          </Reveal>
        </div>

        <ol className="relative z-[2] mx-auto mt-24 grid max-w-5xl gap-12 px-6 sm:grid-cols-3">
          {t.home.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <li className="text-center">
                <NumberBadge n={i + 1} />
                <p className="font-display mt-5 text-3xl text-[var(--text)]">{step.title}</p>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{step.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="relative bg-[var(--cocoa-deep)] py-20 text-[var(--champagne)]">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <p className="eyebrow mb-12 text-center text-[var(--gold)]">{t.home.globalEyebrow}</p>
          <GlobalWasteStrip />
        </div>
      </section>

      <Suspense fallback={<div className="skeleton-shimmer h-[42rem] bg-[var(--bg-dark)]" />}>
        <GlobeSection selectedId={selectedId} onSelect={handleGlobeSelect} />
      </Suspense>

      <section id="tonight" className="relative scroll-mt-16 py-24 sm:py-32">
        <div ref={searchRef} className="relative z-[2] mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="relative mx-auto max-w-3xl">
            <SideNote n={1} text={t.home.sideNote1} source={t.home.sideNote1Source} wrapperClassName="top-0 right-full mr-16" />
            <SideNote n={2} text={t.home.sideNote2} wrapperClassName="top-6 left-full ml-16" />
            <SectionHeading eyebrow={t.home.searchEyebrow} line1={t.home.searchTitle1} line2={t.home.searchTitle2} />
            <div className="mt-12">
              <SearchBar city={city} onCityChange={setCity} onSearch={() => void search()} loading={loading} />
            </div>
          </div>

          <div className="mt-16">
            {loading && <LoadingSkeleton />}

            {error && !loading && (
              <div className="mx-auto max-w-3xl">
                <ErrorBanner message={error}>
                  {available.length > 0 && (
                    <div className="mt-3">
                      <p className="eyebrow text-[0.6rem] text-[var(--text-soft)]">{t.home.availableCities}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {available.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => void search(name, name)}
                            className="border border-[var(--border)] px-2.5 py-1 text-xs hover:border-[var(--gold)]"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </ErrorBanner>
              </div>
            )}

            {data && !loading && recommendation && (
              <div className="space-y-16 animate-[fadeIn_0.5s_ease-in]">
                <RecommendationBanner
                  recommendation={recommendation}
                  profile={profile}
                  onReserve={recommendation.level === 'now' ? () => setReserving(recommendation.offer) : undefined}
                />
                <OffersSection
                  key={data.city.id}
                  data={data}
                  profile={profile}
                  highlightId={recommendation.level === 'none' ? null : recommendation.offer.id}
                  onReserve={setReserving}
                />
                <HistoryChart cityName={data.city.name} days={history} status={historyStatus} />
              </div>
            )}

            <OrdersPanel orders={orders} onClear={clearOrders} />

            <p className="mx-auto mt-16 max-w-2xl text-center text-xs italic text-[var(--text-soft)]">{t.home.demoNote}</p>
          </div>
        </div>
      </section>

      {reserving && data && (
        <ReserveDialog
          offer={reserving}
          onClose={closeDialog}
          onReserved={(reservation) => {
            addOrder({ ...reservation, cityName: data.city.name, createdAt: Date.now() })
            void refresh()
          }}
        />
      )}
    </div>
  )
}
