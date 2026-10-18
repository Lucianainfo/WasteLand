import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { Emblem } from './Emblem'
import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * Split navigation around a centred crest. Transparent over the photographic hero at the top of
 * every page, then a frosted cream bar once the page scrolls.
 */
export function Navbar() {
  const { t } = useLanguage()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40)
  const [open, setOpen] = useState(false)
  // Close the mobile menu whenever the route changes (adjusting state during render, not in an effect).
  const [menuPath, setMenuPath] = useState(location.pathname)
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const left = [
    { to: '/problem', label: t.nav.problem, end: false },
    { to: '/solution', label: t.nav.solution, end: false },
    { to: '/', label: t.nav.live, end: true },
  ]
  const right = [
    { to: '/compare', label: t.nav.compare, end: false },
    { to: '/profile', label: t.nav.profile, end: false },
  ]

  const solid = scrolled
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-opacity after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-500 ${
      isActive ? 'opacity-100 after:scale-x-100' : 'opacity-75 hover:opacity-100 after:scale-x-0 hover:after:scale-x-100'
    }`

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color,padding] duration-500 ${
          solid
            ? 'bg-[var(--bg)]/92 text-[var(--text)] shadow-[0_10px_30px_-24px_rgba(42,33,24,0.6)] backdrop-blur-md py-2'
            : 'bg-gradient-to-b from-black/45 to-transparent text-[var(--champagne)] py-4'
        }`}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-5 sm:px-8">
          <nav className="hidden items-center justify-end gap-7 lg:flex" aria-label="Primary">
            {left.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="lg:hidden" />

          <NavLink to="/" aria-label="WasteLand" className="flex flex-col items-center">
            <Emblem className={`transition-all duration-500 ${solid ? 'h-11 w-11' : 'h-14 w-14'}`} />
            <span className={`font-display text-[0.62rem] uppercase tracking-[0.42em] transition-opacity duration-500 ${solid ? 'hidden' : 'mt-1 opacity-90'}`}>
              WasteLand
            </span>
          </NavLink>

          <div className="flex items-center justify-end gap-7">
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Secondary">
              {right.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <span className="hidden h-4 w-px bg-current opacity-30 lg:block" />
            <LanguageSwitcher className="hidden lg:flex" />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
              aria-label={t.nav.menu}
              aria-expanded={open}
            >
              <span className="h-px w-6 bg-current" />
              <span className="h-px w-6 bg-current" />
              <span className="h-px w-4 self-end bg-current mr-2" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-[var(--cocoa-deep)] text-[var(--champagne)] transition-opacity duration-500 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={t.nav.menu}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Emblem className="h-12 w-12" />
          <button type="button" onClick={() => setOpen(false)} className="eyebrow px-2 py-3" tabIndex={open ? 0 : -1}>
            {t.nav.close}
          </button>
        </div>
        <nav className="flex flex-1 flex-col items-center justify-center gap-5">
          {[...left, ...right].map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              tabIndex={open ? 0 : -1}
              className={({ isActive }) =>
                `font-display text-4xl transition-all duration-700 ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${isActive ? 'italic text-white' : ''}`
              }
              style={{ transitionDelay: open ? `${120 + i * 60}ms` : '0ms' }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-3 pb-10">
          <span className="ornament w-40" aria-hidden="true">
            ◆
          </span>
          <LanguageSwitcher />
          <p className="eyebrow opacity-60">{t.nav.tagline}</p>
        </div>
      </div>
    </>
  )
}
