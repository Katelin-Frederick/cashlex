// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { createCaller } from '~/server/api/root'
import { resetDb, testDb } from '../db'
import { createTestContext, createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(resetDb)

describe('wallet.list', () => {
  it('returns an empty array for a new user', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))
    const wallets = await caller.wallet.list()
    expect(wallets).toHaveLength(0)
  })

  it('returns only wallets belonging to the authenticated user', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })
    await createWallet(userA.id, { name: 'A Wallet' })
    await createWallet(userB.id, { name: 'B Wallet' })

    const caller = createCaller(createTestContext(userA.id))
    const wallets = await caller.wallet.list()
    expect(wallets).toHaveLength(1)
    expect(wallets[0]?.name).toBe('A Wallet')
  })
})

describe('wallet.create', () => {
  it('creates a wallet and returns it', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))

    const wallet = await caller.wallet.create({
      name: 'Chase Checking',
      type: 'CHECKING',
      balance: 2500,
      currency: 'USD',
    })

    expect(wallet.name).toBe('Chase Checking')
    expect(wallet.balance).toBe(2500)
    expect(wallet.currency).toBe('USD')
    expect(wallet.userId).toBe(user.id)
  })

  it('creates wallet with correct default type', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))
    const wallet = await caller.wallet.create({ name: 'Test', type: 'SAVINGS', balance: 0, currency: 'EUR' })
    expect(wallet.type).toBe('SAVINGS')
    expect(wallet.currency).toBe('EUR')
  })

  it('wallet appears in list after creation', async () => {
    const user = await createUser()
    const caller = createCaller(createTestContext(user.id))
    await caller.wallet.create({ name: 'New Wallet', type: 'CASH', balance: 100, currency: 'USD' })
    const wallets = await caller.wallet.list()
    expect(wallets).toHaveLength(1)
  })
})

describe('wallet.update', () => {
  it('updates wallet name and type', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { name: 'Old Name', type: 'CHECKING' })
    const caller = createCaller(createTestContext(user.id))

    const updated = await caller.wallet.update({
      id: wallet.id,
      name: 'New Name',
      type: 'SAVINGS',
      currency: 'USD',
    })

    expect(updated.name).toBe('New Name')
    expect(updated.type).toBe('SAVINGS')
  })

  it('throws NOT_FOUND when updating another user\'s wallet', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })
    const wallet = await createWallet(userA.id)

    const caller = createCaller(createTestContext(userB.id))
    await expect(
      caller.wallet.update({ id: wallet.id, name: 'Hacked', type: 'CHECKING', currency: 'USD' })
    ).rejects.toThrow()
  })
})

describe('wallet.delete', () => {
  it('deletes a wallet successfully', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id)
    const caller = createCaller(createTestContext(user.id))

    await caller.wallet.delete({ id: wallet.id })

    const wallets = await caller.wallet.list()
    expect(wallets).toHaveLength(0)
  })

  it('throws NOT_FOUND when deleting another user\'s wallet', async () => {
    const userA = await createUser({ email: 'a@example.com' })
    const userB = await createUser({ email: 'b@example.com' })
    const wallet = await createWallet(userA.id)

    const caller = createCaller(createTestContext(userB.id))
    await expect(caller.wallet.delete({ id: wallet.id })).rejects.toThrow()
  })
})
