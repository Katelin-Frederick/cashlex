import cron from 'node-cron'

import { db, } from '~/server/db'
import { sendMail, } from '~/server/mailer'
import { recurringReceiptHtml, recurringReceiptSubject, } from '~/server/emails/recurring-receipt'
import { fetchWeeklyDigestData, weeklyDigestHtml, weeklyDigestSubject, } from '~/server/emails/weekly-digest'
import { checkBudgetAlerts, } from '~/server/budgetAlerts'
import { checkLowBalance, } from '~/server/lowBalanceAlert'
import { billReminderHtml, billReminderSubject, } from '~/server/emails/bill-reminder'

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
      user: { select: { email: true, emailNotificationsReceipt: true, name: true, }, },
      wallet: { select: { name: true, }, },
    },
    where: { isActive: true, nextDueDate: { lte: now, }, walletId: { not: null, }, },
  })

  if (due.length === 0) return

  console.log(`[cron] Processing ${due.length} due recurring expense(s)…`)

  for (const expense of due) {
    // Collect every missed occurrence in order
    const dueDates: Date[] = []
    let next = new Date(expense.nextDueDate)
    while (next <= now) {
      dueDates.push(new Date(next))
      next = advanceDate(next, expense.frequency as Frequency)
    }
    // `next` is now the first future due date

    // ── Financial processing (must succeed) ──────────────────────────
    try {
      await db.$transaction(async (tx) => {
        for (const dueDate of dueDates) {
          await tx.transaction.create({
            data: {
              amount: expense.amount,
              categoryId: expense.categoryId,
              date: dueDate,
              description: expense.description ?? expense.name,
              type: 'EXPENSE',
              userId: expense.userId,
              walletId: expense.walletId!,
            },
          })
        }

        await tx.wallet.update({
          data: { balance: { decrement: expense.amount * dueDates.length, }, },
          where: { id: expense.walletId!, },
        })

        await tx.recurringExpense.update({
          data: { nextDueDate: next, },
          where: { id: expense.id, },
        })
      })

      console.log(`[cron] Created ${dueDates.length} transaction(s) for "${expense.name}" ($${(expense.amount * dueDates.length).toFixed(2)} total)`)

      // Best-effort low balance check after wallet was decremented
      const wallet = await db.wallet.findUnique({ select: { balance: true }, where: { id: expense.walletId!, }, })
      if (wallet) {
        checkLowBalance(expense.walletId!, wallet.balance)
          .catch((err) => console.error(`[lowBalance] Cron check failed for "${expense.name}":`, err))
      }
    } catch (err) {
      console.error(`[cron] Failed to process "${expense.name}":`, err)
      continue
    }

    // ── Receipt email (best-effort, does not affect processing) ──────
    if (expense.user.email && expense.user.emailNotificationsReceipt) {
      try {
        const walletName = expense.wallet?.name ?? 'Unknown wallet'
        const totalAmount = expense.amount * dueDates.length
        await sendMail({
          html: recurringReceiptHtml({
            amount: totalAmount,
            date: dueDates[0]!,
            name: dueDates.length > 1
              ? `${expense.name} (${dueDates.length} occurrences caught up)`
              : expense.name,
            walletName,
          }),
          subject: recurringReceiptSubject(expense.name, totalAmount),
          to: expense.user.email,
        })
        console.log(`[cron] Receipt email sent to ${expense.user.email}`)
      } catch (err) {
        console.error(`[cron] Receipt email failed for "${expense.name}" (transactions still processed):`, err)
      }
    }
  }
}

// ── Weekly spending digest ─────────────────────────────────────────────

const sendWeeklyDigests = async () => {
  console.log('[cron] Sending weekly digest emails…')

  const users = await db.user.findMany({
    select: { email: true, id: true, },
    where: { email: { not: null, }, emailNotificationsDigest: true, },
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

// ── Daily budget alert scan ─────────────────────────────────────────────

const checkAllBudgetAlerts = async () => {
  const now = new Date()

  const budgets = await db.budget.findMany({
    select: { categoryId: true, userId: true, },
    where: { alertEnabled: true, alertSentAt: null, endDate: { gte: now, }, startDate: { lte: now, }, },
  })

  if (budgets.length === 0) return

  console.log(`[cron] Checking budget alerts for ${budgets.length} active budget(s)…`)

  const checked = new Set<string>()
  for (const b of budgets) {
    const key = `${b.userId}:${b.categoryId}`
    if (!checked.has(key)) {
      checked.add(key)
      await checkBudgetAlerts(b.userId, b.categoryId)
        .catch((err) => console.error('[cron] Budget alert check failed:', err))
    }
  }
}

// ── Bill due reminders ─────────────────────────────────────────────────

export const sendBillReminders = async () => {
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const expenses = await db.recurringExpense.findMany({
    include: {
      user: { select: { email: true, emailNotificationsBillReminder: true, name: true, }, },
      wallet: { select: { name: true, }, },
    },
    where: { isActive: true, reminderEnabled: true, walletId: { not: null, }, },
  })

  if (expenses.length === 0) return

  console.log(`[cron] Checking bill reminders for ${expenses.length} recurring expense(s)…`)

  for (const expense of expenses) {
    const dueMidnight = new Date(
      expense.nextDueDate.getFullYear(),
      expense.nextDueDate.getMonth(),
      expense.nextDueDate.getDate(),
    )
    const daysUntilDue = Math.floor(
      (dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDue > expense.reminderDaysAhead || daysUntilDue < 0) continue

    // Skip if already sent for this occurrence
    if (
      expense.reminderSentForDate &&
      expense.reminderSentForDate.getTime() === expense.nextDueDate.getTime()
    ) continue

    // Stamp first, then send (best-effort)
    try {
      await db.recurringExpense.update({
        data: { reminderSentForDate: expense.nextDueDate, },
        where: { id: expense.id, },
      })
    } catch (err) {
      console.error(`[cron] Failed to stamp reminder for "${expense.name}":`, err)
      continue
    }

    if (expense.user.email && expense.user.emailNotificationsBillReminder) {
      try {
        await sendMail({
          html: billReminderHtml({
            amount: expense.amount,
            daysAhead: daysUntilDue,
            dueDate: expense.nextDueDate,
            name: expense.name,
            userName: expense.user.name ?? expense.user.email,
            walletName: expense.wallet?.name ?? 'Unknown wallet',
          }),
          subject: billReminderSubject(expense.name, daysUntilDue),
          to: expense.user.email,
        })
        console.log(`[cron] Bill reminder sent to ${expense.user.email} for "${expense.name}" (due in ${daysUntilDue} day(s))`)
      } catch (err) {
        console.error(`[cron] Bill reminder email failed for "${expense.name}":`, err)
      }
    }
  }
}

// ── Start ──────────────────────────────────────────────────────────────

export const startCron = () => {
  // Midnight daily — process recurring expenses + check budget alerts
  cron.schedule('0 0 * * *', () => {
    processDueExpenses().catch((err) => console.error('[cron] Unexpected error:', err))
    checkAllBudgetAlerts().catch((err) => console.error('[cron] Budget alert scan error:', err))
  })

  // 6pm every Sunday — send weekly digest
  cron.schedule('0 18 * * 0', () => {
    sendWeeklyDigests().catch((err) => console.error('[cron] Digest error:', err))
  })

  // 8am daily — send bill due reminders
  cron.schedule('0 8 * * *', () => {
    sendBillReminders().catch((err) => console.error('[cron] Bill reminder error:', err))
  })

  // Process on startup to catch anything missed since last run
  processDueExpenses().catch((err) => console.error('[cron] Startup processing error:', err))
  sendBillReminders().catch((err) => console.error('[cron] Startup bill reminder error:', err))

  console.log('[cron] Recurring expense scheduler started')
}
