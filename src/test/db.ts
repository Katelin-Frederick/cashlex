// @vitest-environment node
import { PrismaClient } from '../../generated/prisma'

// Dedicated Prisma client for the test database.
// Uses DATABASE_TEST_URL (overridden in vitest.config.ts via the DATABASE_URL env slot).
export const testDb = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: [],
})

/**
 * Wipes all user data between tests.
 * Cascades automatically to wallets, transactions, categories, budgets,
 * recurring expenses, notifications, accounts, and sessions.
 */
export const resetDb = async () => {
  await testDb.user.deleteMany()
}
