// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock sendMail before importing the module under test so no real emails fire
vi.mock('~/server/mailer', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }))
// Swap the production db singleton for testDb so checkBudgetAlerts hits the test database
import { testDb } from '../db'
vi.mock('~/server/db', () => ({ db: testDb }))

import { checkBudgetAlerts } from '~/server/budgetAlerts'
import { resetDb } from '../db'
import { createCategory, createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(resetDb)

// ── Helpers ────────────────────────────────────────────────────────────

const today = new Date()
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

const createBudget = (
  userId: string,
  categoryId: string,
  overrides?: {
    alertEnabled?: boolean
    alertThreshold?: number
    amount?: number
    endDate?: Date
    startDate?: Date
  }
) =>
  testDb.budget.create({
    data: {
      alertEnabled: overrides?.alertEnabled ?? true,
      alertThreshold: overrides?.alertThreshold ?? 0.8,
      amount: overrides?.amount ?? 500,
      categoryId,
      endDate: overrides?.endDate ?? monthEnd,
      name: 'Test Budget',
      period: 'MONTHLY',
      startDate: overrides?.startDate ?? monthStart,
      userId,
    },
  })

const createExpense = (userId: string, walletId: string, categoryId: string, amount: number) =>
  testDb.transaction.create({
    data: { amount, categoryId, date: today, type: 'EXPENSE', userId, walletId },
  })

// ── Tests ──────────────────────────────────────────────────────────────

describe('checkBudgetAlerts', () => {
  it('stamps alertSentAt when spending crosses the threshold', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Groceries', type: 'EXPENSE' })
    const budget = await createBudget(user.id, category.id, { amount: 500, alertThreshold: 0.8 })

    // Spend exactly 80% ($400 of $500)
    await createExpense(user.id, wallet.id, category.id, 400)

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).not.toBeNull()
  })

  it('does not stamp alertSentAt when spending is below the threshold', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Dining', type: 'EXPENSE' })
    const budget = await createBudget(user.id, category.id, { amount: 500, alertThreshold: 0.8 })

    // Spend only 50% ($250 of $500)
    await createExpense(user.id, wallet.id, category.id, 250)

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).toBeNull()
  })

  it('fires on 100%+ (over budget)', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Transport', type: 'EXPENSE' })
    const budget = await createBudget(user.id, category.id, { amount: 200, alertThreshold: 0.8 })

    await createExpense(user.id, wallet.id, category.id, 250)

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).not.toBeNull()
  })

  it('does not re-fire when alertSentAt is already set', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Utilities', type: 'EXPENSE' })
    const sentAt = new Date(Date.now() - 60_000)
    const budget = await createBudget(user.id, category.id, { amount: 300, alertThreshold: 0.8 })
    await testDb.budget.update({ data: { alertSentAt: sentAt }, where: { id: budget.id } })

    await createExpense(user.id, wallet.id, category.id, 290)

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    // alertSentAt should remain the original value, not be overwritten
    expect(updated.alertSentAt?.getTime()).toBe(sentAt.getTime())
  })

  it('clears alertSentAt when spending drops back below threshold (re-arms)', async () => {
    const user = await createUser()
    const category = await createCategory(user.id, { name: 'Shopping', type: 'EXPENSE' })
    const budget = await createBudget(user.id, category.id, { amount: 500, alertThreshold: 0.8 })
    // Pre-stamp alertSentAt as if alert already fired
    await testDb.budget.update({ data: { alertSentAt: new Date() }, where: { id: budget.id } })

    // No transactions → spending is $0, below threshold
    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).toBeNull()
  })

  it('skips budgets with alertEnabled: false', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Entertainment', type: 'EXPENSE' })
    const budget = await createBudget(user.id, category.id, {
      alertEnabled: false,
      alertThreshold: 0.8,
      amount: 100,
    })

    await createExpense(user.id, wallet.id, category.id, 100)

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).toBeNull()
  })

  it('ignores budgets whose date range does not include today', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Old Budget', type: 'EXPENSE' })
    const past = new Date(2020, 0, 1)
    const pastEnd = new Date(2020, 0, 31, 23, 59, 59, 999)
    const budget = await createBudget(user.id, category.id, {
      amount: 100,
      alertThreshold: 0.8,
      startDate: past,
      endDate: pastEnd,
    })

    await createExpense(user.id, wallet.id, category.id, 100)

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).toBeNull()
  })

  it('only counts EXPENSE transactions, not INCOME', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Salary', type: 'INCOME' })
    const budget = await createBudget(user.id, category.id, { amount: 500, alertThreshold: 0.8 })

    // Add INCOME transaction — should not count toward budget spending
    await testDb.transaction.create({
      data: { amount: 500, categoryId: category.id, date: today, type: 'INCOME', userId: user.id, walletId: wallet.id },
    })

    await checkBudgetAlerts(user.id, category.id)

    const updated = await testDb.budget.findUniqueOrThrow({ where: { id: budget.id } })
    expect(updated.alertSentAt).toBeNull()
  })
})
