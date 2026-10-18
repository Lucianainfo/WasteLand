import { useRef, useState } from 'react'
import { urgencyOf } from '../constants/urgency'
import { fill, type Translation } from '../i18n/translations'
import type { CityOffers, HistoryDay, UserProfile } from '../types/food'
import { fetchHistory, fetchOffers } from '../utils/foodApi'
import { formatDuration } from '../utils/format'
import { notifyLastCall } from '../utils/notifications'
import { matchesProfile } from '../utils/recommendations'

export type HistoryStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useOffers(profile: UserProfile, t: Translation) {
  const [city, setCity] = useState('')
  const [data, setData] = useState<CityOffers | null>(null)
  const [history, setHistory] = useState<HistoryDay[]>([])
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [available, setAvailable] = useState<string[]>([])
  const latestRequest = useRef(0)

  /** `query` overrides the text field (e.g. "tokyo" from the globe); `label` is what the field shows afterwards. */
  async function search(query?: string, label?: string) {
    const text = (query ?? city).trim()
    if (!text) return
    if (query !== undefined) setCity(label ?? query)

    const requestId = ++latestRequest.current
    setLoading(true)
    setError('')
    setAvailable([])
    setData(null)
    setHistory([])
    setHistoryStatus('idle')

    const result = await fetchOffers(text)
    if (requestId !== latestRequest.current) return

    if (!result.ok) {
      setError(result.reason === 'notFound' ? t.home.errorNotFound : t.home.errorGeneric)
      setAvailable(result.available ?? [])
      setLoading(false)
      return
    }

    setData(result.data)
    setLoading(false)

    // Proactive alert: food that fits the user is about to be thrown away nearby.
    if (profile.lastCallAlerts) {
      for (const offer of result.data.offers) {
        if (urgencyOf(offer) === 'lastCall' && matchesProfile(offer, profile)) {
          notifyLastCall(
            offer.id,
            fill(t.rec.notifyTitle, { venue: offer.venueName }),
            fill(t.rec.notifyBody, { item: t.items[offer.item], pct: offer.discountPct, time: formatDuration(offer.minutesToClose, t.common) })
          )
        }
      }
    }

    setHistoryStatus('loading')
    const days = await fetchHistory(result.data.city.id)
    if (requestId !== latestRequest.current) return
    if (days) {
      setHistory(days)
      setHistoryStatus('ready')
    } else {
      setHistoryStatus('error')
    }
  }

  /** Re-reads the listing for the current city without clearing the screen (after a reservation). */
  async function refresh() {
    if (!data) return
    const requestId = latestRequest.current
    const result = await fetchOffers(data.city.id)
    if (requestId === latestRequest.current && result.ok) setData(result.data)
  }

  return { city, setCity, data, history, historyStatus, loading, error, available, search, refresh }
}
