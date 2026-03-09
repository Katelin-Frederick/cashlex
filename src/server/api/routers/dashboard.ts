import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'

export const dashboardRouter = createTRPCRouter({
  // Summary stats: liquid balance, net worth, this month's income / expenses / net
  stats: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [wallets, income, expenses] = await Promise.all([
      ctx.db.wallet.findMany({ select: { balance: true, type: true, }, where: { userId, }, }),
      ctx.db.transaction.aggregate({
        _sum: { amount: true, },
        where: { date: { gte: monthStart, lte: monthEnd, }, type: 'INCOME', userId, },
      }),
      ctx.db.transaction.aggregate({
        _sum: { amount: true, },
        where: { date: { gte: monthStart, lte: monthEnd, }, type: 'EXPENSE', userId, },
      }),
    ])

    // Liquid: money you can actually spend today (excludes credit cards and investments)
    const liquidBalance = wallets
      .filter((w) => ['CHECKING', 'SAVINGS', 'CASH'].includes(w.type))
      .reduce((sum, w) => sum + w.balance, 0)

    // Net worth: all balances summed — CREDIT goes negative as you spend so it
    // naturally subtracts debt; INVESTMENT is included as an asset
    const netWorth = wallets.reduce((sum, w) => {
      const contribution = w.type === 'CREDIT' ? Math.min(0, w.balance) : w.balance
      return sum + contribution
    }, 0)

    const monthlyIncome = income._sum.amount ?? 0
    const monthlyExpenses = expenses._sum.amount ?? 0

    return {
      liquidBalance,
      monthlyExpenses,
      monthlyIncome,
      monthlyNet: monthlyIncome - monthlyExpenses,
      netWorth,
    }
  }),

  // Expense breakdown by category for this month — used by donut chart
  spendingByCategory: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const rows = await ctx.db.transaction.groupBy({
      _sum: { amount: true, },
      by: ['categoryId'],
      orderBy: { _sum: { amount: 'desc', }, },
      where: { categoryId: { not: null, }, date: { gte: monthStart, lte: monthEnd, }, type: 'EXPENSE', userId, },
    })

    if (rows.length === 0) return []

    const categoryIds = rows.map((r) => r.categoryId).filter(Boolean) as string[]
    const categories = await ctx.db.category.findMany({
      select: { color: true, id: true, name: true, },
      where: { id: { in: categoryIds, }, },
    })
    const catMap = new Map(categories.map((c) => [c.id, c]))

    return rows.map((r) => ({
      amount: r._sum.amount ?? 0,
      color: catMap.get(r.categoryId ?? '')?.color ?? '#94a3b8',
      name: catMap.get(r.categoryId ?? '')?.name ?? 'Uncategorized',
    }))
  }),

  // Last 6 months income vs expenses — used by bar chart
  monthlyTrend: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    const months = Array.from({ length: 6, }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit', }),
        start: d,
      }
    })

    const results = await Promise.all(
      months.map(async (m) => {
        const [inc, exp] = await Promise.all([
          ctx.db.transaction.aggregate({
            _sum: { amount: true, },
            where: { date: { gte: m.start, lte: m.end, }, type: 'INCOME', userId, },
          }),
          ctx.db.transaction.aggregate({
            _sum: { amount: true, },
            where: { date: { gte: m.start, lte: m.end, }, type: 'EXPENSE', userId, },
          }),
        ])
        return {
          expenses: exp._sum.amount ?? 0,
          income: inc._sum.amount ?? 0,
          label: m.label,
        }
      })
    )

    return results
  }),

  // 5 most recent transactions with wallet + category info
  recentTransactions: protectedProcedure.query(async ({ ctx, }) => {
    return ctx.db.transaction.findMany({
      include: {
        category: { select: { color: true, icon: true, name: true, }, },
        wallet: { select: { name: true, }, },
      },
      orderBy: { date: 'desc', },
      take: 5,
      where: { userId: ctx.session.user.id, },
    })
  }),

  // Active budgets (date range includes today) with spent
  activeBudgets: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    const budgets = await ctx.db.budget.findMany({
      include: { category: { select: { color: true, icon: true, name: true, }, }, },
      orderBy: { startDate: 'asc', },
      where: { endDate: { gte: now, }, startDate: { lte: now, }, userId, },
    })

    return Promise.all(
      budgets.map(async (budget) => {
        const result = await ctx.db.transaction.aggregate({
          _sum: { amount: true, },
          where: {
            categoryId: budget.categoryId,
            date: { gte: budget.startDate, lte: budget.endDate, },
            type: 'EXPENSE',
            userId,
          },
        })
        return { ...budget, spent: result._sum.amount ?? 0, }
      })
    )
  }),
})
