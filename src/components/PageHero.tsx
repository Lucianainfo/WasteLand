import type { ReactNode } from 'react'
import { unsplash } from '../constants/images'

interface PageHeroProps {
  image: string
  eyebrow: string
  title: string
  subtitle?: string
  children?: ReactNode
  /** The home page gets a full-screen hero; inner pages a shorter one. */
  tall?: boolean
  scrollLabel?: string
  scrollTarget?: string
}

/**
 * Full-bleed photograph with a slow "Ken Burns" settle, a script headline and a tracked
 * eyebrow — the opening of every page, after the hotel site's "La dolce vita" hero.
 */
export function PageHero({ image, eyebrow, title, subtitle, children, tall = false, scrollLabel, scrollTarget }: PageHeroProps) {
  return (
    <section className={`relative flex items-center justify-center overflow-hidden bg-[var(--bg-dark)] text-center ${tall ? 'min-h-[100svh]' : 'min-h-[72svh]'}`}>
      <img
        src={unsplash(image, 2000)}
        srcSet={`${unsplash(image, 900)} 900w, ${unsplash(image, 1500)} 1500w, ${unsplash(image, 2200)} 2200w`}
        sizes="100vw"
        alt=""
        className="hero-image absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,16,12,0.25)_0%,rgba(20,16,12,0.62)_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative z-[2] mx-auto max-w-4xl px-6 pt-28 pb-24 text-[var(--bg-card)]">
        <p className="eyebrow rise-in text-[var(--champagne)]" style={{ animationDelay: '0.15s' }}>
          {eyebrow}
        </p>
        <h1
          className="font-script rise-in mt-4 text-[clamp(3.6rem,11vw,8.5rem)] leading-[1.05] drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]"
          style={{ animationDelay: '0.35s' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="rise-in mx-auto mt-6 max-w-2xl text-base font-light text-[var(--bg-card)]/90 sm:text-lg text-balance" style={{ animationDelay: '0.6s' }}>
            {subtitle}
          </p>
        )}
        {children && (
          <div className="rise-in mt-10" style={{ animationDelay: '0.85s' }}>
            {children}
          </div>
        )}
      </div>

      {scrollLabel && scrollTarget && (
        <a href={scrollTarget} className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-3 text-[var(--champagne)]">
          <span className="eyebrow">{scrollLabel}</span>
          <span className="block h-12 w-px overflow-hidden bg-white/20">
            <span className="scroll-cue block h-full w-full bg-[var(--champagne)]" />
          </span>
        </a>
      )}
    </section>
  )
}
