import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Eases a displayed number toward `target`, so changes glide instead of jumping. Skips the animation if the user prefers reduced motion. */
export function useCountUp(target: number, durationMs = 650): number {
  const [reduced] = useState(prefersReducedMotion)
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    if (reduced) return

    const from = valueRef.current
    const start = performance.now()
    let frame = 0

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = from + (target - from) * eased
      valueRef.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, reduced])

  return reduced ? target : value
}
