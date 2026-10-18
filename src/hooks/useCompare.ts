import { useRef, useState } from 'react'
import { fill, type Translation } from '../i18n/translations'
import type { CityOffers } from '../types/food'
import { fetchOffers } from '../utils/foodApi'

export type CompareState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; a: CityOffers; b: CityOffers; runId: number }

export function useCompare(t: Translation) {
  const [cityA, setCityA] = useState('')
  const [cityB, setCityB] = useState('')
  const [state, setState] = useState<CompareState>({ status: 'idle' })
  const runs = useRef(0)

  async function race(a = cityA, b = cityB) {
    const nameA = a.trim()
    const nameB = b.trim()
    setCityA(nameA)
    setCityB(nameB)
    if (!nameA || !nameB) {
      setState({ status: 'error', message: t.compare.errorMissing })
      return
    }

    const runId = ++runs.current
    setState({ status: 'loading' })
    const [ra, rb] = await Promise.all([fetchOffers(nameA), fetchOffers(nameB)])
    if (runId !== runs.current) return

    for (const [result, name] of [[ra, nameA], [rb, nameB]] as const) {
      if (!result.ok) {
        setState({ status: 'error', message: result.reason === 'notFound' ? fill(t.compare.errorNotFound, { city: name }) : t.compare.errorGeneric })
        return
      }
    }
    if (ra.ok && rb.ok) setState({ status: 'done', a: ra.data, b: rb.data, runId })
  }

  return { cityA, setCityA, cityB, setCityB, state, race }
}
