import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

const dateRangeInput = z.object({
  endDate: z.date(),
  startDate: z.date(),
})

export const reportRouter = createTRPCRouter({
  // Total income, expenses, net, and transaction count for the date range
  summary: protectedProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { endDate, startDate } = input
    const userId = ctx.session.user.id

    const [income, expenses, txCount] = await Promise.all([
      ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startDate, lte: endDate }, type: 'INCOME', userId },
      }),
      ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startDate, lte: endDate }, type: 'EXPENSE', userId },
      }),
      ctx.db.transaction.count({
        where: { date: { gte: startDate, lte: endDate }, userId },
      }),
    ])

    const totalIncome = income._sum.amount ?? 0
    const totalExpenses = expenses._sum.amount ?? 0

    return { net: totalIncome - totalExpenses, totalExpenses, totalIncome, txCount }
  }),

  // Expense breakdown by category for the date range
  spendingByCategory: protectedProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { endDate, startDate } = input
    const userId = ctx.session.user.id

    const rows = await ctx.db.transaction.groupBy({
      _sum: { amount: true },
      by: ['categoryId'],
      orderBy: { _sum: { amount: 'desc' } },
      where: { categoryId: { not: null }, date: { gte: startDate, lte: endDate }, type: 'EXPENSE', userId },
    })

    if (rows.length === 0) return []

    const categoryIds = rows.map((r) => r.categoryId).filter(Boolean) as string[]
    const categories = await ctx.db.category.findMany({
      select: { color: true, id: true, name: true },
      where: { id: { in: categoryIds } },
    })
    const catMap = new Map(categories.map((c) => [c.id, c]))

    return rows.map((r) => ({
      amount: r._sum.amount ?? 0,
      color: catMap.get(r.categoryId ?? '')?.color ?? '#94a3b8',
      name: catMap.get(r.categoryId ?? '')?.name ?? 'Uncategorized',
    }))
  }),

  // Month-by-month income vs expenses for the selected range
  monthlyTrend: protectedProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { endDate, startDate } = input
    const userId = ctx.session.user.id

    const months: { end: Date; label: string; start: Date }[] = []
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

    while (cursor <= endMonth) {
      months.push({
        end: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999),
        label: cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        start: new Date(cursor),
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    return Promise.all(
      months.map(async (m) => {
        const [inc, exp] = await Promise.all([
          ctx.db.transaction.aggregate({
            _sum: { amount: true },
            where: { date: { gte: m.start, lte: m.end }, type: 'INCOME', userId },
          }),
          ctx.db.transaction.aggregate({
            _sum: { amount: true },
            where: { date: { gte: m.start, lte: m.end }, type: 'EXPENSE', userId },
          }),
        ])
        return { expenses: exp._sum.amount ?? 0, income: inc._sum.amount ?? 0, label: m.label }
      })
    )
  }),

  // Top 10 largest expense transactions in the date range
  topExpenses: protectedProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { endDate, startDate } = input
    return ctx.db.transaction.findMany({
      include: {
        category: { select: { color: true, icon: true, name: true } },
        wallet: { select: { name: true } },
      },
      orderBy: { amount: 'desc' },
      take: 10,
      where: { date: { gte: startDate, lte: endDate }, type: 'EXPENSE', userId: ctx.session.user.id },
    })
  }),

  // All transactions in the date range — used for CSV export
  exportData: protectedProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { endDate, startDate } = input
    return ctx.db.transaction.findMany({
      include: {
        category: { select: { name: true } },
        wallet: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      where: { date: { gte: startDate, lte: endDate }, userId: ctx.session.user.id },
    })
  }),

  // Budgets that overlap the date range with spent amount
  budgetPerformance: protectedProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { endDate, startDate } = input
    const userId = ctx.session.user.id

    const budgets = await ctx.db.budget.findMany({
      include: { category: { select: { color: true, icon: true, name: true } } },
      orderBy: { startDate: 'asc' },
      where: { endDate: { gte: startDate }, startDate: { lte: endDate }, userId },
    })

    return Promise.all(
      budgets.map(async (budget) => {
        // Constrain spent query to the overlap of the budget period and the selected range
        const overlapStart = budget.startDate > startDate ? budget.startDate : startDate
        const overlapEnd = budget.endDate < endDate ? budget.endDate : endDate

        const result = await ctx.db.transaction.aggregate({
          _sum: { amount: true },
          where: { categoryId: budget.categoryId, date: { gte: overlapStart, lte: overlapEnd }, type: 'EXPENSE', userId },
        })

        return { ...budget, spent: result._sum.amount ?? 0 }
      })
    )
  }),
})
