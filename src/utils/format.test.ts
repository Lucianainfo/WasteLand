import { describe, expect, it } from 'vitest'
import { formatDuration, formatMoney } from './format'

const units = { h: 'h', min: 'min' }

describe('formatDuration', () => {
  it('formats minutes, hours and both', () => {
    expect(formatDuration(45, units)).toBe('45 min')
    expect(formatDuration(120, units)).toBe('2 h')
    expect(formatDuration(80, units)).toBe('1 h 20 min')
    expect(formatDuration(-5, units)).toBe('0 min')
  })
})

describe('formatMoney', () => {
  it('shows cents for small prices and whole units for large ones', () => {
    expect(formatMoney(4.5, 'EUR', 'en')).toBe('€4.50')
    expect(formatMoney(740, 'JPY', 'en')).toBe('JP¥740')
    expect(formatMoney(12000, 'KRW', 'en')).toContain('12,000')
  })
})
