// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { createCaller } from '~/server/api/root'
import { resetDb, testDb } from '../db'
import { createTestContext, createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(resetDb)

const BASE_DEBT = {
  currentBalance: 8000,
  name: 'Car Loan',
  originalAmount: 10000,
  type: 'AUTO_LOAN' as const,
}

// Helper: create a CREDIT wallet (auto-creates linked debt) and return both
const createCreditWalletWithDebt = async (userId: string, balance = 4000, name = 'Visa') => {
  const caller = createCaller(createTestContext(userId))
  const wallet = await caller.wallet.create({ name, type: 'CREDIT', balance, currency: 'USD' })
  const debt = await testDb.debt.findFirstOrThrow({ where: { walletId: wallet.id } })
  return { debt, wallet }
}

// ── list / listPaginated ──────────────────────────────────────────────────────

describe('debt.list', () => {
  it('returns an empty array for a new user', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))
    expect(await caller.debt.list()).toEqual([])
  })

  it('returns only debts belonging to the authenticated user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })

    await testDb.debt.create({ data: { ...BASE_DEBT, userId: userA.id } })

    const caller = createCaller(createTestContext(userB.id))
    expect(await caller.debt.list()).toEqual([])
  })
})

// ── create ────────────────────────────────────────────────────────────────────

describe('debt.create', () => {
  it('creates a debt with required fields', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)

    expect(debt.name).toBe('Car Loan')
    expect(debt.originalAmount).toBe(10000)
    expect(debt.currentBalance).toBe(8000)
    expect(debt.isPaidOff).toBe(false)
    expect(debt.walletId).toBeNull()
  })

  it('creates a debt with all optional fields', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create({
      ...BASE_DEBT,
      creditor: 'Toyota Financial',
      dueDay: 15,
      interestRate: 4.5,
      minimumPayment: 250,
      notes: 'Refinanced in 2025',
    })

    expect(debt.creditor).toBe('Toyota Financial')
    expect(debt.interestRate).toBe(4.5)
    expect(debt.minimumPayment).toBe(250)
    expect(debt.dueDay).toBe(15)
  })

  it('does not set a wallet link (wallet links come from wallet creation)', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    expect(debt.walletId).toBeNull()
  })
})

// ── update ────────────────────────────────────────────────────────────────────

describe('debt.update', () => {
  it('updates debt fields on an unlinked debt', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    const updated = await caller.debt.update({ ...BASE_DEBT, id: debt.id, name: 'Updated Loan', currentBalance: 7000 })

    expect(updated.name).toBe('Updated Loan')
    expect(updated.currentBalance).toBe(7000)
  })

  it('ignores name/type/balance input for wallet-linked debts', async () => {
    const user = await createUser()
    const { debt } = await createCreditWalletWithDebt(user.id, 2200, 'My Visa')

    const caller = createCaller(createTestContext(user.id))
    const updated = await caller.debt.update({
      ...BASE_DEBT,
      id: debt.id,
      name: 'Attempted Override',
      currentBalance: 9999,
    })

    // Name and balance should not be overridden for linked debts
    expect(updated.name).toBe('My Visa')
    expect(updated.currentBalance).toBeCloseTo(2200)
  })

  it('throws NOT_FOUND when debt belongs to another user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })

    const debt = await testDb.debt.create({ data: { ...BASE_DEBT, userId: userA.id } })

    const caller = createCaller(createTestContext(userB.id))
    await expect(
      caller.debt.update({ ...BASE_DEBT, id: debt.id })
    ).rejects.toThrow('Debt not found.')
  })
})

// ── makePayment ───────────────────────────────────────────────────────────────

describe('debt.makePayment (unlinked)', () => {
  it('reduces currentBalance and creates a wallet transaction', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 5000 })
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    await caller.debt.makePayment({ amount: 500, debtId: debt.id, walletId: wallet.id })

    const updatedDebt = await testDb.debt.findUniqueOrThrow({ where: { id: debt.id } })
    expect(updatedDebt.currentBalance).toBeCloseTo(7500)

    const tx = await testDb.transaction.findFirst({ where: { debtId: debt.id } })
    expect(tx).not.toBeNull()
    expect(tx!.amount).toBeCloseTo(500)
    expect(tx!.type).toBe('EXPENSE')
    expect(tx!.walletId).toBe(wallet.id)
  })

  it('decrements wallet balance', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 3000 })
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    await caller.debt.makePayment({ amount: 300, debtId: debt.id, walletId: wallet.id })

    const updatedWallet = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updatedWallet.balance).toBeCloseTo(2700)
  })

  it('marks debt as paid off when balance reaches zero', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 10000 })
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    await caller.debt.makePayment({ amount: 8000, debtId: debt.id, walletId: wallet.id })

    const updatedDebt = await testDb.debt.findUniqueOrThrow({ where: { id: debt.id } })
    expect(updatedDebt.currentBalance).toBe(0)
    expect(updatedDebt.isPaidOff).toBe(true)
  })

  it('clamps balance to zero when payment exceeds balance', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 10000 })
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    await caller.debt.makePayment({ amount: 9999, debtId: debt.id, walletId: wallet.id })

    const updatedDebt = await testDb.debt.findUniqueOrThrow({ where: { id: debt.id } })
    expect(updatedDebt.currentBalance).toBe(0)
    expect(updatedDebt.isPaidOff).toBe(true)
  })

  it('throws NOT_FOUND when wallet belongs to another user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })
    const walletB = await createWallet(userB.id)
    const caller = createCaller(createTestContext(userA.id))

    const debt = await caller.debt.create(BASE_DEBT)
    await expect(
      caller.debt.makePayment({ amount: 100, debtId: debt.id, walletId: walletB.id })
    ).rejects.toThrow('Wallet not found.')
  })
})

describe('debt.makePayment (linked to CREDIT wallet)', () => {
  it('decrements both source wallet and linked credit wallet', async () => {
    const user = await createUser()
    const checking = await createWallet(user.id, { balance: 5000, name: 'Checking' })
    const { debt, wallet: credit } = await createCreditWalletWithDebt(user.id, 4000, 'Visa')
    const caller = createCaller(createTestContext(user.id))

    await caller.debt.makePayment({ amount: 500, debtId: debt.id, walletId: checking.id })

    const updatedChecking = await testDb.wallet.findUniqueOrThrow({ where: { id: checking.id } })
    const updatedCredit = await testDb.wallet.findUniqueOrThrow({ where: { id: credit.id } })
    const updatedDebt = await testDb.debt.findUniqueOrThrow({ where: { id: debt.id } })

    expect(updatedChecking.balance).toBeCloseTo(4500)
    expect(updatedCredit.balance).toBeCloseTo(3500)
    expect(updatedDebt.currentBalance).toBeCloseTo(3500)
  })

  it('marks paid off when credit wallet balance reaches zero', async () => {
    const user = await createUser()
    const checking = await createWallet(user.id, { balance: 10000 })
    const { debt } = await createCreditWalletWithDebt(user.id, 1000, 'Visa')
    const caller = createCaller(createTestContext(user.id))

    await caller.debt.makePayment({ amount: 1000, debtId: debt.id, walletId: checking.id })

    const updatedDebt = await testDb.debt.findUniqueOrThrow({ where: { id: debt.id } })
    expect(updatedDebt.currentBalance).toBe(0)
    expect(updatedDebt.isPaidOff).toBe(true)
  })

  it('rejects using the linked credit wallet as the payment source', async () => {
    const user = await createUser()
    const { debt, wallet: credit } = await createCreditWalletWithDebt(user.id, 4000, 'Visa')
    const caller = createCaller(createTestContext(user.id))

    await expect(
      caller.debt.makePayment({ amount: 100, debtId: debt.id, walletId: credit.id })
    ).rejects.toThrow('Cannot pay a debt using its linked credit card wallet.')
  })
})

// ── transaction sync ──────────────────────────────────────────────────────────

describe('debt balance syncs with linked wallet transactions', () => {
  it('updates debt balance when a transaction is created on the linked wallet', async () => {
    const user = await createUser()
    const { debt, wallet: credit } = await createCreditWalletWithDebt(user.id, 2000)
    const caller = createCaller(createTestContext(user.id))

    expect(debt.currentBalance).toBeCloseTo(2000)

    await caller.transaction.create({
      amount: 300,
      date: new Date().toISOString(),
      type: 'EXPENSE',
      walletId: credit.id,
    })

    const updatedDebt = await testDb.debt.findUniqueOrThrow({ where: { id: debt.id } })
    expect(updatedDebt.currentBalance).toBeCloseTo(1700)
  })

  it('updates debt balance when a transaction on the linked wallet is deleted', async () => {
    const user = await createUser()
    const { wallet: credit } = await createCreditWalletWithDebt(user.id, 2000)
    const caller = createCaller(createTestContext(user.id))

    const tx = await caller.transaction.create({
      amount: 400,
      date: new Date().toISOString(),
      type: 'EXPENSE',
      walletId: credit.id,
    })

    let updatedDebt = await testDb.debt.findFirst({ where: { walletId: credit.id } })
    expect(updatedDebt!.currentBalance).toBeCloseTo(1600)

    await caller.transaction.delete({ id: tx.id })

    updatedDebt = await testDb.debt.findFirst({ where: { walletId: credit.id } })
    expect(updatedDebt!.currentBalance).toBeCloseTo(2000)
  })
})

// ── delete ────────────────────────────────────────────────────────────────────

describe('debt.delete', () => {
  it('deletes a debt', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const debt = await caller.debt.create(BASE_DEBT)
    await caller.debt.delete({ id: debt.id })

    const found = await testDb.debt.findUnique({ where: { id: debt.id } })
    expect(found).toBeNull()
  })

  it('throws NOT_FOUND when debt belongs to another user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })

    const debt = await testDb.debt.create({ data: { ...BASE_DEBT, userId: userA.id } })

    const caller = createCaller(createTestContext(userB.id))
    await expect(caller.debt.delete({ id: debt.id })).rejects.toThrow('Debt not found.')
  })
})
