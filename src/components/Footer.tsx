import { Link } from 'react-router-dom'
import { REPO_URL } from '../constants/links'
import { useLanguage } from '../i18n/LanguageContext'
import { Emblem } from './Emblem'

const ORG_LINKS = [
  { name: 'UNEP Food Waste Index', url: 'https://www.unep.org/resources/publication/food-waste-index-report-2024' },
  { name: 'FAO', url: 'https://www.fao.org/platform-food-loss-waste/en' },
  { name: 'WRAP', url: 'https://www.wrap.ngo/' },
  { name: 'UN SDG 12.3', url: 'https://sdgs.un.org/goals/goal12' },
  { name: 'GitHub · source code', url: REPO_URL },
]

export function Footer() {
  const { t } = useLanguage()
  const links = [
    { to: '/', label: t.nav.live },
    { to: '/problem', label: t.nav.problem },
    { to: '/solution', label: t.nav.solution },
    { to: '/compare', label: t.nav.compare },
    { to: '/profile', label: t.nav.profile },
    { to: '/about', label: t.footer.about },
  ]

  return (
    <footer className="relative z-[2] overflow-hidden bg-[var(--cocoa-deep)] text-[var(--champagne)]">
      <span
        aria-hidden="true"
        className="font-script pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 select-none text-[16rem] leading-none text-[var(--gold)] opacity-[0.12] sm:text-[22rem]"
      >
        W
      </span>

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-10 sm:px-10">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Emblem className="h-16 w-16 text-[var(--champagne)]" />
            <p className="font-display mt-5 text-3xl text-[var(--bg-card)]">WasteLand</p>
            <p className="font-display mt-1 text-lg italic text-[var(--gold)]">{t.nav.tagline}</p>
          </div>

          <div>
            <p className="eyebrow border-b border-[var(--champagne)]/15 pb-3 text-[var(--gold)]">{t.footer.discover}</p>
            <ul className="mt-5 space-y-3">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="font-display text-xl text-[var(--bg-card)] transition-colors hover:text-[var(--champagne)] hover:italic">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow border-b border-[var(--champagne)]/15 pb-3 text-[var(--gold)]">{t.footer.organisations}</p>
            <ul className="mt-5 space-y-3">
              {ORG_LINKS.map((org) => (
                <li key={org.url}>
                  <a href={org.url} target="_blank" rel="noopener noreferrer" className="font-display text-xl text-[var(--bg-card)] transition-colors hover:text-[var(--champagne)] hover:italic">
                    {org.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-16 h-px w-2/3 bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

        <div className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <a href="#top" className="group flex items-center gap-4">
            <span className="eyebrow text-[var(--gold)]">{t.footer.backToTop}</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--champagne)]/40 transition-colors group-hover:bg-[var(--champagne)] group-hover:text-[var(--cocoa-deep)]">
              ↑
            </span>
          </a>
          <p className="text-center text-xs text-[var(--champagne)]/60 sm:text-right">
            © 2026 WasteLand · {t.footer.rights}
            <br />
            {t.footer.credits}
          </p>
        </div>
      </div>
    </footer>
  )
}
