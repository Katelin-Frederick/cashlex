// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/mailer', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }))
import { testDb } from '../db'
vi.mock('~/server/db', () => ({ db: testDb }))

import { sendBillReminders } from '~/server/cron'
import { resetDb } from '../db'
import { createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(async () => {
  await resetDb()
  vi.clearAllMocks()
})

// ── Helpers ────────────────────────────────────────────────────────────

const daysFromNow = (n: number): Date => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(12, 0, 0, 0) // noon to avoid midnight edge cases
  return d
}

type ReminderOverrides = {
  reminderEnabled?: boolean
  reminderDaysAhead?: number
  reminderSentForDate?: Date | null
  nextDueDate?: Date
  isActive?: boolean
  walletId?: string | null
}

const createRecurring = async (userId: string, walletId: string, overrides: ReminderOverrides = {}) =>
  testDb.recurringExpense.create({
    data: {
      amount: 50,
      frequency: 'MONTHLY',
      isActive: overrides.isActive ?? true,
      name: 'Netflix',
      nextDueDate: overrides.nextDueDate ?? daysFromNow(3),
      reminderDaysAhead: overrides.reminderDaysAhead ?? 3,
      reminderEnabled: overrides.reminderEnabled ?? true,
      reminderSentForDate: overrides.reminderSentForDate ?? null,
      userId,
      walletId: overrides.walletId !== undefined ? overrides.walletId : walletId,
    },
  })

// ── Tests ──────────────────────────────────────────────────────────────

describe('sendBillReminders', () => {
  it('stamps reminderSentForDate when due within the window', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: daysFromNow(2),
      reminderDaysAhead: 3,
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).not.toBeNull()
  })

  it('does not stamp when due date is outside the window', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: daysFromNow(10),
      reminderDaysAhead: 3,
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).toBeNull()
  })

  it('does not re-stamp when reminderSentForDate already matches nextDueDate', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const dueDate = daysFromNow(2)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: dueDate,
      reminderDaysAhead: 3,
      reminderSentForDate: dueDate,
    })

    await sendBillReminders()

    // The stamp should remain unchanged (no second update)
    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate?.getTime()).toBe(dueDate.getTime())
  })

  it('skips expenses with reminderEnabled: false', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: daysFromNow(1),
      reminderEnabled: false,
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).toBeNull()
  })

  it('skips inactive expenses', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      isActive: false,
      nextDueDate: daysFromNow(1),
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).toBeNull()
  })

  it('skips expenses with no linked wallet', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: daysFromNow(1),
      walletId: null,
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).toBeNull()
  })

  it('stamps for a due-today bill (daysAhead = 0)', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: daysFromNow(0),
      reminderDaysAhead: 0,
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).not.toBeNull()
  })

  it('does not stamp for overdue bills (past due date)', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const expense = await createRecurring(user.id, wallet.id, {
      nextDueDate: daysFromNow(-2),
      reminderDaysAhead: 3,
    })

    await sendBillReminders()

    const updated = await testDb.recurringExpense.findUniqueOrThrow({ where: { id: expense.id } })
    expect(updated.reminderSentForDate).toBeNull()
  })
})
