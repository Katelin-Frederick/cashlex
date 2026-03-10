import cron from 'node-cron'

import { db, } from '~/server/db'
import { sendMail, } from '~/server/mailer'
import { recurringReceiptHtml, recurringReceiptSubject, } from '~/server/emails/recurring-receipt'
import { fetchWeeklyDigestData, weeklyDigestHtml, weeklyDigestSubject, } from '~/server/emails/weekly-digest'

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
    include: {
      user: { select: { email: true, name: true, }, },
      wallet: { select: { name: true, }, },
    },
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

        // Advance nextDueDate until it's in the future
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

      // Send receipt email if user has an email address
      if (expense.user.email) {
        const walletName = expense.wallet?.name ?? 'Unknown wallet'
        await sendMail({
          html: recurringReceiptHtml({
            amount: expense.amount,
            date: expense.nextDueDate,
            name: expense.name,
            walletName,
          }),
          subject: recurringReceiptSubject(expense.name, expense.amount),
          to: expense.user.email,
        })
        console.log(`[cron] Receipt email sent to ${expense.user.email}`)
      }
    } catch (err) {
      console.error(`[cron] Failed to process "${expense.name}":`, err)
    }
  }
}

// ── Weekly spending digest ─────────────────────────────────────────────

const sendWeeklyDigests = async () => {
  console.log('[cron] Sending weekly digest emails…')

  const users = await db.user.findMany({
    select: { email: true, id: true, },
    where: { email: { not: null, }, },
  })

  for (const user of users) {
    try {
      const data = await fetchWeeklyDigestData(user.id)
      if (!data) continue

      await sendMail({
        html: weeklyDigestHtml(data),
        subject: weeklyDigestSubject(data.weekStart, data.weekEnd),
        to: data.userEmail,
      })

      console.log(`[cron] Weekly digest sent to ${data.userEmail}`)
    } catch (err) {
      console.error(`[cron] Failed to send digest to ${user.email ?? 'unknown'}:`, err)
    }
  }
}

// ── Start ──────────────────────────────────────────────────────────────

export const startCron = () => {
  // Midnight daily — process recurring expenses
  cron.schedule('0 0 * * *', () => {
    processDueExpenses().catch((err) => console.error('[cron] Unexpected error:', err))
  })

  // 6pm every Sunday — send weekly digest
  cron.schedule('0 18 * * 0', () => {
    sendWeeklyDigests().catch((err) => console.error('[cron] Digest error:', err))
  })

  // Process on startup to catch anything missed since last run
  processDueExpenses().catch((err) => console.error('[cron] Startup processing error:', err))

  console.log('[cron] Recurring expense scheduler started')
}
