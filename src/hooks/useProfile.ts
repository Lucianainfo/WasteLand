import { useEffect, useState } from 'react'
import type { UserProfile } from '../types/food'

const STORAGE_KEY = 'wasteland-profile'

export const DEFAULT_PROFILE: UserProfile = {
  vegetarian: false,
  vegan: false,
  glutenFree: false,
  onBudget: false,
  lastCallAlerts: false,
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // localStorage unavailable (private mode, etc.) — the profile stays session-only
    }
  }, [profile])

  return { profile, setProfile }
}
