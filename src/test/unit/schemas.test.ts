import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// ── Schemas under test ────────────────────────────────────────────────
// These mirror the Zod schemas used in the forms. Testing them in isolation
// verifies validation rules without needing to render UI.

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'INVESTMENT']),
  balance: z.coerce.number(),
  currency: z.string().length(3),
})

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  icon: z.string().max(2).optional(),
  color: z.string().optional(),
})

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  walletId: z.string().min(1, 'Wallet is required'),
  categoryId: z.string().optional(),
  description: z.string().max(255).optional(),
  date: z.date(),
})

const budgetSchema = z.object({
  alertEnabled: z.boolean(),
  alertThreshold: z.coerce.number().min(1).max(100),
  name: z.string().min(1, 'Name is required').max(50),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  categoryId: z.string().min(1, 'Category is required'),
  startDate: z.date(),
  endDate: z.date(),
})

// ── Wallet schema ─────────────────────────────────────────────────────

describe('walletSchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      walletSchema.parse({ name: 'Chase', type: 'CHECKING', balance: 1000, currency: 'USD' })
    ).not.toThrow()
  })

  it('rejects empty name', () => {
    const result = walletSchema.safeParse({ name: '', type: 'CHECKING', balance: 0, currency: 'USD' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 50 characters', () => {
    const result = walletSchema.safeParse({ name: 'a'.repeat(51), type: 'CHECKING', balance: 0, currency: 'USD' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid wallet type', () => {
    const result = walletSchema.safeParse({ name: 'Test', type: 'INVALID', balance: 0, currency: 'USD' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid wallet types', () => {
    const types = ['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'INVESTMENT'] as const
    for (const type of types) {
      const result = walletSchema.safeParse({ name: 'Test', type, balance: 0, currency: 'USD' })
      expect(result.success).toBe(true)
    }
  })

  it('rejects currency codes that are not 3 characters', () => {
    const result = walletSchema.safeParse({ name: 'Test', type: 'CHECKING', balance: 0, currency: 'US' })
    expect(result.success).toBe(false)
  })

  it('coerces balance string to number', () => {
    const result = walletSchema.safeParse({ name: 'Test', type: 'CHECKING', balance: '500', currency: 'USD' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.balance).toBe(500)
  })
})

// ── Category schema ───────────────────────────────────────────────────

describe('categorySchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      categorySchema.parse({ name: 'Food', type: 'EXPENSE' })
    ).not.toThrow()
  })

  it('rejects empty name', () => {
    const result = categorySchema.safeParse({ name: '', type: 'EXPENSE' })
    expect(result.success).toBe(false)
  })

  it('accepts optional icon and color', () => {
    const result = categorySchema.safeParse({ name: 'Food', type: 'EXPENSE', icon: '🍕', color: '#ff0000' })
    expect(result.success).toBe(true)
  })

  it('rejects icon longer than 2 characters', () => {
    const result = categorySchema.safeParse({ name: 'Food', type: 'EXPENSE', icon: 'abc' })
    expect(result.success).toBe(false)
  })
})

// ── Transaction schema ────────────────────────────────────────────────

describe('transactionSchema', () => {
  const base = { amount: 50, type: 'EXPENSE' as const, walletId: 'wallet-1', date: new Date() }

  it('accepts valid input', () => {
    expect(() => transactionSchema.parse(base)).not.toThrow()
  })

  it('rejects non-positive amount', () => {
    expect(transactionSchema.safeParse({ ...base, amount: 0 }).success).toBe(false)
    expect(transactionSchema.safeParse({ ...base, amount: -10 }).success).toBe(false)
  })

  it('rejects missing walletId', () => {
    const result = transactionSchema.safeParse({ ...base, walletId: '' })
    expect(result.success).toBe(false)
  })

  it('accepts optional categoryId and description', () => {
    const result = transactionSchema.safeParse({ ...base, categoryId: 'cat-1', description: 'Lunch' })
    expect(result.success).toBe(true)
  })
})

// ── Budget schema ─────────────────────────────────────────────────────

describe('budgetSchema', () => {
  const base = {
    alertEnabled: true,
    alertThreshold: 80,
    name: 'Food Budget',
    amount: 500,
    period: 'MONTHLY' as const,
    categoryId: 'cat-1',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-31'),
  }


  it('accepts valid input', () => {
    expect(() => budgetSchema.parse(base)).not.toThrow()
  })

  it('rejects empty name', () => {
    expect(budgetSchema.safeParse({ ...base, name: '' }).success).toBe(false)
  })

  it('rejects non-positive amount', () => {
    expect(budgetSchema.safeParse({ ...base, amount: 0 }).success).toBe(false)
    expect(budgetSchema.safeParse({ ...base, amount: -100 }).success).toBe(false)
  })

  it('accepts all valid periods', () => {
    for (const period of ['WEEKLY', 'MONTHLY', 'YEARLY'] as const) {
      expect(budgetSchema.safeParse({ ...base, period }).success).toBe(true)
    }
  })

  it('rejects missing categoryId', () => {
    expect(budgetSchema.safeParse({ ...base, categoryId: '' }).success).toBe(false)
  })

  it('rejects alertThreshold below 1', () => {
    expect(budgetSchema.safeParse({ ...base, alertThreshold: 0 }).success).toBe(false)
  })

  it('rejects alertThreshold above 100', () => {
    expect(budgetSchema.safeParse({ ...base, alertThreshold: 101 }).success).toBe(false)
  })

  it('accepts alertEnabled: false', () => {
    expect(budgetSchema.safeParse({ ...base, alertEnabled: false }).success).toBe(true)
  })

  it('coerces alertThreshold string to number', () => {
    const result = budgetSchema.safeParse({ ...base, alertThreshold: '75' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.alertThreshold).toBe(75)
  })
})
