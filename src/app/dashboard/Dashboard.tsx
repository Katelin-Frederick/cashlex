'use client'

import React, { useEffect, useState, } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'

import IncomeExpenseBarChart from '~/components/Charts/IncomeExpenseBarChart'
import { api, } from '~/trpc/react'

import ExpensesSummary from './_ExpensesSummary/ExpensesSummary'
import IncomeSummary from './_IncomeSummary/IncomeSummary'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  // Determine the current date
  const currentDate = new Date()

  // Set endDate to the last full month (current month - 1)
  const endDate = new Date(currentDate)
  endDate.setMonth(currentDate.getMonth())

  // Set startDate to five months ago from the current date
  const startDate = new Date(currentDate)
  startDate.setMonth(currentDate.getMonth() - 4)

  const formattedStartMonth = `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`
  const formattedEndMonth = `${endDate.getFullYear()}-${(endDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`

  const [startMonthState, setStartMonth] = useState<string>(formattedStartMonth)
  const [endMonthState, setEndMonth] = useState<string>(formattedEndMonth)

  const { data: transactionSummary, isLoading, error, } = api.transactions.getSummary.useQuery()
  const { data: monthlyBreakdown, isLoading: isLoadingBreakdown, error: breakdownError, }
    = api.transactions.getMonthlyBreakdown.useQuery({
      startDate: startMonthState,
      endDate: endMonthState,
    })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const totalBalance = transactionSummary ? transactionSummary.netTotal : 0
  const allIncome = transactionSummary ? transactionSummary.income : 0
  const allExpenses = transactionSummary ? transactionSummary.expense : 0

  // Handle start month selection
  const handleStartMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartMonth(e.target.value)
  }

  // Handle end month selection
  const handleEndMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndMonth(e.target.value)
  }

  if (isLoading || isLoadingBreakdown) {
    return <p>Loading...</p>
  }

  if (error || breakdownError) {
    return <p>Error loading data: {error?.message ?? breakdownError?.message}</p>
  }

  return (
    <div>
      {session ? (
        <div>
          <p>Welcome, {session.user?.name}!</p>

          <div>
            <p>All Income: ${allIncome}</p>
            <p>All Expenses: ${allExpenses}</p>
            <p>Total Balance: ${totalBalance}</p>
          </div>

          <ExpensesSummary />
          <IncomeSummary />

          {/* Month range picker form */}
          <form>
            <div>
              <label htmlFor='startMonth'>Select Start Month</label>
              <input
                type='month'
                id='startMonth'
                value={startMonthState}
                onChange={handleStartMonthChange}
              />
            </div>
            <div>
              <label htmlFor='endMonth'>Select End Month</label>
              <input
                type='month'
                id='endMonth'
                value={endMonthState}
                onChange={handleEndMonthChange}
              />
            </div>
          </form>

          {/* Render the chart with the selected month range */}
          {startMonthState && endMonthState && monthlyBreakdown && (
            <IncomeExpenseBarChart data={monthlyBreakdown} />
          )}
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
