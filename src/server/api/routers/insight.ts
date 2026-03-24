import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const insightRouter = createTRPCRouter({
  // Current month spend vs last month at same point + end-of-month projection
  spendingVelocity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const daysElapsed = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const lastMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate()

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const lastMonthSameDay = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      Math.min(daysElapsed, lastMonthDays),
      23, 59, 59, 999,
    )

    const [currentResult, lastSameDayResult, lastMonthResult] = await Promise.all([
      ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { date: { gte: thisMonthStart, lte: now }, type: 'EXPENSE', userId },
      }),
      ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { date: { gte: lastMonthStart, lte: lastMonthSameDay }, type: 'EXPENSE', userId },
      }),
      ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, type: 'EXPENSE', userId },
      }),
    ])

    const currentSpend = currentResult._sum.amount ?? 0
    const lastMonthSameDaySpend = lastSameDayResult._sum.amount ?? 0
    const lastMonthTotal = lastMonthResult._sum.amount ?? 0
    const projected = daysElapsed > 0 ? (currentSpend / daysElapsed) * daysInMonth : 0
    const avgDaily = daysElapsed > 0 ? currentSpend / daysElapsed : 0
    const lastAvgDaily = lastMonthDays > 0 ? lastMonthTotal / lastMonthDays : 0

    return {
      avgDaily,
      currentSpend,
      daysElapsed,
      daysInMonth,
      lastAvgDaily,
      lastMonthSameDaySpend,
      lastMonthTotal,
      projected,
    }
  }),

  // Month-over-month % change per category (current month vs last month)
  categoryTrends: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const [thisTxs, lastTxs] = await Promise.all([
      ctx.db.transaction.findMany({
        include: { category: { select: { color: true, icon: true, name: true } } },
        where: { categoryId: { not: null }, date: { gte: thisMonthStart, lte: thisMonthEnd }, type: 'EXPENSE', userId },
      }),
      ctx.db.transaction.findMany({
        include: { category: { select: { color: true, icon: true, name: true } } },
        where: { categoryId: { not: null }, date: { gte: lastMonthStart, lte: lastMonthEnd }, type: 'EXPENSE', userId },
      }),
    ])

    type CatEntry = { amount: number; color: string | null; icon: string | null; name: string }
    const thisMap = new Map<string, CatEntry>()
    for (const tx of thisTxs) {
      if (!tx.categoryId || !tx.category) continue
      const existing = thisMap.get(tx.categoryId)
      if (existing) existing.amount += tx.amount
      else thisMap.set(tx.categoryId, { amount: tx.amount, color: tx.category.color, icon: tx.category.icon, name: tx.category.name })
    }

    const lastMap = new Map<string, number>()
    for (const tx of lastTxs) {
      if (!tx.categoryId) continue
      lastMap.set(tx.categoryId, (lastMap.get(tx.categoryId) ?? 0) + tx.amount)
    }

    const allIds = new Set([...thisMap.keys(), ...lastMap.keys()])
    const missingIds = [...allIds].filter((id) => !thisMap.has(id))

    const missingCats = missingIds.length > 0
      ? await ctx.db.category.findMany({
          select: { color: true, icon: true, id: true, name: true },
          where: { id: { in: missingIds } },
        })
      : []
    const missingCatMap = new Map(missingCats.map((c) => [c.id, c]))

    return [...allIds]
      .map((id) => {
        const current = thisMap.get(id)
        const lastAmount = lastMap.get(id) ?? 0
        const currentAmount = current?.amount ?? 0
        const cat = current ?? missingCatMap.get(id)
        const change = lastAmount === 0
          ? currentAmount > 0 ? 100 : 0
          : ((currentAmount - lastAmount) / lastAmount) * 100

        return {
          change: Math.round(change * 10) / 10,
          color: cat?.color ?? '#94a3b8',
          currentAmount,
          icon: cat?.icon ?? null,
          lastAmount,
          name: cat?.name ?? 'Unknown',
        }
      })
      .sort((a, b) => b.currentAmount - a.currentAmount)
  }),

  // Average spend per day-of-week over the last 90 days
  dayOfWeekPattern: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(now.getDate() - 90)

    const txs = await ctx.db.transaction.findMany({
      select: { amount: true, date: true },
      where: { date: { gte: ninetyDaysAgo, lte: now }, type: 'EXPENSE', userId },
    })

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const totals = new Array<number>(7).fill(0)
    const counts = new Array<number>(7).fill(0)

    for (const tx of txs) {
      const dow = new Date(tx.date).getDay()
      totals[dow]! += tx.amount
      counts[dow]!++
    }

    return days.map((day, i) => ({
      average: counts[i]! > 0 ? (totals[i]! / counts[i]!) : 0,
      count: counts[i]!,
      day,
      total: totals[i]!,
    }))
  }),

  // Income sources: breakdown by category and by wallet, this month vs last month
  incomeSources: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const [thisTxs, lastTxs] = await Promise.all([
      ctx.db.transaction.findMany({
        include: {
          category: { select: { color: true, icon: true, name: true } },
          wallet: { select: { name: true } },
        },
        where: { date: { gte: thisMonthStart, lte: thisMonthEnd }, type: 'INCOME', userId },
      }),
      ctx.db.transaction.findMany({
        include: { category: { select: { color: true, icon: true, name: true } } },
        where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, type: 'INCOME', userId },
      }),
    ])

    // ── By category ───────────────────────────────────────────────────────────
    type CatEntry = { amount: number; color: string | null; icon: string | null; name: string }
    const thisCatMap = new Map<string, CatEntry>()
    let uncategorizedThis = 0

    for (const tx of thisTxs) {
      if (!tx.categoryId || !tx.category) { uncategorizedThis += tx.amount; continue }
      const e = thisCatMap.get(tx.categoryId)
      if (e) e.amount += tx.amount
      else thisCatMap.set(tx.categoryId, { amount: tx.amount, color: tx.category.color, icon: tx.category.icon, name: tx.category.name })
    }

    const lastCatMap = new Map<string, number>()
    let uncategorizedLast = 0
    for (const tx of lastTxs) {
      if (!tx.categoryId) { uncategorizedLast += tx.amount; continue }
      lastCatMap.set(tx.categoryId, (lastCatMap.get(tx.categoryId) ?? 0) + tx.amount)
    }

    const allCatIds = new Set([...thisCatMap.keys(), ...lastCatMap.keys()])
    const missingIds = [...allCatIds].filter((id) => !thisCatMap.has(id))
    const missingCats = missingIds.length > 0
      ? await ctx.db.category.findMany({
          select: { color: true, icon: true, id: true, name: true },
          where: { id: { in: missingIds } },
        })
      : []
    const missingCatMap = new Map(missingCats.map((c) => [c.id, c]))

    const byCategory = [...allCatIds]
      .map((id) => {
        const curr = thisCatMap.get(id)
        const lastAmount = lastCatMap.get(id) ?? 0
        const thisAmount = curr?.amount ?? 0
        const cat = curr ?? missingCatMap.get(id)
        const change = lastAmount === 0
          ? thisAmount > 0 ? 100 : 0
          : Math.round(((thisAmount - lastAmount) / lastAmount) * 1000) / 10
        return { change, color: cat?.color ?? '#94a3b8', icon: cat?.icon ?? null, lastAmount, name: cat?.name ?? 'Unknown', thisAmount }
      })
      .sort((a, b) => b.thisAmount - a.thisAmount)

    if (uncategorizedThis > 0 || uncategorizedLast > 0) {
      const change = uncategorizedLast === 0
        ? uncategorizedThis > 0 ? 100 : 0
        : Math.round(((uncategorizedThis - uncategorizedLast) / uncategorizedLast) * 1000) / 10
      byCategory.push({ change, color: '#94a3b8', icon: '💰', lastAmount: uncategorizedLast, name: 'Uncategorized', thisAmount: uncategorizedThis })
    }

    // ── By wallet ─────────────────────────────────────────────────────────────
    const walletMap = new Map<string, { name: string; amount: number }>()
    for (const tx of thisTxs) {
      const e = walletMap.get(tx.walletId)
      if (e) e.amount += tx.amount
      else walletMap.set(tx.walletId, { amount: tx.amount, name: tx.wallet.name })
    }
    const byWallet = [...walletMap.values()].sort((a, b) => b.amount - a.amount)

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalThisMonth = thisTxs.reduce((s, t) => s + t.amount, 0)
    const totalLastMonth = lastTxs.reduce((s, t) => s + t.amount, 0)
    const totalChange = totalLastMonth === 0
      ? totalThisMonth > 0 ? 100 : 0
      : Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 1000) / 10

    return { byCategory, byWallet, totalChange, totalLastMonth, totalThisMonth }
  }),

  // Savings rate (income - expenses) / income % for each of the last 6 months
  savingsRate: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        start: d,
      }
    })

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
        const income = inc._sum.amount ?? 0
        const expenses = exp._sum.amount ?? 0
        const rate = income > 0 ? ((income - expenses) / income) * 100 : null
        return { expenses, income, label: m.label, rate: rate !== null ? Math.round(rate * 10) / 10 : null }
      })
    )
  }),
})
