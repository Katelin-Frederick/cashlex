import type { User, Wallet, Category } from '../../generated/prisma'
import { testDb } from './db'

// ── Context factory ───────────────────────────────────────────────────
// Builds the tRPC context shape expected by createCaller.

export const createTestContext = (userId: string) => ({
  db: testDb,
  session: {
    user: { id: userId, email: 'test@example.com', name: 'Test User' },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  },
  headers: new Headers(),
})

// ── Data factories ────────────────────────────────────────────────────

export const createUser = (overrides?: Partial<User>) =>
  testDb.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      baseCurrency: 'USD',
      ...overrides,
    },
  })

export const createWallet = (userId: string, overrides?: Partial<Wallet>) =>
  testDb.wallet.create({
    data: {
      name: 'Checking',
      type: 'CHECKING',
      balance: 1000,
      currency: 'USD',
      userId,
      ...overrides,
    },
  })

export const createCategory = (userId: string, overrides?: Partial<Category>) =>
  testDb.category.create({
    data: {
      name: 'Food',
      type: 'EXPENSE',
      userId,
      ...overrides,
    },
  })
