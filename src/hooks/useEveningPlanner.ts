import { useEffect, useRef, useState } from 'react'
import type { Translation } from '../i18n/translations'
import type { CityInfo, EveningHour } from '../types/food'
import { fetchEvening } from '../utils/foodApi'

const STORAGE_KEY = 'wasteland-home-city'

export type PlannerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; city: CityInfo; hours: EveningHour[] }

function loadHomeCity(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Loads the rest of today for a home city, remembered on this device. */
export function useEveningPlanner(t: Translation) {
  const [homeCity, setHomeCity] = useState(loadHomeCity)
  // A remembered home city is planned straight away, so start in the loading state.
  const [state, setState] = useState<PlannerState>(() => (loadHomeCity() ? { status: 'loading' } : { status: 'idle' }))
  const latest = useRef(0)
  const tRef = useRef(t)

  useEffect(() => {
    tRef.current = t
  }, [t])

  /** Fetches and stores the plan; callers decide whether to show the loading state first. */
  async function fetchPlan(city: string) {
    const requestId = ++latest.current
    const result = await fetchEvening(city)
    if (requestId !== latest.current) return
    if (!result.ok) {
      setState({ status: 'error', message: result.reason === 'notFound' ? tRef.current.planner.errorNotFound : tRef.current.planner.errorGeneric })
      return
    }
    setState({ status: 'ready', city: result.data.city, hours: result.data.hours })
    setHomeCity(result.data.city.name)
    try {
      localStorage.setItem(STORAGE_KEY, result.data.city.name)
    } catch {
      // not remembered — fine
    }
  }

  function load(name: string) {
    const city = name.trim()
    if (!city) return
    setState({ status: 'loading' })
    void fetchPlan(city)
  }

  useEffect(() => {
    const saved = loadHomeCity()
    if (saved) void fetchPlan(saved)
  }, [])

  return { homeCity, setHomeCity, state, load }
}
