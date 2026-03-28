import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { getExchangeRates, convertToBase, } from '~/server/exchangeRates'

export const dashboardRouter = createTRPCRouter({
  // Summary stats: liquid balance, net worth, this month's income / expenses / net
  // All monetary values converted to the user's baseCurrency via live exchange rates
  stats: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [user, wallets, monthlyTxs] = await Promise.all([
      ctx.db.user.findUniqueOrThrow({ select: { baseCurrency: true, }, where: { id: userId, }, }),
      ctx.db.wallet.findMany({ select: { balance: true, currency: true, type: true, }, where: { userId, }, }),
      ctx.db.transaction.findMany({
        select: { amount: true, type: true, wallet: { select: { currency: true, }, }, },
        where: { date: { gte: monthStart, lte: monthEnd, }, type: { in: ['INCOME', 'EXPENSE'], }, userId, },
      })
    ])

    const { baseCurrency, } = user
    const rates = await getExchangeRates(baseCurrency)

    const liquidBalance = wallets
      .filter((w) => ['CHECKING', 'SAVINGS', 'CASH'].includes(w.type))
      .reduce((sum, w) => sum + convertToBase(w.balance, w.currency, rates), 0)

    const netWorth = wallets.reduce((sum, w) => {
      const bal = w.type === 'CREDIT' ? Math.min(0, w.balance) : w.balance
      return sum + convertToBase(bal, w.currency, rates)
    }, 0)

    const monthlyIncome = monthlyTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + convertToBase(t.amount, t.wallet.currency, rates), 0)

    const monthlyExpenses = monthlyTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + convertToBase(t.amount, t.wallet.currency, rates), 0)

    return {
      baseCurrency,
      liquidBalance,
      monthlyExpenses,
      monthlyIncome,
      monthlyNet: monthlyIncome - monthlyExpenses,
      netWorth,
    }
  }),

  // Expense breakdown by category for this month — used by donut chart
  // Amounts converted to baseCurrency before grouping
  spendingByCategory: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [user, txs] = await Promise.all([
      ctx.db.user.findUniqueOrThrow({ select: { baseCurrency: true, }, where: { id: userId, }, }),
      ctx.db.transaction.findMany({
        select: {
          amount: true,
          categoryId: true,
          category: { select: { color: true, name: true, }, },
          wallet: { select: { currency: true, }, },
        },
        where: {
          categoryId: { not: null, }, date: { gte: monthStart, lte: monthEnd, }, type: 'EXPENSE', userId,
        },
      })
    ])

    if (txs.length === 0) return []

    const rates = await getExchangeRates(user.baseCurrency)

    const catMap = new Map<string, { amount: number; color: string; name: string }>()
    for (const tx of txs) {
      if (!tx.categoryId || !tx.category) continue
      const converted = convertToBase(tx.amount, tx.wallet.currency, rates)
      const existing = catMap.get(tx.categoryId)
      if (existing) {
        existing.amount += converted
      } else {
        catMap.set(tx.categoryId, {
          amount: converted,
          color: tx.category.color ?? '#94a3b8',
          name: tx.category.name,
        })
      }
    }

    return Array.from(catMap.values()).sort((a, b) => b.amount - a.amount)
  }),

  // Last 6 months income vs expenses — used by bar chart
  // Amounts converted to baseCurrency
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

    const rangeStart = months[0]!.start
    const rangeEnd = months[months.length - 1]!.end

    const [user, txs] = await Promise.all([
      ctx.db.user.findUniqueOrThrow({ select: { baseCurrency: true, }, where: { id: userId, }, }),
      ctx.db.transaction.findMany({
        select: {
          amount: true, date: true, type: true, wallet: { select: { currency: true, }, },
        },
        where: { date: { gte: rangeStart, lte: rangeEnd, }, type: { in: ['INCOME', 'EXPENSE'], }, userId, },
      })
    ])

    const rates = await getExchangeRates(user.baseCurrency)

    return months.map((m) => {
      const monthTxs = txs.filter((t) => t.date >= m.start && t.date <= m.end)
      const income = monthTxs
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + convertToBase(t.amount, t.wallet.currency, rates), 0)
      const expenses = monthTxs
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + convertToBase(t.amount, t.wallet.currency, rates), 0)
      return { expenses, income, label: m.label, }
    })
  }),

  // 5 most recent transactions with wallet + category info (original currencies preserved)
  recentTransactions: protectedProcedure.query(async ({ ctx, }) => ctx.db.transaction.findMany({
    include: {
      category: { select: { color: true, icon: true, name: true, }, },
      wallet: { select: { currency: true, name: true, }, },
    },
    orderBy: { date: 'desc', },
    take: 5,
    where: { userId: ctx.session.user.id, },
  })),

  // Net worth at end of each of the last 12 months — used by net worth history line chart
  netWorthHistory: protectedProcedure.query(async ({ ctx, }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    const months = Array.from({ length: 12, }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      return {
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit', }),
      }
    })

    const [user, wallets, txs] = await Promise.all([
      ctx.db.user.findUniqueOrThrow({ select: { baseCurrency: true, }, where: { id: userId, }, }),
      ctx.db.wallet.findMany({ select: { balance: true, currency: true, id: true, type: true, }, where: { userId, }, }),
      ctx.db.transaction.findMany({
        select: { amount: true, date: true, type: true, walletId: true, },
        where: { userId, },
      }),
    ])

    const rates = await getExchangeRates(user.baseCurrency)

    return months.map((m) => {
      const netWorth = wallets.reduce((sum, wallet) => {
        // Sum of balance deltas from transactions that occurred AFTER this month end
        const futureDelta = txs
          .filter((t) => t.walletId === wallet.id && t.date > m.end)
          .reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0)

        const historicalBalance = wallet.balance - futureDelta
        const contribution = wallet.type === 'CREDIT' ? Math.min(0, historicalBalance) : historicalBalance
        return sum + convertToBase(contribution, wallet.currency, rates)
      }, 0)

      return { label: m.label, netWorth, }
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
