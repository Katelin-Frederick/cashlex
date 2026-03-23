// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { createCaller } from '~/server/api/root'
import { resetDb, testDb } from '../db'
import { createCategory, createTestContext, createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(resetDb)

// ── Date helpers ─────────────────────────────────────────────────────────────
// Use local noon to stay safely within month boundaries regardless of timezone.

const now = new Date()
const thisMonthDate = (day: number) =>
  new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0)
const lastMonthDate = (day: number) =>
  new Date(now.getFullYear(), now.getMonth() - 1, day, 12, 0, 0)

// ── spendingVelocity ─────────────────────────────────────────────────────────

describe('insight.spendingVelocity', () => {
  it('returns current month spend and last month totals', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    // $150 this month
    await testDb.transaction.createMany({
      data: [
        { amount: 100, type: 'EXPENSE', date: thisMonthDate(2), userId: user.id, walletId: wallet.id },
        { amount: 50, type: 'EXPENSE', date: thisMonthDate(3), userId: user.id, walletId: wallet.id },
      ],
    })

    // $200 last month
    await testDb.transaction.create({
      data: { amount: 200, type: 'EXPENSE', date: lastMonthDate(5), userId: user.id, walletId: wallet.id },
    })

    const result = await caller.insight.spendingVelocity()

    expect(result.currentSpend).toBeCloseTo(150)
    expect(result.lastMonthTotal).toBeCloseTo(200)
    expect(result.projected).toBeGreaterThan(0)
    expect(result.daysInMonth).toBeGreaterThanOrEqual(28)
  })

  it('returns zero when there are no transactions', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const result = await caller.insight.spendingVelocity()

    expect(result.currentSpend).toBe(0)
    expect(result.lastMonthTotal).toBe(0)
  })

  it('does not count INCOME transactions', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    await testDb.transaction.createMany({
      data: [
        { amount: 500, type: 'INCOME', date: thisMonthDate(2), userId: user.id, walletId: wallet.id },
        { amount: 80, type: 'EXPENSE', date: thisMonthDate(3), userId: user.id, walletId: wallet.id },
      ],
    })

    const result = await caller.insight.spendingVelocity()

    expect(result.currentSpend).toBeCloseTo(80)
  })
})

// ── categoryTrends ───────────────────────────────────────────────────────────

describe('insight.categoryTrends', () => {
  it('calculates month-over-month change per category', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const food = await createCategory(user.id, { name: 'Food', type: 'EXPENSE' })
    const travel = await createCategory(user.id, { name: 'Travel', type: 'EXPENSE' })
    const caller = createCaller(createTestContext(user.id))

    // This month: Food $100, Travel $50
    await testDb.transaction.createMany({
      data: [
        { amount: 100, type: 'EXPENSE', date: thisMonthDate(2), userId: user.id, walletId: wallet.id, categoryId: food.id },
        { amount: 50, type: 'EXPENSE', date: thisMonthDate(3), userId: user.id, walletId: wallet.id, categoryId: travel.id },
      ],
    })

    // Last month: Food $80 (Food up 25%), Travel $100 (Travel down 50%)
    await testDb.transaction.createMany({
      data: [
        { amount: 80, type: 'EXPENSE', date: lastMonthDate(5), userId: user.id, walletId: wallet.id, categoryId: food.id },
        { amount: 100, type: 'EXPENSE', date: lastMonthDate(6), userId: user.id, walletId: wallet.id, categoryId: travel.id },
      ],
    })

    const trends = await caller.insight.categoryTrends()

    const foodTrend = trends.find((t) => t.name === 'Food')
    const travelTrend = trends.find((t) => t.name === 'Travel')

    expect(foodTrend?.currentAmount).toBeCloseTo(100)
    expect(foodTrend?.lastAmount).toBeCloseTo(80)
    expect(foodTrend?.change).toBeCloseTo(25)

    expect(travelTrend?.currentAmount).toBeCloseTo(50)
    expect(travelTrend?.lastAmount).toBeCloseTo(100)
    expect(travelTrend?.change).toBeCloseTo(-50)
  })

  it('includes categories that only appeared last month with currentAmount 0', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const cat = await createCategory(user.id, { name: 'OldCat', type: 'EXPENSE' })
    const caller = createCaller(createTestContext(user.id))

    // Only last month
    await testDb.transaction.create({
      data: { amount: 60, type: 'EXPENSE', date: lastMonthDate(5), userId: user.id, walletId: wallet.id, categoryId: cat.id },
    })

    const trends = await caller.insight.categoryTrends()

    const entry = trends.find((t) => t.name === 'OldCat')
    expect(entry?.currentAmount).toBe(0)
    expect(entry?.lastAmount).toBeCloseTo(60)
  })
})

// ── dayOfWeekPattern ─────────────────────────────────────────────────────────

describe('insight.dayOfWeekPattern', () => {
  it('returns 7 day-of-week buckets', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const result = await caller.insight.dayOfWeekPattern()

    expect(result).toHaveLength(7)
    expect(result.map((r) => r.day)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })

  it('aggregates expense totals by day of week', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    // Find a recent Monday within the last 90 days
    const recent = new Date()
    recent.setDate(recent.getDate() - 7)
    const mondayOffset = (recent.getDay() === 0 ? -6 : 1 - recent.getDay())
    const monday = new Date(recent)
    monday.setDate(recent.getDate() + mondayOffset)

    await testDb.transaction.createMany({
      data: [
        { amount: 40, type: 'EXPENSE', date: monday, userId: user.id, walletId: wallet.id },
        { amount: 60, type: 'EXPENSE', date: monday, userId: user.id, walletId: wallet.id },
      ],
    })

    const result = await caller.insight.dayOfWeekPattern()
    const monEntry = result.find((r) => r.day === 'Mon')

    expect(monEntry?.total).toBeCloseTo(100)
    expect(monEntry?.count).toBe(2)
    expect(monEntry?.average).toBeCloseTo(50)
  })

  it('excludes transactions outside the 90-day window', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 91)

    await testDb.transaction.create({
      data: { amount: 999, type: 'EXPENSE', date: oldDate, userId: user.id, walletId: wallet.id },
    })

    const result = await caller.insight.dayOfWeekPattern()
    const totals = result.map((r) => r.total)

    expect(totals.every((t) => t === 0)).toBe(true)
  })
})

// ── savingsRate ───────────────────────────────────────────────────────────────

describe('insight.savingsRate', () => {
  it('returns 6 months of data', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const result = await caller.insight.savingsRate()

    expect(result).toHaveLength(6)
  })

  it('calculates savings rate correctly when income > expenses', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    // This month: $1000 income, $600 expenses → 40% savings rate
    await testDb.transaction.createMany({
      data: [
        { amount: 1000, type: 'INCOME', date: thisMonthDate(1), userId: user.id, walletId: wallet.id },
        { amount: 600, type: 'EXPENSE', date: thisMonthDate(2), userId: user.id, walletId: wallet.id },
      ],
    })

    const result = await caller.insight.savingsRate()
    const thisMonth = result.at(-1)!

    expect(thisMonth.income).toBeCloseTo(1000)
    expect(thisMonth.expenses).toBeCloseTo(600)
    expect(thisMonth.rate).toBeCloseTo(40)
  })

  it('returns null rate when there is no income', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    // Only expenses, no income
    await testDb.transaction.create({
      data: { amount: 200, type: 'EXPENSE', date: thisMonthDate(2), userId: user.id, walletId: wallet.id },
    })

    const result = await caller.insight.savingsRate()
    const thisMonth = result.at(-1)!

    expect(thisMonth.rate).toBeNull()
  })
})
