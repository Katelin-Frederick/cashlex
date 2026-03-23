'use client'

import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'
import { api } from '~/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { DayOfWeekChart } from './day-of-week-chart'
import { SavingsRateChart } from './savings-rate-chart'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(n)

const pctColor = (change: number) =>
  change > 0 ? 'text-red-500' : change < 0 ? 'text-emerald-500' : 'text-muted-foreground'

const pctIcon = (change: number) =>
  change > 0
    ? <ArrowUp className='inline size-3' />
    : change < 0
      ? <ArrowDown className='inline size-3' />
      : <Minus className='inline size-3' />

export const InsightsClient = () => {
  const { data: velocity, isLoading: velocityLoading } = api.insight.spendingVelocity.useQuery()
  const { data: trends = [], isLoading: trendsLoading } = api.insight.categoryTrends.useQuery()
  const { data: dowPattern = [], isLoading: dowLoading } = api.insight.dayOfWeekPattern.useQuery()
  const { data: savingsMonths = [], isLoading: savingsLoading } = api.insight.savingsRate.useQuery()

  // Biggest mover: largest absolute change with meaningful spend
  const biggestMover = trends
    .filter((t) => t.currentAmount > 0 || t.lastAmount > 0)
    .reduce<typeof trends[0] | null>(
      (best, t) => (!best || Math.abs(t.change) > Math.abs(best.change) ? t : best),
      null
    )

  const currentSavings = savingsMonths.at(-1)

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Spending Insights</h1>
        <p className='text-sm text-muted-foreground'>Patterns and trends based on your transaction history</p>
      </div>

      {/* ── Row 1: Velocity + Avg Daily + Savings Rate ── */}
      <div className='grid gap-4 sm:grid-cols-3'>
        {/* Spending Velocity */}
        <Card>
          <CardHeader className='pb-1'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {velocityLoading ? (
              <div className='space-y-2'>
                <div className='h-7 w-28 animate-pulse rounded bg-muted' />
                <div className='h-4 w-36 animate-pulse rounded bg-muted' />
              </div>
            ) : (
              <>
                <p className='text-2xl font-bold'>{fmt(velocity?.currentSpend ?? 0)}</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {fmt(velocity?.lastMonthSameDaySpend ?? 0)} at same point last month
                </p>
                <div className='mt-2 text-xs'>
                  <span className='font-medium'>Projected: </span>
                  <span className={
                    (velocity?.projected ?? 0) > (velocity?.lastMonthTotal ?? 0)
                      ? 'text-red-500 font-semibold'
                      : 'text-emerald-500 font-semibold'
                  }>
                    {fmt(velocity?.projected ?? 0)}
                  </span>
                  <span className='text-muted-foreground'> vs {fmt(velocity?.lastMonthTotal ?? 0)} last month</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Daily Spend */}
        <Card>
          <CardHeader className='pb-1'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Avg Daily Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {velocityLoading ? (
              <div className='space-y-2'>
                <div className='h-7 w-24 animate-pulse rounded bg-muted' />
                <div className='h-4 w-32 animate-pulse rounded bg-muted' />
              </div>
            ) : (
              <>
                <p className='text-2xl font-bold'>{fmt(velocity?.avgDaily ?? 0)}</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {fmt(velocity?.lastAvgDaily ?? 0)} avg/day last month
                </p>
                {velocity && velocity.lastAvgDaily > 0 && (
                  <p className={`mt-2 text-xs font-medium ${pctColor(velocity.avgDaily - velocity.lastAvgDaily)}`}>
                    {pctIcon(velocity.avgDaily - velocity.lastAvgDaily)}
                    {' '}{Math.abs(((velocity.avgDaily - velocity.lastAvgDaily) / velocity.lastAvgDaily) * 100).toFixed(1)}%
                    {velocity.avgDaily > velocity.lastAvgDaily ? ' higher' : ' lower'} than last month
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card>
          <CardHeader className='pb-1'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {savingsLoading ? (
              <div className='space-y-2'>
                <div className='h-7 w-20 animate-pulse rounded bg-muted' />
                <div className='h-4 w-28 animate-pulse rounded bg-muted' />
              </div>
            ) : currentSavings?.rate !== null && currentSavings?.rate !== undefined ? (
              <>
                <p className={`text-2xl font-bold ${currentSavings.rate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {currentSavings.rate.toFixed(1)}%
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {fmt(currentSavings.income)} income · {fmt(currentSavings.expenses)} expenses
                </p>
                <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
                  {currentSavings.rate >= 20
                    ? <><TrendingUp className='size-3 text-emerald-500' /> Great savings pace</>
                    : currentSavings.rate >= 0
                      ? <><Minus className='size-3' /> Modest savings</>
                      : <><TrendingDown className='size-3 text-red-500' /> Spending exceeds income</>
                  }
                </div>
              </>
            ) : (
              <p className='text-sm text-muted-foreground'>No income recorded this month</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Category Trends + Biggest Mover ── */}
      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Category Trends table */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>Category Trends</CardTitle>
            <p className='text-xs text-muted-foreground'>This month vs last month</p>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='flex items-center gap-3'>
                    <div className='size-7 animate-pulse rounded-full bg-muted' />
                    <div className='h-4 flex-1 animate-pulse rounded bg-muted' />
                    <div className='h-4 w-16 animate-pulse rounded bg-muted' />
                  </div>
                ))}
              </div>
            ) : trends.length === 0 ? (
              <p className='py-6 text-center text-sm text-muted-foreground'>No expense data yet</p>
            ) : (
              <ul className='divide-y divide-border'>
                {trends.map((t) => (
                  <li key={t.name} className='flex items-center justify-between py-2.5'>
                    <div className='flex items-center gap-3'>
                      <span
                        className='flex size-7 shrink-0 items-center justify-center rounded-full text-sm'
                        style={{ background: t.color }}
                      >
                        {t.icon ?? '📦'}
                      </span>
                      <div>
                        <p className='text-sm font-medium'>{t.name}</p>
                        <p className='text-xs text-muted-foreground'>{fmt(t.lastAmount)} last month</p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold'>{fmt(t.currentAmount)}</p>
                      {t.lastAmount > 0 || t.currentAmount > 0 ? (
                        <p className={`text-xs font-medium ${pctColor(t.change)}`}>
                          {pctIcon(t.change)} {Math.abs(t.change)}%
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Biggest Mover */}
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>Biggest Mover</CardTitle>
            <p className='text-xs text-muted-foreground'>Largest category change this month</p>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className='space-y-3'>
                <div className='size-12 animate-pulse rounded-full bg-muted' />
                <div className='h-5 w-24 animate-pulse rounded bg-muted' />
                <div className='h-4 w-32 animate-pulse rounded bg-muted' />
              </div>
            ) : biggestMover ? (
              <div className='flex flex-col items-center gap-3 py-4 text-center'>
                <span
                  className='flex size-14 items-center justify-center rounded-full text-2xl'
                  style={{ background: biggestMover.color }}
                >
                  {biggestMover.icon ?? '📦'}
                </span>
                <div>
                  <p className='text-base font-semibold'>{biggestMover.name}</p>
                  <p className={`text-2xl font-bold ${pctColor(biggestMover.change)}`}>
                    {biggestMover.change > 0 ? '+' : ''}{biggestMover.change}%
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {fmt(biggestMover.lastAmount)} → {fmt(biggestMover.currentAmount)}
                  </p>
                </div>
              </div>
            ) : (
              <p className='py-6 text-center text-sm text-muted-foreground'>Not enough data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Day of Week + Savings Rate trend ── */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>Spending by Day of Week</CardTitle>
            <p className='text-xs text-muted-foreground'>Average transaction spend — last 90 days</p>
          </CardHeader>
          <CardContent>
            {dowLoading ? (
              <div className='h-48 animate-pulse rounded bg-muted' />
            ) : (
              <div className='h-48'>
                <DayOfWeekChart items={dowPattern} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>Savings Rate Trend</CardTitle>
            <p className='text-xs text-muted-foreground'>Last 6 months — green = saving, red = overspending</p>
          </CardHeader>
          <CardContent>
            {savingsLoading ? (
              <div className='h-48 animate-pulse rounded bg-muted' />
            ) : (
              <div className='h-48'>
                <SavingsRateChart months={savingsMonths} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
