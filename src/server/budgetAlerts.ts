import { db } from '~/server/db'
import { sendMail } from '~/server/mailer'
import { budgetAlertHtml, budgetAlertSubject } from '~/server/emails/budget-alert'

/**
 * Check active budgets for the given user + category.
 * Fires an alert email when spending crosses the alertThreshold, and re-arms
 * when spending drops back below it (e.g. after a transaction deletion).
 * Best-effort — errors are logged but never thrown.
 */
export const checkBudgetAlerts = async (userId: string, categoryId: string): Promise<void> => {
  const now = new Date()

  const budgets = await db.budget.findMany({
    include: {
      category: { select: { name: true } },
      user: { select: { email: true, emailNotificationsBudgetAlert: true, name: true } },
    },
    where: {
      alertEnabled: true,
      categoryId,
      endDate: { gte: now },
      startDate: { lte: now },
      userId,
    },
  })

  for (const budget of budgets) {
    const result = await db.transaction.aggregate({
      _sum: { amount: true },
      where: {
        categoryId,
        date: { gte: budget.startDate, lte: budget.endDate },
        type: 'EXPENSE',
        userId,
      },
    })
    const spent = result._sum.amount ?? 0
    const ratio = budget.amount > 0 ? spent / budget.amount : 0

    if (ratio >= budget.alertThreshold && !budget.alertSentAt) {
      // Threshold crossed for first time — stamp and email
      await db.budget.update({ data: { alertSentAt: now }, where: { id: budget.id } })

      if (budget.user.email && budget.user.emailNotificationsBudgetAlert) {
        sendMail({
          html: budgetAlertHtml({
            budgetName: budget.name,
            categoryName: budget.category.name,
            limit: budget.amount,
            spent,
            threshold: budget.alertThreshold,
            userName: budget.user.name ?? 'there',
          }),
          subject: budgetAlertSubject(budget.name, Math.round(ratio * 100)),
          to: budget.user.email,
        }).catch((err) => console.error(`[budget] Alert email failed for "${budget.name}":`, err))
      }
    } else if (ratio < budget.alertThreshold && budget.alertSentAt) {
      // Spending dropped back below threshold — re-arm so a future crossing fires again
      await db.budget.update({ data: { alertSentAt: null }, where: { id: budget.id } })
    }
  }
}
