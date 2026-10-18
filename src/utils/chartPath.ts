export interface Point {
  x: number
  y: number
}

const n = (value: number) => value.toFixed(1)

/** Smooth SVG path through the points (Catmull-Rom converted to cubic Béziers), with control points kept inside [minY, maxY]. */
export function smoothLinePath(points: Point[], minY: number, maxY: number): string {
  if (points.length === 0) return ''
  const clampY = (y: number) => Math.min(maxY, Math.max(minY, y))

  let d = `M ${n(points[0].x)} ${n(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clampY(p1.y + (p2.y - p0.y) / 6) }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clampY(p2.y - (p3.y - p1.y) / 6) }
    d += ` C ${n(c1.x)} ${n(c1.y)}, ${n(c2.x)} ${n(c2.y)}, ${n(p2.x)} ${n(p2.y)}`
  }
  return d
}

/** Closes a line path down to the baseline so it can be filled as an area. */
export function areaPath(linePath: string, points: Point[], baseY: number): string {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath} L ${n(last.x)} ${n(baseY)} L ${n(first.x)} ${n(baseY)} Z`
}

/** Rounds a maximum up to a "nice" axis ceiling (never below `floor`) so gridlines land on clean numbers. */
export function niceCeiling(max: number, floor: number): number {
  const target = Math.max(max * 1.1, floor)
  const magnitude = 10 ** Math.floor(Math.log10(target))
  const steps = [1, 2, 2.5, 5, 10]
  const step = steps.find((s) => s * magnitude >= target) ?? 10
  return step * magnitude
}
