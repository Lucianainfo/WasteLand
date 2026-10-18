import { Fragment } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Lang } from '../i18n/translations'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ro', label: 'RO' },
  { code: 'ru', label: 'RU' },
]

/** "EN / RO / RU", with the active language bright and the others dimmed, as on the hotel site. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  return (
    <div className={`flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.2em] ${className}`}>
      {LANGS.map((l, i) => (
        <Fragment key={l.code}>
          {i > 0 && <span className="opacity-40">/</span>}
          <button
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            className={`px-0.5 py-1 transition-opacity ${lang === l.code ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
          >
            {l.label}
          </button>
        </Fragment>
      ))}
    </div>
  )
}
