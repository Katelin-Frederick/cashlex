import { describe, expect, it } from 'vitest'

import { CURRENCIES, CURRENCY_CODES, formatCurrency } from '~/lib/currencies'

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })

  it('formats EUR correctly', () => {
    expect(formatCurrency(50, 'EUR')).toBe('€50.00')
  })

  it('formats GBP correctly', () => {
    expect(formatCurrency(75, 'GBP')).toBe('£75.00')
  })

  it('formats JPY with no decimal places', () => {
    // JPY does not use decimal places
    expect(formatCurrency(1000, 'JPY')).toBe('¥1,000')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00')
  })

  it('formats large amounts with thousands separator', () => {
    expect(formatCurrency(1_000_000, 'USD')).toBe('$1,000,000.00')
  })
})

describe('CURRENCIES', () => {
  it('contains 15 currencies', () => {
    expect(CURRENCIES).toHaveLength(15)
  })

  it('includes USD', () => {
    expect(CURRENCY_CODES).toContain('USD')
  })

  it('includes EUR', () => {
    expect(CURRENCY_CODES).toContain('EUR')
  })

  it('includes GBP', () => {
    expect(CURRENCY_CODES).toContain('GBP')
  })

  it('each currency has a 3-character code', () => {
    for (const c of CURRENCIES) {
      expect(c.code).toHaveLength(3)
    }
  })

  it('each currency has a non-empty name', () => {
    for (const c of CURRENCIES) {
      expect(c.name.length).toBeGreaterThan(0)
    }
  })

  it('all currency codes are uppercase', () => {
    for (const c of CURRENCIES) {
      expect(c.code).toBe(c.code.toUpperCase())
    }
  })

  it('CURRENCY_CODES length matches CURRENCIES length', () => {
    expect(CURRENCY_CODES).toHaveLength(CURRENCIES.length)
  })
})
