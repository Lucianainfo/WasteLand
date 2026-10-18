import { NumberBadge } from '../components/NumberBadge'
import { OwidEmbed } from '../components/OwidEmbed'
import { PageHero } from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { SideNote } from '../components/SideNote'
import { StatCard } from '../components/StatCard'
import { YoutubeEmbed } from '../components/YoutubeEmbed'
import { HERO_IMAGES, STORY_IMAGES, unsplash } from '../constants/images'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCompact } from '../utils/format'

export function ProblemPage() {
  const { t, lang } = useLanguage()
  const p = t.problem

  return (
    <div>
      <PageHero image={HERO_IMAGES.problem} eyebrow={p.heroEyebrow} title={p.heroTitle} subtitle={p.heroSubtitle} />

      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-3xl px-6">
          <SideNote n={1} text={p.sideNote1} source={p.sideNote1Source} wrapperClassName="top-0 right-full mr-16" />
          <SideNote n={2} text={p.sideNote2} source={p.sideNote2Source} wrapperClassName="top-40 left-full ml-16" />
          <Reveal>
            <SectionHeading line1={p.introTitle1} line2={p.introTitle2} />
            <p className="mt-8 text-center text-lg text-[var(--text-muted)]">{p.intro}</p>
          </Reveal>
        </div>

        <div className="relative z-[2] mx-auto mt-20 grid max-w-5xl gap-14 px-6 sm:grid-cols-3 sm:gap-8">
          <Reveal delay={0}>
            <StatCard stat={`${formatCompact(1.05e9, lang)} t`} label={p.stat1Label} source={p.stat1Source} />
          </Reveal>
          <Reveal delay={120}>
            <StatCard stat="19%" label={p.stat2Label} source={p.stat2Source} />
          </Reveal>
          <Reveal delay={240}>
            <StatCard stat="8–10%" label={p.stat3Label} source={p.stat3Source} />
          </Reveal>
        </div>
      </section>

      <section className="relative bg-[var(--bg-sand)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
          <Reveal>
            <img src={unsplash(STORY_IMAGES.window, 900, 1100)} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </Reveal>
          <Reveal delay={120}>
            <SectionHeading line1={p.whyTitle1} line2={p.whyTitle2} align="left" />
            <ul className="mt-10 space-y-7">
              {p.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-5">
                  <NumberBadge n={i + 1} size="sm" className="mt-1" />
                  <p className="text-[var(--text-muted)]">{bullet}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-5xl px-6">
          <Reveal>
            <SectionHeading eyebrow={p.chartEyebrow} line1={p.chartTitle} />
            <div className="mt-12">
              <OwidEmbed slug="food-waste-per-capita" title={p.owidTitle} source={p.owidSource} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative bg-[var(--bg-dark)] py-24 sm:py-32">
        <div className="relative z-[2] mx-auto max-w-4xl px-6">
          <Reveal>
            <SectionHeading eyebrow={p.videoEyebrow} line1={p.videoTitle} dark />
            <div className="mt-12">
              <YoutubeEmbed videoId="cWC_zDdF74s" title="Tristram Stuart: The global food waste scandal" credit={p.videoCredit} />
            </div>
          </Reveal>
        </div>
      </section>

      <p className="relative z-[2] mx-auto max-w-3xl px-6 py-12 text-center text-xs text-[var(--text-soft)]">{p.sourcesFooter}</p>
    </div>
  )
}
