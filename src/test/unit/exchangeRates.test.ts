import { describe, expect, it } from 'vitest'

import { convertToBase } from '~/server/exchangeRates'

// Simulated rates where USD is the base (USD = 1)
const rates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  JPY: 149.5,
}

describe('convertToBase', () => {
  it('returns amount unchanged when currency matches base', () => {
    expect(convertToBase(100, 'USD', rates)).toBeCloseTo(100)
  })

  it('converts EUR to USD correctly', () => {
    // €92 EUR → $100 USD: 92 / 0.92 = 100
    expect(convertToBase(92, 'EUR', rates)).toBeCloseTo(100)
  })

  it('converts GBP to USD correctly', () => {
    // £79 GBP → $100 USD: 79 / 0.79 = 100
    expect(convertToBase(79, 'GBP', rates)).toBeCloseTo(100)
  })

  it('converts CAD to USD correctly', () => {
    // CA$135 → $100 USD: 135 / 1.35 = 100
    expect(convertToBase(135, 'CAD', rates)).toBeCloseTo(100)
  })

  it('converts JPY to USD correctly', () => {
    expect(convertToBase(1495, 'JPY', rates)).toBeCloseTo(10)
  })

  it('returns amount unchanged for unknown currency', () => {
    expect(convertToBase(100, 'XYZ', rates)).toBe(100)
  })

  it('returns amount unchanged when rate is 0', () => {
    expect(convertToBase(100, 'EUR', { EUR: 0 })).toBe(100)
  })

  it('handles zero amount', () => {
    expect(convertToBase(0, 'EUR', rates)).toBe(0)
  })

  it('handles negative amounts', () => {
    // Used for credit card balances
    expect(convertToBase(-92, 'EUR', rates)).toBeCloseTo(-100)
  })
})
