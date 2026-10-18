import { describe, expect, it } from 'vitest'
import { CLOSING_SOON_MINUTES, LAST_CALL_MINUTES, urgencyOf } from './urgency'

describe('urgencyOf', () => {
  it('marks sold-out offers first, whatever their timing', () => {
    expect(urgencyOf({ status: 'live', quantityLeft: 0, minutesToClose: 10 })).toBe('soldOut')
  })

  it('marks offers that have not opened yet as upcoming', () => {
    expect(urgencyOf({ status: 'upcoming', quantityLeft: 3, minutesToClose: 300 })).toBe('upcoming')
  })

  it('grades open offers by the time left before closing', () => {
    expect(urgencyOf({ status: 'live', quantityLeft: 3, minutesToClose: LAST_CALL_MINUTES })).toBe('lastCall')
    expect(urgencyOf({ status: 'live', quantityLeft: 3, minutesToClose: LAST_CALL_MINUTES + 1 })).toBe('closingSoon')
    expect(urgencyOf({ status: 'live', quantityLeft: 3, minutesToClose: CLOSING_SOON_MINUTES })).toBe('closingSoon')
    expect(urgencyOf({ status: 'live', quantityLeft: 3, minutesToClose: CLOSING_SOON_MINUTES + 1 })).toBe('open')
  })
})
