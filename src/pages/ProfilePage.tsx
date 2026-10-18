import { useEffect, useState } from 'react'
import { EveningPlanner } from '../components/EveningPlanner'
import { PageHero } from '../components/PageHero'
import { SectionHeading } from '../components/SectionHeading'
import { SideNote } from '../components/SideNote'
import { HERO_IMAGES } from '../constants/images'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../i18n/LanguageContext'
import type { UserProfile } from '../types/food'
import { requestNotificationPermission } from '../utils/notifications'

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** A preference as a row with an elegant switch. */
function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 border-b border-[var(--border)] py-6">
      <span>
        <span className="font-display block text-2xl text-[var(--text)]">{label}</span>
        <span className="mt-1 block text-sm text-[var(--text-muted)]">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full border border-[var(--gold)] transition-colors duration-300 peer-checked:bg-[var(--cocoa-deep)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-[1.125rem] after:w-[1.125rem] after:rounded-full after:bg-[var(--gold)] after:transition-transform after:duration-300 peer-checked:after:translate-x-5 peer-checked:after:bg-[var(--champagne)]"
      />
    </label>
  )
}

export function ProfilePage() {
  const { t } = useLanguage()
  const { profile, setProfile } = useProfile()
  const [permissionDenied, setPermissionDenied] = useState(false)
  const alertsBlocked = profile.lastCallAlerts && permissionDenied

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => {
      const next = { ...prev, [key]: value }
      // Vegan implies vegetarian; turning vegetarian off turns vegan off too.
      if (key === 'vegan' && value) next.vegetarian = true
      if (key === 'vegetarian' && !value) next.vegan = false
      return next
    })
  }

  useEffect(() => {
    if (profile.lastCallAlerts) requestNotificationPermission().then((granted) => setPermissionDenied(!granted))
  }, [profile.lastCallAlerts])

  const toggles = t.profile.toggles

  return (
    <div>
      <PageHero image={HERO_IMAGES.profile} eyebrow={t.profile.heroEyebrow} title={t.profile.heroTitle} subtitle={t.profile.heroSubtitle} />

      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-2xl px-6">
          <SideNote n={1} text={t.profile.sideNote1} wrapperClassName="top-0 right-full mr-16" />
          <SectionHeading line1={t.profile.introTitle1} line2={t.profile.introTitle2} />

          <div className="mt-12 border-t border-[var(--border)]">
            {(['vegetarian', 'vegan', 'glutenFree', 'onBudget', 'lastCallAlerts'] as const).map((key) => (
              <ToggleRow key={key} label={toggles[key].label} description={toggles[key].desc} checked={profile[key]} onChange={(v) => update(key, v)} />
            ))}
          </div>

          {alertsBlocked && (
            <p role="status" className="mt-5 border-l-2 border-[#a4452c] pl-4 text-sm text-[var(--text-muted)]">
              {t.profile.alertsBlocked}
            </p>
          )}

          <p className="mt-8 text-center text-xs italic text-[var(--text-soft)]">{t.profile.footerNote}</p>
        </div>
      </section>

      <section className="relative bg-[var(--bg-sand)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <EveningPlanner profile={profile} />
        </div>
      </section>
    </div>
  )
}
