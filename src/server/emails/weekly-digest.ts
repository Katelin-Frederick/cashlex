import { db, } from '~/server/db'

// ── Data fetching ──────────────────────────────────────────────────────

export type WeeklyDigestData = {
  budgets: { amount: number; name: string; spent: number }[]
  categories: { amount: number; color: string; name: string }[]
  totalExpenses: number
  totalIncome: number
  userEmail: string
  userName: string
  weekEnd: Date
  weekStart: Date
}

export const fetchWeeklyDigestData = async (userId: string): Promise<WeeklyDigestData | null> => {
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setHours(23, 59, 59, 999)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const user = await db.user.findUnique({
    select: { email: true, name: true, },
    where: { id: userId, },
  })
  if (!user?.email) return null

  const [incomeAgg, expenseAgg, categoryRows, budgets] = await Promise.all([
    db.transaction.aggregate({
      _sum: { amount: true, },
      where: { date: { gte: weekStart, lte: weekEnd, }, type: 'INCOME', userId, },
    }),
    db.transaction.aggregate({
      _sum: { amount: true, },
      where: { date: { gte: weekStart, lte: weekEnd, }, type: 'EXPENSE', userId, },
    }),
    db.transaction.groupBy({
      _sum: { amount: true, },
      by: ['categoryId'],
      orderBy: { _sum: { amount: 'desc', }, },
      where: {
        categoryId: { not: null, }, date: { gte: weekStart, lte: weekEnd, }, type: 'EXPENSE', userId,
      },
    }),
    db.budget.findMany({
      include: { category: { select: { color: true, }, }, },
      where: { endDate: { gte: now, }, startDate: { lte: now, }, userId, },
    })
  ])

  // Resolve category names
  const categoryIds = categoryRows.map((r) => r.categoryId).filter(Boolean) as string[]
  const cats = await db.category.findMany({
    select: { color: true, id: true, name: true, },
    where: { id: { in: categoryIds, }, },
  })
  const catMap = new Map(cats.map((c) => [c.id, c]))

  const categories = categoryRows.map((r) => ({
    amount: r._sum.amount ?? 0,
    color: catMap.get(r.categoryId ?? '')?.color ?? '#94a3b8',
    name: catMap.get(r.categoryId ?? '')?.name ?? 'Uncategorized',
  }))

  // Resolve budget spent amounts
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (b) => {
      const result = await db.transaction.aggregate({
        _sum: { amount: true, },
        where: {
          categoryId: b.categoryId,
          date: { gte: b.startDate, lte: b.endDate, },
          type: 'EXPENSE',
          userId,
        },
      })
      return { amount: b.amount, name: b.name, spent: result._sum.amount ?? 0, }
    })
  )

  return {
    budgets: budgetsWithSpent,
    categories,
    totalExpenses: expenseAgg._sum.amount ?? 0,
    totalIncome: incomeAgg._sum.amount ?? 0,
    userEmail: user.email,
    userName: user.name ?? user.email,
    weekEnd,
    weekStart,
  }
}

// ── Template ───────────────────────────────────────────────────────────

const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', })

const progressBar = (spent: number, amount: number) => {
  const pct = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
  const color = spent > amount ? '#ef4444' : '#10b981'
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
      <tr>
        <td style="background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden;">
          <div style="background:${color};width:${pct}%;height:6px;border-radius:4px;"></div>
        </td>
      </tr>
    </table>`
}

export const weeklyDigestHtml = (data: WeeklyDigestData) => {
  const net = data.totalIncome - data.totalExpenses
  const netColor = net >= 0 ? '#10b981' : '#ef4444'
  const netLabel = net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`

  const categoryRows = data.categories.length > 0
    ? data.categories.map((c) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #f1f5f9;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.color};margin-right:8px;vertical-align:middle;"></span>
            <span style="color:#334155;font-size:14px;">${c.name}</span>
          </td>
          <td align="right" style="padding:10px 0;border-top:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">$${c.amount.toFixed(2)}</td>
        </tr>`).join('')
    : '<tr><td colspan="2" style="padding:12px 0;color:#94a3b8;font-size:14px;">No expenses this week</td></tr>'

  const budgetRows = data.budgets.length > 0
    ? data.budgets.map((b) => {
      const isOver = b.spent > b.amount
      return `
        <tr>
          <td style="padding:12px 0;border-top:1px solid #f1f5f9;" colspan="2">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#334155;font-size:14px;">${b.name}</td>
                <td align="right" style="color:${isOver ? '#ef4444' : '#64748b'};font-size:13px;">
                  $${b.spent.toFixed(2)} / $${b.amount.toFixed(2)}
                </td>
              </tr>
            </table>
            ${progressBar(b.spent, b.amount)}
          </td>
        </tr>`
    }).join('')
    : '<tr><td colspan="2" style="padding:12px 0;color:#94a3b8;font-size:14px;">No active budgets</td></tr>'

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Cashlex</p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Weekly Spending Digest · ${fmtDate(data.weekStart)} – ${fmtDate(data.weekEnd)}</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0;color:#334155;font-size:15px;">Hi ${data.userName},</p>
            <p style="margin:8px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Here's a summary of your finances for the past 7 days.
            </p>
          </td>
        </tr>

        <!-- Summary cards -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="31%" style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;color:#16a34a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Income</p>
                  <p style="margin:6px 0 0;color:#15803d;font-size:20px;font-weight:700;">+$${data.totalIncome.toFixed(2)}</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;color:#dc2626;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Expenses</p>
                  <p style="margin:6px 0 0;color:#b91c1c;font-size:20px;font-weight:700;">-$${data.totalExpenses.toFixed(2)}</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;border:1px solid #e2e8f0;">
                  <p style="margin:0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Net</p>
                  <p style="margin:6px 0 0;color:${netColor};font-size:20px;font-weight:700;">${netLabel}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Spending by category -->
        <tr>
          <td style="padding:0 40px 28px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:15px;font-weight:600;">Spending by Category</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${categoryRows}
            </table>
          </td>
        </tr>

        <!-- Active budgets -->
        <tr>
          <td style="padding:24px 40px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:15px;font-weight:600;">Active Budgets</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${budgetRows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              You're receiving this weekly digest from Cashlex. It is sent every Sunday evening.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export const weeklyDigestSubject = (weekStart: Date, weekEnd: Date) => `Cashlex: Your weekly spending digest (${fmtDate(weekStart)} – ${fmtDate(weekEnd)})`
