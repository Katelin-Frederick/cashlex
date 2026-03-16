'use client'

import { useState } from 'react'
import { Download, Printer } from 'lucide-react'

import { SpendingDonut } from '~/app/dashboard/_components/spending-donut'
import { MonthlyBar } from '~/app/dashboard/_components/monthly-bar'
import { api } from '~/trpc/react'

// ── Preset helpers ────────────────────────────────────────────────────────────

type Preset = 'last_3_months' | 'last_6_months' | 'last_month' | 'last_year' | 'this_month' | 'this_year'

const PRESETS: { label: string; value: Preset }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
]

const getDateRange = (preset: Preset): { endDate: Date; startDate: Date } => {
  const now = new Date()
  switch (preset) {
    case 'this_month': {
      return {
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      }
    }
    case 'last_month': {
      return {
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      }
    }
    case 'last_3_months': {
      return {
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      }
    }
    case 'last_6_months': {
      return {
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        startDate: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      }
    }
    case 'this_year': {
      return {
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        startDate: new Date(now.getFullYear(), 0, 1),
      }
    }
    case 'last_year': {
      return {
        endDate: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
        startDate: new Date(now.getFullYear() - 1, 0, 1),
      }
    }
  }
}

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(n)

type ExportRow = {
  amount: number
  category: { name: string } | null
  date: Date
  description: string | null
  type: string
  wallet: { name: string }
}

const downloadCsv = (rows: ExportRow[], filename: string) => {
  const headers = ['Date', 'Type', 'Description', 'Category', 'Wallet', 'Amount']
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        new Date(r.date).toLocaleDateString('en-US'),
        r.type,
        `"${(r.description ?? '').replace(/"/g, '""')}"`,
        `"${(r.category?.name ?? '').replace(/"/g, '""')}"`,
        `"${r.wallet.name.replace(/"/g, '""')}"`,
        r.type === 'EXPENSE' ? -r.amount : r.amount,
      ].join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ReportsClient = () => {
  const [preset, setPreset] = useState<Preset>('this_month')
  const [exporting, setExporting] = useState(false)
  const { endDate, startDate } = getDateRange(preset)
  const input = { endDate, startDate }
  const utils = api.useUtils()

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const rows = await utils.report.exportData.fetch(input)
      const label = PRESETS.find((p) => p.value === preset)?.label ?? preset
      downloadCsv(rows, `cashlex-${label.toLowerCase().replace(/\s+/g, '-')}.csv`)
    } finally {
      setExporting(false)
    }
  }

  const { data: summary, isLoading: summaryLoading } = api.report.summary.useQuery(input)
  const { data: spending = [] } = api.report.spendingByCategory.useQuery(input)
  const { data: trend = [] } = api.report.monthlyTrend.useQuery(input)
  const { data: topExpenses = [] } = api.report.topExpenses.useQuery(input)
  const { data: budgets = [] } = api.report.budgetPerformance.useQuery(input)

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900'>Reports</h1>
          <p className='text-sm text-slate-500'>
            {formatDate(startDate)} – {formatDate(endDate)}
          </p>
        </div>

        <div className='flex flex-col gap-3'>
          {/* Preset selector */}
          <div className='flex flex-wrap gap-2 print:hidden'>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  preset === p.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <div className='flex gap-2 print:hidden'>
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className='flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-50'
            >
              <Download className='size-3.5' />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              onClick={() => window.print()}
              className='flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50'
            >
              <Printer className='size-3.5' />
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <SummaryCard
          label='Total Income'
          loading={summaryLoading}
          value={formatCurrency(summary?.totalIncome ?? 0)}
          valueClass='text-emerald-600'
        />
        <SummaryCard
          label='Total Expenses'
          loading={summaryLoading}
          value={formatCurrency(summary?.totalExpenses ?? 0)}
          valueClass='text-red-500'
        />
        <SummaryCard
          label='Net Savings'
          loading={summaryLoading}
          value={formatCurrency(summary?.net ?? 0)}
          valueClass={(summary?.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
        <SummaryCard
          label='Transactions'
          loading={summaryLoading}
          value={String(summary?.txCount ?? 0)}
          valueClass='text-slate-900'
        />
      </div>

      {/* Charts row */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-xl border bg-white p-5'>
          <h2 className='mb-4 text-sm font-semibold text-slate-700'>Spending by Category</h2>
          <div className='h-64'>
            <SpendingDonut items={spending} />
          </div>
        </div>

        <div className='rounded-xl border bg-white p-5'>
          <h2 className='mb-4 text-sm font-semibold text-slate-700'>Income vs Expenses</h2>
          <div className='h-64'>
            {trend.length > 0 ? (
              <MonthlyBar months={trend} />
            ) : (
              <div className='flex h-full items-center justify-center'>
                <p className='text-sm text-slate-400'>No data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Top expenses */}
        <div className='rounded-xl border bg-white p-5'>
          <h2 className='mb-4 text-sm font-semibold text-slate-700'>Top Expenses</h2>
          {topExpenses.length === 0 ? (
            <p className='py-6 text-center text-sm text-slate-400'>No expenses in this period</p>
          ) : (
            <ul className='divide-y divide-slate-100'>
              {topExpenses.map((tx) => (
                <li key={tx.id} className='flex items-center justify-between py-2.5'>
                  <div className='flex items-center gap-3'>
                    {tx.category ? (
                      <span
                        className='flex size-7 shrink-0 items-center justify-center rounded-full text-sm'
                        style={{ background: tx.category.color ?? '#e2e8f0' }}
                      >
                        {tx.category.icon ?? '💸'}
                      </span>
                    ) : (
                      <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm'>
                        💸
                      </span>
                    )}
                    <div>
                      <p className='text-sm font-medium text-slate-800'>
                        {tx.description ?? tx.category?.name ?? 'Expense'}
                      </p>
                      <p className='text-xs text-slate-400'>
                        {tx.wallet.name} · {new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className='text-sm font-semibold text-red-500'>
                    -{formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Budget performance */}
        <div className='rounded-xl border bg-white p-5'>
          <h2 className='mb-4 text-sm font-semibold text-slate-700'>Budget Performance</h2>
          {budgets.length === 0 ? (
            <p className='py-6 text-center text-sm text-slate-400'>No budgets overlap this period</p>
          ) : (
            <ul className='space-y-4'>
              {budgets.map((b) => {
                const pct = b.amount > 0 ? Math.min(100, (b.spent / b.amount) * 100) : 0
                const over = b.spent > b.amount
                return (
                  <li key={b.id}>
                    <div className='mb-1 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span
                          className='flex size-6 shrink-0 items-center justify-center rounded-full text-xs'
                          style={{ background: b.category.color ?? '#e2e8f0' }}
                        >
                          {b.category.icon ?? '📦'}
                        </span>
                        <span className='text-sm font-medium text-slate-800'>{b.name}</span>
                      </div>
                      <span className={`text-xs font-semibold ${over ? 'text-red-500' : 'text-slate-500'}`}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className='mt-0.5 text-right text-xs text-slate-400'>{pct.toFixed(0)}% used</p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

type SummaryCardProps = {
  label: string
  loading: boolean
  value: string
  valueClass: string
}

const SummaryCard = ({ label, loading, value, valueClass }: SummaryCardProps) => (
  <div className='rounded-xl border bg-white p-4'>
    <p className='text-xs text-slate-500'>{label}</p>
    {loading ? (
      <div className='mt-2 h-6 w-24 animate-pulse rounded bg-slate-100' />
    ) : (
      <p className={`mt-1 text-xl font-semibold ${valueClass}`}>{value}</p>
    )}
  </div>
)
