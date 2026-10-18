import { NumberBadge } from '../components/NumberBadge'
import { PageHero } from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { STORY_IMAGES } from '../constants/images'
import { REPO_URL } from '../constants/links'
import { useLanguage } from '../i18n/LanguageContext'

const TEAM = { student: 'Mihai Chircu', supervisor: 'Azamat Jayush' }

const CREDITS = [
  { name: 'UNEP Food Waste Index Report 2024', url: 'https://www.unep.org/resources/publication/food-waste-index-report-2024', licence: 'Statistics, cited' },
  { name: 'FAO, Food Wastage Footprint (2013)', url: 'https://www.fao.org/4/i3347e/i3347e.pdf', licence: 'CO2e and water factors, cited' },
  { name: 'Our World in Data, food waste per capita', url: 'https://ourworldindata.org/grapher/food-waste-per-capita', licence: 'CC BY 4.0, embedded' },
  { name: 'TED, Tristram Stuart', url: 'https://www.ted.com/talks/tristram_stuart_the_global_food_waste_scandal', licence: 'Embedded from YouTube' },
  { name: 'Unsplash photographers', url: 'https://unsplash.com/license', licence: 'Unsplash License' },
  { name: 'Cormorant Garamond, Pinyon Script, Raleway', url: 'https://fonts.google.com/', licence: 'SIL Open Font License' },
  { name: 'Natural Earth via world-atlas', url: 'https://github.com/topojson/world-atlas', licence: 'Public domain / ISC' },
  { name: 'React, Vite, Tailwind CSS, d3-geo', url: 'https://github.com/Lucianainfo/WasteLand/blob/main/package.json', licence: 'MIT / ISC' },
]

/** Everything the jury needs in one place: team, category, how it was built, AI disclosure, sources and licences. */
export function AboutPage() {
  const { t } = useLanguage()
  const a = t.about

  return (
    <div>
      <PageHero image={STORY_IMAGES.bread} eyebrow={a.heroEyebrow} title={a.heroTitle} subtitle={a.heroSubtitle} />

      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-3xl px-6 text-center">
          <SectionHeading line1={a.projectTitle1} line2={a.projectTitle2} />
          <p className="mt-8 text-lg text-[var(--text-muted)]">{a.projectText}</p>

          <dl className="mx-auto mt-14 grid max-w-2xl gap-px bg-[var(--border)] sm:grid-cols-3">
            {[
              { label: a.student, value: TEAM.student },
              { label: a.supervisor, value: TEAM.supervisor },
              { label: a.category, value: a.categoryValue },
            ].map((row) => (
              <div key={row.label} className="bg-[var(--bg)] px-4 py-6">
                <dt className="eyebrow text-[0.6rem] text-[var(--accent)]">{row.label}</dt>
                <dd className="font-display mt-2 text-xl text-[var(--text)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="relative bg-[var(--bg-sand)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto grid max-w-5xl gap-14 px-6 md:grid-cols-2">
          <Reveal>
            <SectionHeading line1={a.realTitle1} line2={a.realTitle2} align="left" />
            <p className="eyebrow mt-10 text-[var(--accent)]">{a.realLabel}</p>
            <ul className="mt-4 space-y-3 text-[var(--text-muted)]">
              {a.realItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow text-[var(--accent)] md:mt-[7.5rem]">{a.simulatedLabel}</p>
            <ul className="mt-4 space-y-3 text-[var(--text-muted)]">
              {a.simulatedItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 border border-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-5xl px-6">
          <SectionHeading line1={a.builtTitle1} line2={a.builtTitle2} />
          <ol className="mt-14 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {a.builtItems.map((item, i) => (
              <Reveal key={item} delay={(i % 2) * 100}>
                <li className="flex gap-5 border-t border-[var(--border)] pt-6">
                  <NumberBadge n={i + 1} size="sm" />
                  <p className="text-[var(--text-muted)]">{item}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative bg-[var(--cocoa-deep)] py-24 text-[var(--champagne)] sm:py-32">
        <div className="relative z-[2] mx-auto max-w-3xl px-6 text-center">
          <SectionHeading eyebrow={a.aiEyebrow} line1={a.aiTitle1} line2={a.aiTitle2} dark />
          <p className="mt-8 text-[var(--champagne)]/85">{a.aiText}</p>
          <dl className="mx-auto mt-10 grid max-w-xl gap-6 text-left sm:grid-cols-2">
            <div className="border-t border-[var(--champagne)]/20 pt-4">
              <dt className="eyebrow text-[0.6rem] text-[var(--gold)]">{a.aiTool}</dt>
              <dd className="font-display mt-1 text-xl text-[var(--bg-card)]">Claude Code (Anthropic)</dd>
            </div>
            <div className="border-t border-[var(--champagne)]/20 pt-4">
              <dt className="eyebrow text-[0.6rem] text-[var(--gold)]">{a.aiModel}</dt>
              <dd className="font-display mt-1 text-xl text-[var(--bg-card)]">Claude Opus 5.5</dd>
            </div>
          </dl>
          <a href={`${REPO_URL}/blob/main/docs/AI_USAGE.md`} target="_blank" rel="noopener noreferrer" className="btn-lux btn-light mt-12">
            {a.aiLink}
          </a>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-4xl px-6">
          <SectionHeading line1={a.creditsTitle1} line2={a.creditsTitle2} />
          <ul className="mt-14 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {CREDITS.map((c) => (
              <li key={c.name} className="flex flex-col justify-between gap-1 py-4 sm:flex-row sm:items-baseline">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-display text-xl text-[var(--text)] hover:italic hover:text-[var(--cocoa)]">
                  {c.name}
                </a>
                <span className="text-xs tracking-wide text-[var(--text-soft)]">{c.licence}</span>
              </li>
            ))}
          </ul>
          <div className="mt-14 text-center">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn-lux btn-solid">
              {a.sourceCode}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
