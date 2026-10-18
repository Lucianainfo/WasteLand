import { Link } from 'react-router-dom'
import { ImpactLab } from '../components/ImpactLab'
import { NumberBadge } from '../components/NumberBadge'
import { OrgLinkPanel } from '../components/OrgLinkPanel'
import { PageHero } from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { HERO_IMAGES, STORY_IMAGES, unsplash } from '../constants/images'
import { useLanguage } from '../i18n/LanguageContext'

const ORG_URLS = [
  'https://www.unep.org/resources/publication/food-waste-index-report-2024',
  'https://www.fao.org/platform-food-loss-waste/en',
  'https://www.wrap.ngo/',
]

const WIN_IMAGES = [STORY_IMAGES.plate, STORY_IMAGES.chef, STORY_IMAGES.market]

export function SolutionPage() {
  const { t } = useLanguage()
  const s = t.solution

  return (
    <div>
      <PageHero image={HERO_IMAGES.solution} eyebrow={s.heroEyebrow} title={s.heroTitle} subtitle={s.heroSubtitle} />

      {/* Win, win, win */}
      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading line1={s.winsTitle1} line2={s.winsTitle2} />
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {s.wins.map((win, i) => (
              <Reveal key={win.title} delay={i * 140}>
                <article className="group">
                  <div className="overflow-hidden">
                    <img
                      src={unsplash(WIN_IMAGES[i], 700, 860)}
                      alt=""
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <NumberBadge n={i + 1} size="sm" />
                    <h3 className="font-display text-3xl text-[var(--text)]">{win.title}</h3>
                  </div>
                  <p className="mt-3 text-[var(--text-muted)]">{win.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative bg-[var(--bg-sand)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading line1={s.featuresTitle1} line2={s.featuresTitle2} />
          <div className="mt-16 grid gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {s.features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100} className="bg-[var(--bg-sand)]">
                <div className="h-full p-8">
                  <NumberBadge n={i + 1} size="sm" />
                  <p className="font-display mt-5 text-2xl text-[var(--text)]">{f.title}</p>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Impact lab */}
      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow={s.impactEyebrow} line1={s.impactTitle1} line2={s.impactTitle2} />
          <p className="mx-auto mt-6 max-w-2xl text-center text-[var(--text-muted)]">{s.impactText}</p>
          <Reveal className="mt-14">
            <ImpactLab />
          </Reveal>
        </div>
      </section>

      {/* At home */}
      <section className="relative bg-[var(--bg-sand)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-5xl px-6">
          <SectionHeading line1={s.preventionTitle1} line2={s.preventionTitle2} />
          <ol className="mt-14 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {s.preventionTips.map((tip, i) => (
              <Reveal key={i} delay={(i % 2) * 100}>
                <li className="flex gap-5 border-t border-[var(--border)] pt-6">
                  <NumberBadge n={i + 1} size="sm" />
                  <p className="text-[var(--text-muted)]">{tip}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <p className="mt-10 text-center text-xs italic text-[var(--text-soft)]">{s.preventionNote}</p>
        </div>
      </section>

      {/* Organisations */}
      <section className="relative bg-[var(--cocoa-deep)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow={s.orgsEyebrow} line1={s.orgsTitle1} line2={s.orgsTitle2} dark />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {s.orgs.map((org, i) => (
              <Reveal key={org.name} delay={i * 120}>
                <OrgLinkPanel n={i + 1} name={org.name} description={org.desc} url={ORG_URLS[i]} ctaLabel={s.orgCta} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="relative py-24 text-center sm:py-32">
        <div className="relative z-[2] mx-auto max-w-2xl px-6">
          <span className="ornament mx-auto w-48" aria-hidden="true">
            ◆
          </span>
          <h2 className="font-display mt-8 text-[clamp(2.2rem,5vw,3.6rem)] leading-tight text-[var(--text)]">
            <em className="text-[var(--cocoa)]">{s.ctaTitle}</em>
          </h2>
          <p className="mt-5 text-[var(--text-muted)]">{s.ctaText}</p>
          <Link to="/" className="btn-lux btn-solid mt-10">
            {s.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  )
}
