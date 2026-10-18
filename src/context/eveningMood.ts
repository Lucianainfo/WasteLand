import { createContext, useContext } from 'react'

/** The last city the user looked at, as the background sees it. */
export interface EveningMood {
  city: string
  liveOffers: number
  lastCall: boolean
}

export interface EveningMoodValue {
  mood: EveningMood | null
  setMood: (mood: EveningMood | null) => void
}

export const EveningMoodContext = createContext<EveningMoodValue | null>(null)

export function useEveningMood(): EveningMoodValue {
  const ctx = useContext(EveningMoodContext)
  if (!ctx) throw new Error('useEveningMood must be used within an EveningMoodProvider')
  return ctx
}
