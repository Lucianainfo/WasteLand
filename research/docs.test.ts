import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import benchmark from './results/benchmark.json' with { type: 'json' }
import { abstractHtml, annexHtml, assertVerdicts, eur, fmt, hyp, recovery } from './docs.ts'

// Git on Windows may check files out with CRLF line endings; everything below compares text with LF
const lf = (text: string) => text.replaceAll('\r\n', '\n')
const file = (name: string) => lf(readFileSync(new URL(`../docs/${name}`, import.meta.url), 'utf8'))
const sha = (text: string) => createHash('sha256').update(text).digest('hex')

describe('the pre-registration', () => {
  it('is the file the benchmark ran against (its SHA-256 is recorded in the results)', () => {
    const prereg = lf(readFileSync(new URL('./PREREGISTRATION.md', import.meta.url), 'utf8'))
    expect(sha(prereg)).toBe(benchmark.meta.preregistrationSha256)
  })

  it('states the targets the code tests', () => {
    const text = lf(readFileSync(new URL('./PREREGISTRATION.md', import.meta.url), 'utf8'))
    for (const id of ['H1a', 'H1b', 'H2a', 'H2b']) expect(text).toContain(`**${id}**`)
    expect(text).toContain('≥ +25%')
    expect(text).toContain('≥ +18%')
    expect(benchmark.primary.hypotheses.H1a.target).toBe(0.25)
    expect(benchmark.primary.hypotheses.H2a.target).toBe(0.18)
  })

  it('was run with N ≥ 100 trials in every cell', () => {
    expect(benchmark.meta.trialsPerCell).toBeGreaterThanOrEqual(100)
    expect(benchmark.meta.totalTrials).toBe(benchmark.meta.trialsPerCell * benchmark.meta.cells)
    expect(benchmark.meta.run).toBe('registered')
  })
})

describe('docs/moldsef are built from the benchmark', () => {
  it('has an abstract that is exactly what research/docs.ts builds from benchmark.json (run makeDocs.ts after a new benchmark)', () => {
    expect(file('moldsef/abstract.html')).toBe(abstractHtml())
  })

  it('has a visual annex that is exactly what research/docs.ts builds', () => {
    expect(file('moldsef/visual-annex.html')).toBe(annexHtml())
  })

  it('writes prose that matches the verdicts of the benchmark', () => {
    expect(() => assertVerdicts()).not.toThrow()
    for (const h of Object.values(benchmark.primary.hypotheses)) expect(h.verdict).toBe('partial')
    expect(file('moldsef/abstract.html')).toContain('<b>All four hypotheses are partially supported.</b>')
  })

  it('quotes the main numbers of the benchmark', () => {
    const abstract = file('moldsef/abstract.html')
    expect(abstract).toContain(`${(hyp.H1a.estimate * 100).toFixed(1)}% more portions`)
    expect(abstract).toContain(`${fmt(recovery.C.mdlPerMonth)} MDL a month`)
    for (const id of ['A', 'B', 'C', 'A2'] as const) {
      expect(abstract).toContain(eur(benchmark.primary.pooled[id].revenue, 2))
    }
  })

  it('does not claim that 1.3 is optimal', () => {
    expect(file('moldsef/abstract.html')).toContain('not a sharp optimum')
    expect(file('moldsef/abstract.html')).toContain('rather than a proven optimum')
  })

  it('uses Times New Roman at 12 pt and stays small enough to upload', () => {
    const abstract = file('moldsef/abstract.html')
    expect(abstract).toContain('font-family: "Times New Roman"')
    expect(abstract).toContain('font-size: 12pt')
    expect(Buffer.byteLength(abstract)).toBeLessThan(1_000_000)
  })

  it('has PDFs of the documents, each under 1 MB', () => {
    for (const name of ['moldsef/abstract.pdf', 'moldsef/visual-annex.pdf', 'poster/poster-A0.pdf']) {
      const size = readFileSync(new URL(`../docs/${name}`, import.meta.url)).length
      expect(size).toBeGreaterThan(10_000)
      expect(size).toBeLessThan(1_000_000)
    }
  })

  it('has a poster with two inlined QR codes', () => {
    const poster = file('poster/poster-A0.html')
    expect(poster).toContain(file('poster/qr-site.svg').trim())
    expect(poster).toContain(file('poster/qr-code.svg').trim())
    expect(poster).toContain('waste-land-beta.vercel.app')
    expect(poster).toContain('github.com/Lucianainfo/WasteLand')
  })

  it('has a poster built from the same data', () => {
    const poster = file('poster/poster-A0.html')
    expect(poster).toContain('@page { size: 841mm 1189mm; margin: 0; }')
    expect(poster).toContain(`${(hyp.H1a.estimate * 100).toFixed(1)}%`)
    expect(poster).toContain(fmt(recovery.C.mdlPerMonth))
  })
})

describe('the pitch quotes the benchmark and the cost model', () => {
  const pitch = file('PITCH.md')

  it('has the main numbers', () => {
    const x = benchmark.primary
    expect(pitch).toContain(`${(x.hypotheses.H1a.estimate * 100).toFixed(1)}%`)
    expect(pitch).toContain(`${(x.hypotheses.H2a.estimate * 100).toFixed(1)}%`)
    expect(pitch).toContain(`${(x.hypotheses.H1b.estimate * 100).toFixed(1)}%`)
    expect(pitch).toContain(`${(x.hypotheses.H2b.estimate * 100).toFixed(1)}%`)
    expect(pitch).toContain(`${(Math.abs(x.extra.sellThrough_vs_A2.estimate) * 100).toFixed(1)}%`)
    expect(pitch).toContain(`${(x.extra.revenue_vs_A2.estimate * 100).toFixed(1)}%`)
    expect(pitch).toContain(`${fmt(recovery.C.mdlPerMonth)} lei`)
    expect(pitch).toContain(`${fmt(recovery.C.eurPerYear)} euro`)
  })

  it('says all four hypotheses are only partially supported', () => {
    expect(pitch).toContain('All four hypotheses are only partially supported')
  })

  it('is about three minutes: 350–520 words in the pitch section', () => {
    const section = pitch.split('## The pitch')[1].split('### Demo steps')[0]
    const words = section.split(/\s+/).filter(Boolean).length
    expect(words).toBeGreaterThan(350)
    expect(words).toBeLessThan(520)
  })
})

describe('the logbook', () => {
  const log = file('moldsef/logbook.md')

  it('has the five original iterations and the upgrade entries', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(log).toContain(`| ${n} | 2026-10-`)
    for (const n of [6, 7, 8, 9, 10]) expect(log).toContain(`### Entry ${n} —`)
  })

  it('says who ticked the student-check boxes: the student, by word, not verified by the AI', () => {
    expect(log).toContain('A ticked box means the student told the classmate helping them')
    expect(log).toContain('was not verified by the AI')
    expect(log).toContain('☑ scanned both QR codes with a phone')
    expect(log).not.toContain('✅')
  })

  it('quotes real commit hashes', () => {
    for (const hash of ['9249b71', 'c73151a', 'd49b27c']) expect(log).toContain(hash)
  })
})
