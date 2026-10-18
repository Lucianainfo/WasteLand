import { describe, expect, it } from 'vitest'
import { areaPath, niceCeiling, smoothLinePath } from './chartPath'

describe('smoothLinePath', () => {
  it('returns an empty path for no points', () => {
    expect(smoothLinePath([], 0, 100)).toBe('')
  })

  it('returns a lone move command for a single point', () => {
    expect(smoothLinePath([{ x: 10, y: 20 }], 0, 100)).toBe('M 10.0 20.0')
  })

  it('draws one cubic segment per pair of points, ending on the last point', () => {
    const path = smoothLinePath(
      [
        { x: 0, y: 50 },
        { x: 100, y: 20 },
        { x: 200, y: 80 },
      ],
      0,
      100
    )
    expect(path.startsWith('M 0.0 50.0')).toBe(true)
    expect(path.match(/ C /g)).toHaveLength(2)
    expect(path.endsWith('200.0 80.0')).toBe(true)
  })

  it('keeps control points inside the vertical bounds so the curve never overshoots the axis', () => {
    const path = smoothLinePath(
      [
        { x: 0, y: 100 },
        { x: 50, y: 0 },
        { x: 100, y: 100 },
      ],
      0,
      100
    )
    const ys = [...path.matchAll(/ (-?\d+\.\d) (?=-?\d|,|$)/g)].map((m) => Number(m[1]))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(100)
  })
})

describe('areaPath', () => {
  it('closes the line down to the baseline', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 40, y: 30 },
    ]
    const area = areaPath(smoothLinePath(points, 0, 100), points, 100)
    expect(area.endsWith('L 40.0 100.0 L 0.0 100.0 Z')).toBe(true)
  })
})

describe('niceCeiling', () => {
  it('never goes below the floor', () => {
    expect(niceCeiling(2, 10)).toBe(10)
  })

  it('rounds up to a clean axis value with headroom above the data', () => {
    expect(niceCeiling(41, 10)).toBe(50)
    expect(niceCeiling(87, 10)).toBe(100)
    expect(niceCeiling(12, 10)).toBe(20)
  })
})
