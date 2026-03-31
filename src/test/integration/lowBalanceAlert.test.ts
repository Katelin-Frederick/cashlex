// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/mailer', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }))
import { testDb } from '../db'
vi.mock('~/server/db', () => ({ db: testDb }))

import { checkLowBalance } from '~/server/lowBalanceAlert'
import { resetDb } from '../db'
import { createUser, createWallet } from '../helpers'

afterAll(async () => { await testDb.$disconnect() })
beforeEach(async () => {
  await resetDb()
  vi.clearAllMocks()
})

// ── Helpers ────────────────────────────────────────────────────────────

const enableAlert = (walletId: string, threshold = 100) =>
  testDb.wallet.update({
    data: { lowBalanceAlert: true, lowBalanceThreshold: threshold },
    where: { id: walletId },
  })

const stampSent = (walletId: string) =>
  testDb.wallet.update({
    data: { lowBalanceAlertSentAt: new Date() },
    where: { id: walletId },
  })

// ── Tests ──────────────────────────────────────────────────────────────

describe('checkLowBalance', () => {
  it('stamps lowBalanceAlertSentAt when balance drops below threshold', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 50 })
    await enableAlert(wallet.id, 100)

    await checkLowBalance(wallet.id, 50)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt).not.toBeNull()
  })

  it('does not stamp when balance is at or above threshold', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 200 })
    await enableAlert(wallet.id, 100)

    await checkLowBalance(wallet.id, 200)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt).toBeNull()
  })

  it('does not stamp when balance exactly equals threshold', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 100 })
    await enableAlert(wallet.id, 100)

    await checkLowBalance(wallet.id, 100)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt).toBeNull()
  })

  it('does not re-stamp when lowBalanceAlertSentAt is already set', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 30 })
    await enableAlert(wallet.id, 100)
    const sentAt = new Date(Date.now() - 60_000)
    await testDb.wallet.update({ data: { lowBalanceAlertSentAt: sentAt }, where: { id: wallet.id } })

    await checkLowBalance(wallet.id, 30)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt?.getTime()).toBe(sentAt.getTime())
  })

  it('clears lowBalanceAlertSentAt when balance recovers above threshold (re-arms)', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 500 })
    await enableAlert(wallet.id, 100)
    await stampSent(wallet.id)

    await checkLowBalance(wallet.id, 500)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt).toBeNull()
  })

  it('skips wallets with lowBalanceAlert: false', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 10 })
    // lowBalanceAlert stays false (default)

    await checkLowBalance(wallet.id, 10)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt).toBeNull()
  })

  it('skips CREDIT wallets even when lowBalanceAlert is true', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 10, type: 'CREDIT' })
    await enableAlert(wallet.id, 100)

    await checkLowBalance(wallet.id, 10)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    expect(updated.lowBalanceAlertSentAt).toBeNull()
  })

  it('does not clear stamp when balance is still below threshold', async () => {
    const user = await createUser()
    const wallet = await createWallet(user.id, { balance: 40 })
    await enableAlert(wallet.id, 100)
    const sentAt = new Date(Date.now() - 60_000)
    await testDb.wallet.update({ data: { lowBalanceAlertSentAt: sentAt }, where: { id: wallet.id } })

    await checkLowBalance(wallet.id, 40)

    const updated = await testDb.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
    // Still below threshold, stamp should remain unchanged
    expect(updated.lowBalanceAlertSentAt?.getTime()).toBe(sentAt.getTime())
  })
})
