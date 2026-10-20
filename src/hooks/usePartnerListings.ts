import { useEffect, useState } from 'react'
import type { SavedListing } from '../types/food'

const STORAGE_KEY = 'wasteland-partner-listings'
const MAX_SAVED = 20

function load(): SavedListing[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? (parsed as SavedListing[]) : []
  } catch {
    return []
  }
}

/** The listings this device published, with their secret removal tokens. They never leave the browser except to remove a listing. */
export function usePartnerListings() {
  const [saved, setSaved] = useState<SavedListing[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      // localStorage unavailable — the list lasts for this session only
    }
  }, [saved])

  function add(entry: SavedListing) {
    setSaved((prev) => [entry, ...prev].slice(0, MAX_SAVED))
  }

  function markRemoved(id: string) {
    setSaved((prev) => prev.map((s) => (s.listing.id === id ? { ...s, removed: true } : s)))
  }

  return { saved, add, markRemoved }
}
