// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { createCaller } from '~/server/api/root'
import { resetDb, testDb } from '../db'
import { createCategory, createTestContext, createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(resetDb)

describe('transaction.create', () => {
  it('creates a transaction and debits the wallet for EXPENSE', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 1000 })
    const caller = createCaller(createTestContext(user.id))

    await caller.transaction.create({
      amount: 50,
      type: 'EXPENSE',
      walletId: wallet.id,
      date: new Date().toISOString(),
    })

    const updatedWallet = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updatedWallet.balance).toBeCloseTo(950)
  })

  it('creates a transaction and credits the wallet for INCOME', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 500 })
    const caller = createCaller(createTestContext(user.id))

    await caller.transaction.create({
      amount: 200,
      type: 'INCOME',
      walletId: wallet.id,
      date: new Date().toISOString(),
    })

    const updatedWallet = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updatedWallet.balance).toBeCloseTo(700)
  })

  it('associates a category when provided', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const category = await createCategory(user.id, { name: 'Groceries', type: 'EXPENSE' })
    const caller = createCaller(createTestContext(user.id))

    const tx = await caller.transaction.create({
      amount: 75,
      type: 'EXPENSE',
      walletId: wallet.id,
      categoryId: category.id,
      date: new Date().toISOString(),
    })

    expect(tx.categoryId).toBe(category.id)
  })

  it('throws when wallet does not belong to the user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })
    const wallet = await createWallet(userA.id)

    const caller = createCaller(createTestContext(userB.id))
    await expect(
      caller.transaction.create({ amount: 50, type: 'EXPENSE', walletId: wallet.id, date: new Date().toISOString() })
    ).rejects.toThrow()
  })
})

describe('transaction.delete', () => {
  it('deletes a transaction and reverses the wallet balance', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 500 })
    const caller = createCaller(createTestContext(user.id))

    const tx = await caller.transaction.create({
      amount: 100,
      type: 'EXPENSE',
      walletId: wallet.id,
      date: new Date().toISOString(),
    })

    // Balance should now be 400
    const mid = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(mid.balance).toBeCloseTo(400)

    await caller.transaction.delete({ id: tx.id })

    // Balance should be restored to 500
    const final = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(final.balance).toBeCloseTo(500)
  })
})
