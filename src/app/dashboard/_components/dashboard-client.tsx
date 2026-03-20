'use client'

import { CardContent, CardHeader, CardTitle, Card, } from '~/components/ui/card'
import { formatCurrency, CURRENCIES, } from '~/lib/currencies'
import { api, } from '~/trpc/react'

import { SpendingDonut, } from './spending-donut'
import { MonthlyBar, } from './monthly-bar'

// ── Helpers ────────────────────────────────────────────────────────────

const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', })

// ── Stat card ──────────────────────────────────────────────────────────

type StatCardProps = { label: string; value: string; valueClass?: string }

const StatCard = ({ label, value, valueClass = '', }: StatCardProps) => (
  <Card>
    <CardHeader className='pb-1'>
      <CardTitle className='text-muted-foreground text-sm font-medium'>{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </CardContent>
  </Card>
)

// ── Main component ─────────────────────────────────────────────────────

type Props = { userName: string }

export const DashboardClient = ({ userName, }: Props) => {
  const utils = api.useUtils()

  const { data: stats, isLoading: statsLoading, } = api.dashboard.stats.useQuery()
  const { data: spending = [], } = api.dashboard.spendingByCategory.useQuery()
  const { data: trend = [], } = api.dashboard.monthlyTrend.useQuery()
  const { data: recent = [], } = api.dashboard.recentTransactions.useQuery()
  const { data: budgets = [], } = api.dashboard.activeBudgets.useQuery()

  const updateBaseCurrency = api.user.updateBaseCurrency.useMutation({
    onSuccess: () => {
      void utils.dashboard.stats.invalidate()
      void utils.dashboard.spendingByCategory.invalidate()
      void utils.dashboard.monthlyTrend.invalidate()
    },
  })

  const baseCurrency = stats?.baseCurrency ?? 'USD'
  const fmt = (n: number, opts?: { sign?: boolean }) => {
    const abs = formatCurrency(Math.abs(n), baseCurrency)
    return opts?.sign && n > 0 ? `+${abs}` : abs
  }

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric', })

  return (
    <div className='mx-auto max-w-6xl px-6 py-10 space-y-8'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Welcome back, {userName}</h1>
          <p className='text-muted-foreground mt-1 text-sm'>{currentMonth} overview</p>
        </div>

        {/* Base currency selector */}
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>Base currency:</span>
          <select
            value={baseCurrency}
            disabled={updateBaseCurrency.isPending}
            onChange={(e) => updateBaseCurrency.mutate({ currency: e.target.value, })}
            className='rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50'
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row */}
      {statsLoading ? (
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
          {Array.from({ length: 5, }).map((_, i) => (
            <Card key={i}>
              <CardHeader className='pb-1'>
                <div className='h-4 w-24 animate-pulse rounded bg-slate-200' />
              </CardHeader>
              <CardContent>
                <div className='h-8 w-32 animate-pulse rounded bg-slate-200' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
          <StatCard label='Liquid Balance' value={fmt(stats?.liquidBalance ?? 0)} />
          <StatCard label='Net Worth' value={fmt(stats?.netWorth ?? 0)} />
          <StatCard
            label='Monthly Income'
            value={fmt(stats?.monthlyIncome ?? 0)}
            valueClass='text-emerald-600'
          />
          <StatCard
            label='Monthly Expenses'
            value={fmt(stats?.monthlyExpenses ?? 0)}
            valueClass='text-red-500'
          />
          <StatCard
            label='Net This Month'
            value={fmt(stats?.monthlyNet ?? 0, { sign: true, })}
            valueClass={(stats?.monthlyNet ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}
          />
        </div>
      )}

      {/* Charts row */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Spending by Category</CardTitle>
            <p className='text-muted-foreground text-xs'>This month · {baseCurrency}</p>
          </CardHeader>
          <CardContent className='flex items-center justify-center' style={{ minHeight: 280, }}>
            <div className='w-full max-w-xs'>
              <SpendingDonut items={spending} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Income vs Expenses</CardTitle>
            <p className='text-muted-foreground text-xs'>Last 6 months · {baseCurrency}</p>
          </CardHeader>
          <CardContent style={{ minHeight: 280, }}>
            <MonthlyBar months={trend} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {recent.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No transactions yet</p>
            ) : (
              recent.map((tx) => (
                <div key={tx.id} className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2 overflow-hidden'>
                    <div
                      className='flex size-8 shrink-0 items-center justify-center rounded-full text-xs'
                      style={{ backgroundColor: tx.category?.color ?? '#e2e8f0', }}
                    >
                      {tx.category?.icon ?? (tx.description?.charAt(0).toUpperCase() ?? '?')}
                    </div>
                    <div className='overflow-hidden'>
                      <p className='truncate text-sm font-medium'>
                        {tx.description ?? tx.category?.name ?? '—'}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {tx.wallet.name} · {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '−'}{formatCurrency(tx.amount, tx.wallet.currency)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active budgets */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Active Budgets</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {budgets.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No active budgets</p>
            ) : (
              budgets.map((budget) => {
                const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
                const isOver = budget.spent > budget.amount
                return (
                  <div key={budget.id} className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex items-center gap-1.5'>
                        <span
                          className='inline-flex size-5 items-center justify-center rounded-full text-xs'
                          style={{ backgroundColor: budget.category.color ?? '#e2e8f0', }}
                        >
                          {budget.category.icon ?? budget.category.name.charAt(0).toUpperCase()}
                        </span>
                        <span className='font-medium'>{budget.name}</span>
                      </div>
                      <span className={`text-xs ${isOver ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {formatCurrency(budget.spent, baseCurrency)} / {formatCurrency(budget.amount, baseCurrency)}
                      </span>
                    </div>
                    <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-200'>
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(percent, 100)}%`, }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
