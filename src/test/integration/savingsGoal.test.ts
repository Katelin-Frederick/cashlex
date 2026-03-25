// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { createCaller } from '~/server/api/root'
import { resetDb, testDb } from '../db'
import { createTestContext, createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(resetDb)

// ── list / listPaginated ──────────────────────────────────────────────────────

describe('savingsGoal.list', () => {
  it('returns an empty array for a new user', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))
    expect(await caller.savingsGoal.list()).toEqual([])
  })

  it('returns only goals belonging to the authenticated user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })

    await testDb.savingsGoal.create({
      data: { name: 'A Goal', targetAmount: 1000, userId: userA.id },
    })

    const caller = createCaller(createTestContext(userB.id))
    expect(await caller.savingsGoal.list()).toEqual([])
  })
})

// ── create ────────────────────────────────────────────────────────────────────

describe('savingsGoal.create', () => {
  it('creates a goal with required fields', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Emergency Fund', targetAmount: 5000 })

    expect(goal.name).toBe('Emergency Fund')
    expect(goal.targetAmount).toBe(5000)
    expect(goal.savedAmount).toBe(0)
    expect(goal.isCompleted).toBe(false)
  })

  it('creates a goal with optional fields', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({
      description: 'Trip to Japan',
      name: 'Vacation',
      targetAmount: 3000,
      targetDate: '2026-12-01',
    })

    expect(goal.description).toBe('Trip to Japan')
    expect(goal.targetDate).not.toBeNull()
  })
})

// ── update ────────────────────────────────────────────────────────────────────

describe('savingsGoal.update', () => {
  it('updates goal fields', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Old Name', targetAmount: 1000 })
    const updated = await caller.savingsGoal.update({ id: goal.id, name: 'New Name', targetAmount: 2000 })

    expect(updated.name).toBe('New Name')
    expect(updated.targetAmount).toBe(2000)
  })

  it('throws NOT_FOUND when goal belongs to another user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })

    const goal = await testDb.savingsGoal.create({
      data: { name: 'A Goal', targetAmount: 500, userId: userA.id },
    })

    const caller = createCaller(createTestContext(userB.id))
    await expect(
      caller.savingsGoal.update({ id: goal.id, name: 'Hacked', targetAmount: 1 })
    ).rejects.toThrow('Goal not found.')
  })
})

// ── addContribution ───────────────────────────────────────────────────────────

describe('savingsGoal.addContribution', () => {
  it('increases savedAmount and creates a wallet transaction', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 5000 })
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Car', targetAmount: 10000 })
    await caller.savingsGoal.addContribution({ amount: 500, id: goal.id, walletId: wallet.id })

    const updatedGoal = await testDb.savingsGoal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updatedGoal.savedAmount).toBeCloseTo(500)

    const tx = await testDb.transaction.findFirst({ where: { savingsGoalId: goal.id } })
    expect(tx).not.toBeNull()
    expect(tx!.amount).toBeCloseTo(500)
    expect(tx!.walletId).toBe(wallet.id)
    expect(tx!.type).toBe('INCOME')
  })

  it('updates wallet balance', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 1000 })
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Trip', targetAmount: 2000 })
    await caller.savingsGoal.addContribution({ amount: 300, id: goal.id, walletId: wallet.id })

    const updatedWallet = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updatedWallet.balance).toBeCloseTo(1300)
  })

  it('accumulates multiple contributions', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 10000 })
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'House', targetAmount: 50000 })
    await caller.savingsGoal.addContribution({ amount: 1000, id: goal.id, walletId: wallet.id })
    await caller.savingsGoal.addContribution({ amount: 2500, id: goal.id, walletId: wallet.id })

    const updatedGoal = await testDb.savingsGoal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updatedGoal.savedAmount).toBeCloseTo(3500)
  })

  it('marks goal as completed when savedAmount reaches targetAmount', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 5000 })
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Phone', targetAmount: 1000 })
    await caller.savingsGoal.addContribution({ amount: 1000, id: goal.id, walletId: wallet.id })

    const updatedGoal = await testDb.savingsGoal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updatedGoal.isCompleted).toBe(true)
  })

  it('marks goal as completed when savedAmount exceeds targetAmount', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 5000 })
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Laptop', targetAmount: 1000 })
    await caller.savingsGoal.addContribution({ amount: 1200, id: goal.id, walletId: wallet.id })

    const updatedGoal = await testDb.savingsGoal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updatedGoal.isCompleted).toBe(true)
  })

  it('throws NOT_FOUND when wallet belongs to another user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })
    const walletB = await createWallet(userB.id)
    const caller = createCaller(createTestContext(userA.id))

    const goal = await caller.savingsGoal.create({ name: 'Goal', targetAmount: 500 })
    await expect(
      caller.savingsGoal.addContribution({ amount: 100, id: goal.id, walletId: walletB.id })
    ).rejects.toThrow('Wallet not found.')
  })
})

// ── delete ────────────────────────────────────────────────────────────────────

describe('savingsGoal.delete', () => {
  it('deletes a goal', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const goal = await caller.savingsGoal.create({ name: 'Delete me', targetAmount: 100 })
    await caller.savingsGoal.delete({ id: goal.id })

    const found = await testDb.savingsGoal.findUnique({ where: { id: goal.id } })
    expect(found).toBeNull()
  })

  it('throws NOT_FOUND when goal belongs to another user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })

    const goal = await testDb.savingsGoal.create({
      data: { name: 'A Goal', targetAmount: 500, userId: userA.id },
    })

    const caller = createCaller(createTestContext(userB.id))
    await expect(caller.savingsGoal.delete({ id: goal.id })).rejects.toThrow('Goal not found.')
  })
})
