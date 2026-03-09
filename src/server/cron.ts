import cron from 'node-cron'

import { db, } from '~/server/db'

// ── Date advancement ───────────────────────────────────────────────────

type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

const advanceDate = (date: Date, frequency: Frequency): Date => {
  const next = new Date(date)
  switch (frequency) {
    case 'DAILY':     next.setDate(next.getDate() + 1);         break
    case 'WEEKLY':    next.setDate(next.getDate() + 7);         break
    case 'BIWEEKLY':  next.setDate(next.getDate() + 14);        break
    case 'MONTHLY':   next.setMonth(next.getMonth() + 1);       break
    case 'QUARTERLY': next.setMonth(next.getMonth() + 3);       break
    case 'YEARLY':    next.setFullYear(next.getFullYear() + 1); break
  }
  return next
}

// ── Process due recurring expenses ─────────────────────────────────────

const processDueExpenses = async () => {
  const now = new Date()

  const due = await db.recurringExpense.findMany({
    where: { isActive: true, nextDueDate: { lte: now, }, walletId: { not: null, }, },
  })

  if (due.length === 0) return

  console.log(`[cron] Processing ${due.length} due recurring expense(s)…`)

  for (const expense of due) {
    try {
      await db.$transaction(async (tx) => {
        // Create the transaction
        await tx.transaction.create({
          data: {
            amount: expense.amount,
            categoryId: expense.categoryId,
            date: expense.nextDueDate,
            description: expense.description ?? expense.name,
            type: 'EXPENSE',
            userId: expense.userId,
            walletId: expense.walletId!,
          },
        })

        // Debit the wallet
        await tx.wallet.update({
          data: { balance: { decrement: expense.amount, }, },
          where: { id: expense.walletId!, },
        })

        // Advance nextDueDate — keep advancing until it's in the future
        // so missed days don't trigger duplicate catch-up transactions
        let next = advanceDate(expense.nextDueDate, expense.frequency as Frequency)
        while (next <= now) {
          next = advanceDate(next, expense.frequency as Frequency)
        }

        await tx.recurringExpense.update({
          data: { nextDueDate: next, },
          where: { id: expense.id, },
        })
      })

      console.log(`[cron] Created transaction for "${expense.name}" ($${expense.amount})`)
    } catch (err) {
      console.error(`[cron] Failed to process "${expense.name}":`, err)
    }
  }
}

// ── Start ──────────────────────────────────────────────────────────────

export const startCron = () => {
  // Run at midnight every day
  cron.schedule('0 0 * * *', () => {
    processDueExpenses().catch((err) => console.error('[cron] Unexpected error:', err))
  })

  // Also process on startup to catch anything missed since last run
  processDueExpenses().catch((err) => console.error('[cron] Startup processing error:', err))

  console.log('[cron] Recurring expense scheduler started')
}
