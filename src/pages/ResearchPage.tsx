import { useState, type ReactNode } from 'react'
import benchmark from '../../research/results/benchmark.json'
import { NumberBadge } from '../components/NumberBadge'
import { PageHero } from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { HERO_IMAGES } from '../constants/images'
import { useLanguage } from '../i18n/LanguageContext'
import { researchTexts } from '../i18n/research'
import { fill, type Lang } from '../i18n/translations'
import {
  afterCommission, breakEvenCommission, COMMISSION_RATES, disposalSavedEur, DISPOSAL_PLACEHOLDER_EUR_PER_KG, infraLoad, platformCostPerVenue,
  venueRecovery,
} from '../utils/economics'
import { formatNumber } from '../utils/format'
import { findingValues, formatFixed, formatPercent, hypothesisVerdict, type Verdict } from '../utils/research'

type RuleId = 'A' | 'B' | 'C' | 'A2'
const RULES: RuleId[] = ['A', 'B', 'C', 'A2']
const HYPOTHESES = ['H1a', 'H1b', 'H2a', 'H2b'] as const

const RULE_COLOR: Record<RuleId, string> = { A: '#a99b88', B: '#c9b48f', C: '#3f281c', A2: '#8a6a4f' }
const VERDICT_STYLE: Record<Verdict, { background: string; color: string }> = {
  supported: { background: '#e3ecdf', color: '#2f5d3a' },
  partial: { background: '#f3e8cb', color: '#7a5a12' },
  notSupported: { background: '#f2dcd3', color: '#8c3a24' },
}

const pooled = benchmark.primary.pooled
const bakery = benchmark.bakery

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-lux p-6 sm:p-8 ${className}`}>{children}</div>
}

function Th({ children, align = 'right' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <th className={`whitespace-nowrap px-3 py-3 ${align === 'left' ? 'text-left' : 'text-right'} eyebrow text-[var(--text-soft)]`}>{children}</th>
}

function Td({ children, align = 'right', strong = false }: { children: ReactNode; align?: 'left' | 'right'; strong?: boolean }) {
  return <td className={`px-3 py-3 ${align === 'left' ? 'text-left' : 'text-right'} tabular-nums ${strong ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{children}</td>
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[34rem] border-collapse text-sm [&_tbody_tr]:border-t [&_tbody_tr]:border-[var(--border)]">{children}</table>
    </div>
  )
}

function Chip({ verdict, label }: { verdict: Verdict; label: string }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={VERDICT_STYLE[verdict]}>
      {label}
    </span>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-[var(--bg-sand)]">
      <div className="h-full rounded-full" style={{ width: `${Math.max(2, (value / max) * 100)}%`, background: color }} />
    </div>
  )
}

function SliderField({ label, value, min, max, step, onChange, format }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm text-[var(--text-muted)]">
        <span>{label}</span>
        <span className="font-display text-2xl text-[var(--text)] tabular-nums">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--cocoa)]"
      />
    </label>
  )
}

/** Revenue (line) against the exponent of the price curve; the deployed exponent is marked. */
function SweepChart({ lang }: { lang: Lang }) {
  const points = benchmark.sweep.gammas
  const revenues = points.map((p) => p.revenue)
  const lo = Math.min(...revenues)
  const hi = Math.max(...revenues)
  const W = 560
  const H = 200
  const padX = 44
  const padY = 24
  const x = (i: number) => padX + (i / (points.length - 1)) * (W - padX * 2)
  const y = (v: number) => padY + (1 - (v - lo) / (hi - lo)) * (H - padY * 2)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Revenue against the curve exponent">
      <path d={line} fill="none" stroke="var(--cocoa)" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={p.gamma}>
          <circle cx={x(i)} cy={y(p.revenue)} r={p.gamma === 1.3 ? 6 : 3.5} fill={p.gamma === 1.3 ? 'var(--gold)' : 'var(--cocoa)'} stroke="var(--cocoa-deep)" strokeWidth={p.gamma === 1.3 ? 1.5 : 0} />
          <text x={x(i)} y={H + 14} textAnchor="middle" fontSize="11" fill="var(--text-soft)">
            {formatNumber(p.gamma, lang, 2)}
          </text>
          <text x={x(i)} y={y(p.revenue) - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
            {formatFixed(p.revenue, lang, 2)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ResearchPage() {
  const { lang } = useLanguage()
  const r = researchTexts[lang]
  const pct = (x: number, digits = 1, signed = true) => formatPercent(x, lang, digits, signed)
  const money = (x: number, digits = 2) => `€${formatFixed(x, lang, digits)}`

  const [items, setItems] = useState<number>(bakery.itemsPerDay)
  const [price, setPrice] = useState<number>(bakery.priceMdl)
  const [days, setDays] = useState<number>(bakery.daysPerMonth)
  const [disposal, setDisposal] = useState(DISPOSAL_PLACEHOLDER_EUR_PER_KG)

  const venue = { itemsPerDay: items, priceMdl: price, kgPerItem: bakery.kgPerItem, daysPerMonth: days, mdlPerEur: bakery.mdlPerEur }
  const yieldOf = (id: RuleId) => ({ valueShare: bakery.methods[id].valueShare, sellThrough: bakery.methods[id].sellThrough })
  const recovery = Object.fromEntries(RULES.map((id) => [id, venueRecovery(yieldOf(id), venue)])) as Record<RuleId, ReturnType<typeof venueRecovery>>
  const c = recovery.C
  const roiRows = [
    { key: 'bin', label: r.rowBin, items: 0, month: 0, year: 0, eurYear: 0, strong: false },
    { key: 'A', label: r.method.A.name, items: recovery.A.itemsRescuedPerDay, month: recovery.A.mdlPerMonth, year: recovery.A.mdlPerYear, eurYear: recovery.A.eurPerYear, strong: false },
    { key: 'B', label: r.method.B.name, items: recovery.B.itemsRescuedPerDay, month: recovery.B.mdlPerMonth, year: recovery.B.mdlPerYear, eurYear: recovery.B.eurPerYear, strong: false },
    { key: 'C', label: r.method.C.name, items: c.itemsRescuedPerDay, month: c.mdlPerMonth, year: c.mdlPerYear, eurYear: c.eurPerYear, strong: true },
    ...COMMISSION_RATES.map((rate) => ({
      key: `A2-${rate}`,
      label: fill(r.rowPlatform, { rate: rate * 100 }),
      items: recovery.A2.itemsRescuedPerDay,
      month: afterCommission(recovery.A2.mdlPerMonth, rate),
      year: afterCommission(recovery.A2.mdlPerYear, rate),
      eurYear: afterCommission(recovery.A2.eurPerYear, rate),
      strong: false,
    })),
  ]

  const finding = findingValues(benchmark)
  const f = (x: number) => formatFixed(x, lang, 1)
  const findings = r.findings.map((text) => fill(text, { a: f(finding.a), b: f(finding.b), c: f(finding.c), d: f(finding.d), e: f(finding.e), f: f(finding.f) }))

  const breakEven = breakEvenCommission(yieldOf('C'), yieldOf('A2'))
  const kgPerMonth = c.kgPerMonth

  const traffic = [
    { label: r.costRows[0], sessions: 300, active: 0.02, commercial: false },
    { label: r.costRows[1], sessions: 5000, active: 0.25, commercial: true },
    { label: r.costRows[2], sessions: 50000, active: 1, commercial: true },
  ].map((row) => {
    const load = infraLoad({ sessionsPerMonth: row.sessions, searchesPerSession: 3, reservationsPerSession: 0.1, activeShare: row.active })
    const bill = row.commercial ? platformCostPerVenue(1, load.extraUsd).eurPerMonth : 0
    return { ...row, load, bill }
  })

  return (
    <div>
      <PageHero image={HERO_IMAGES.research} eyebrow={r.eyebrow} title={r.title} subtitle={r.subtitle} />

      <div className="relative z-[2] mx-auto max-w-6xl px-6">
        <p className="mt-10 rounded-sm border border-[var(--gold)] bg-[var(--bg-sand)] px-5 py-4 text-sm text-[var(--text-muted)]">{r.simulationBanner}</p>
      </div>

      {/* Hypotheses */}
      <section className="relative py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow={r.hypEyebrow} line1={r.hypTitle1} line2={r.hypTitle2} />
          <p className="mx-auto mt-6 max-w-3xl text-center text-[var(--text-muted)]">{fill(r.hypIntro, { date: benchmark.meta.date })}</p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {HYPOTHESES.map((id, i) => {
              const h = benchmark.primary.hypotheses[id]
              const verdict = hypothesisVerdict(h.estimate, h.low, h.target)
              return (
                <Reveal key={id} delay={i * 80}>
                  <Card className="h-full">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 basis-[14rem] items-center gap-3">
                        <NumberBadge n={i + 1} size="sm" />
                        <h3 className="font-display text-2xl text-[var(--text)]">{r.hyp[id].title}</h3>
                      </div>
                      <Chip verdict={verdict} label={r.verdict[verdict]} />
                    </div>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">{r.hyp[id].text}</p>
                    <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <dt className="eyebrow text-[var(--text-soft)]">{r.target}</dt>
                        <dd className="mt-1 font-display text-2xl text-[var(--text)]">≥ {pct(h.target, 0, false)}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-[var(--text-soft)]">{r.observed}</dt>
                        <dd className="mt-1 font-display text-2xl text-[var(--text)]">{pct(h.estimate)}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-[var(--text-soft)]">{r.interval}</dt>
                        <dd className="mt-1 text-sm text-[var(--text-muted)]">
                          {pct(h.low)} … {pct(h.high)}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-xs text-[var(--text-soft)]">{fill(r.cellsWon, { n: h.cellsWon })}</p>
                  </Card>
                </Reveal>
              )
            })}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-[var(--text-soft)]">{r.hypNote}</p>
        </div>
      </section>

      {/* Benchmark */}
      <section className="relative bg-[var(--bg-sand)] py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow={r.benchEyebrow} line1={r.benchTitle1} line2={r.benchTitle2} />
          <p className="mx-auto mt-6 max-w-3xl text-center text-[var(--text-muted)]">
            {fill(r.benchNote, { trials: formatNumber(benchmark.meta.totalTrials, lang), cells: benchmark.meta.cells })}
          </p>
          <Card className="mt-12">
            <Table>
              <thead>
                <tr>
                  <Th align="left">{r.colMethod}</Th>
                  <Th>{r.colRescued}</Th>
                  <Th>{r.colRevenue}</Th>
                  <Th>{r.colSurplus}</Th>
                  <Th>{r.colKg}</Th>
                </tr>
              </thead>
              <tbody>
                {RULES.map((id) => (
                  <tr key={id}>
                    <Td align="left" strong={id === 'C'}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: RULE_COLOR[id] }} />
                        {r.method[id].name}
                      </span>
                      <span className="block text-xs font-normal text-[var(--text-soft)]">{r.method[id].desc}</span>
                    </Td>
                    <Td strong={id === 'C'}>{pct(pooled[id].sellThrough, 1, false)}</Td>
                    <Td strong={id === 'C'}>{money(pooled[id].revenue)}</Td>
                    <Td strong={id === 'C'}>{money(pooled[id].surplus)}</Td>
                    <Td strong={id === 'C'}>{formatFixed(pooled[id].kg, lang, 2)} kg</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {(['sellThrough', 'revenue'] as const).map((metric) => {
                const max = Math.max(...RULES.map((id) => pooled[id][metric]))
                return (
                  <div key={metric} className="space-y-3">
                    <p className="eyebrow text-[var(--text-soft)]">{metric === 'sellThrough' ? r.colRescued : r.colRevenue}</p>
                    {RULES.map((id) => (
                      <div key={id}>
                        <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                          <span>{r.method[id].name}</span>
                          <span className="tabular-nums">{metric === 'sellThrough' ? pct(pooled[id][metric], 1, false) : money(pooled[id][metric])}</span>
                        </div>
                        <Bar value={pooled[id][metric]} max={max} color={RULE_COLOR[id]} />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </Card>

          <h3 className="mt-16 text-center font-display text-3xl text-[var(--text)]">{r.findingsTitle}</h3>
          <ol className="mx-auto mt-8 max-w-3xl space-y-5">
            {findings.map((text, i) => (
              <li key={i} className="flex gap-4">
                <NumberBadge n={i + 1} size="sm" className="mt-1" />
                <p className="text-[var(--text-muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Exponent sweep, ablation, sensitivity */}
      <section className="relative py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-6xl space-y-12 px-6">
          <Card>
            <h3 className="font-display text-3xl text-[var(--text)]">{r.sweepTitle}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{fill(r.sweepNote, { best: formatNumber(benchmark.sweep.bestRevenueGamma, lang, 2) })}</p>
            <div className="mt-6">
              <SweepChart lang={lang} />
            </div>
            <div className="mt-6">
              <Table>
                <thead>
                  <tr>
                    <Th align="left">{r.colGamma}</Th>
                    <Th>{r.colRevenue}</Th>
                    <Th>{r.colRescued}</Th>
                    <Th>{r.colVsProduction}</Th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.sweep.gammas.map((g) => (
                    <tr key={g.gamma}>
                      <Td align="left" strong={g.gamma === 1.3}>{formatNumber(g.gamma, lang, 2)}</Td>
                      <Td strong={g.gamma === 1.3}>{money(g.revenue)}</Td>
                      <Td strong={g.gamma === 1.3}>{pct(g.sellThrough, 1, false)}</Td>
                      <Td strong={g.gamma === 1.3}>
                        {g.gamma === 1.3 ? '—' : `${pct(g.revenueVsProduction.estimate)} (${pct(g.revenueVsProduction.low)} … ${pct(g.revenueVsProduction.high)})`}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Card>
              <h3 className="font-display text-3xl text-[var(--text)]">{r.ablationTitle}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{r.ablationNote}</p>
              <div className="mt-6">
                <Table>
                  <thead>
                    <tr>
                      <Th align="left">γ / {r.colBoost}</Th>
                      <Th>{r.colRescuedShort}</Th>
                      <Th>{r.colRevenueShort}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmark.ablation.map((a) => (
                      <tr key={a.id}>
                        <Td align="left" strong={a.id === 'curve+boost'}>{a.label}</Td>
                        <Td strong={a.id === 'curve+boost'}>{a.id === 'linear' ? '—' : pct(a.sellThroughVsB.estimate)}</Td>
                        <Td strong={a.id === 'curve+boost'}>{a.id === 'linear' ? '—' : pct(a.revenueVsB.estimate)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-[var(--text-soft)]">{r.colVsB}</p>
            </Card>

            <Card>
              <h3 className="font-display text-3xl text-[var(--text)]">{r.sensTitle}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{r.sensNote}</p>
              <div className="mt-6">
                <Table>
                  <thead>
                    <tr>
                      <Th align="left">{r.colAssumption}</Th>
                      <Th>{r.colRescuedShort} · {r.colVsA}</Th>
                      <Th>{r.colRevenueShort} · {r.colVsA}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmark.sensitivity.map((s) => (
                      <tr key={s.id}>
                        <Td align="left">{s.label}</Td>
                        <Td>{pct(s.sellThroughVsA.estimate)}</Td>
                        <Td>{pct(s.revenueVsA.estimate)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Venue ROI */}
      <section className="relative bg-[var(--bg-dark)] py-20 text-[var(--bg-card)] sm:py-28">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow={r.roiEyebrow} line1={r.roiTitle1} line2={r.roiTitle2} dark />
          <p className="mx-auto mt-6 max-w-3xl text-center font-light text-[var(--bg-card)]/80">{r.roiIntro}</p>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="panel-dark space-y-6 p-6 text-[var(--bg-card)] [&_*]:text-inherit [&_span.text-2xl]:text-[var(--champagne)]">
              <SliderField label={r.fItems} value={items} min={1} max={60} step={1} onChange={setItems} />
              <SliderField label={r.fPrice} value={price} min={10} max={400} step={5} onChange={setPrice} />
              <SliderField label={r.fDays} value={days} min={20} max={31} step={1} onChange={setDays} />
              <SliderField label={r.fDisposal} value={disposal} min={0} max={0.5} step={0.05} onChange={setDisposal} format={(v) => `€${formatFixed(v, lang, 2)}`} />
            </div>

            <div className="panel-dark min-w-0 p-4 sm:p-6">
              <div className="text-[var(--bg-card)] [&_th]:!text-[var(--gold)] [&_td]:!text-[var(--bg-card)]/85 [&_tr]:!border-[var(--bg-card)]/15">
                <Table>
                  <thead>
                    <tr>
                      <Th align="left">{r.colWhat}</Th>
                      <Th>{r.colItemsDay}</Th>
                      <Th>{r.colMonth}</Th>
                      <Th>{r.colYear}</Th>
                      <Th>{r.colYearEur}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiRows.map((row) => (
                      <tr key={row.key}>
                        <Td align="left" strong={row.strong}>{row.label}</Td>
                        <Td strong={row.strong}>{formatFixed(row.items, lang, 1)}</Td>
                        <Td strong={row.strong}>{formatNumber(Math.round(row.month), lang)}</Td>
                        <Td strong={row.strong}>{formatNumber(Math.round(row.year), lang)}</Td>
                        <Td strong={row.strong}>{formatNumber(Math.round(row.eurYear), lang)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <p className="mt-5 text-[var(--champagne)]">
                {fill(r.roiSummary, {
                  mdl: formatNumber(Math.round(c.mdlPerMonth), lang),
                  eur: formatNumber(Math.round(c.eurPerMonth), lang),
                  pct: formatFixed(bakery.methods.C.valueShare * 100, lang, 0),
                  items: formatFixed(c.itemsRescuedPerDay, lang, 1),
                })}
              </p>
              <p className="mt-3 text-sm text-[var(--bg-card)]/75">
                {fill(r.disposalLine, { eur: formatNumber(Math.round(disposalSavedEur(kgPerMonth, disposal)), lang) })} {fill(r.breakEven, { rate: formatFixed(breakEven * 100, lang, 0) })}
              </p>
            </div>
          </div>

          <ul className="mx-auto mt-10 max-w-3xl list-disc space-y-2 pl-5 text-sm text-[var(--bg-card)]/70">
            {r.roiNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cost to run */}
      <section className="relative py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-6xl px-6">
          <Card>
            <h3 className="font-display text-3xl text-[var(--text)]">{r.costTitle}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{r.costIntro}</p>
            <div className="mt-6">
              <Table>
                <thead>
                  <tr>
                    <Th align="left">{r.colScenario}</Th>
                    <Th>{r.colSessions}</Th>
                    <Th>{r.colCommands}</Th>
                    <Th>{r.colBill}</Th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.map((row) => (
                    <tr key={row.label}>
                      <Td align="left">{row.label}</Td>
                      <Td>{formatNumber(row.sessions, lang)}</Td>
                      <Td>{formatNumber(row.load.commands, lang)}</Td>
                      <Td strong>{money(row.bill)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
              {r.costNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Card>

          <div className="mx-auto mt-16 max-w-3xl">
            <h3 className="font-display text-3xl text-[var(--text)]">{r.limitsTitle}</h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--text-muted)]">
              {r.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-[var(--text-soft)]">{r.repoNote}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
