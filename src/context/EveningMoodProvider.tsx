import { useState, type ReactNode } from 'react'
import { EveningMoodContext, type EveningMood } from './eveningMood'

export function EveningMoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMood] = useState<EveningMood | null>(null)
  return <EveningMoodContext.Provider value={{ mood, setMood }}>{children}</EveningMoodContext.Provider>
}
