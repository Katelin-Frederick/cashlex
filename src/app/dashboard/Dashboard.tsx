'use client'

import React, { useEffect, useState, } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'

import ExpensesRingChart from '~/components/Charts/ExpensesPieChart'
import { api, } from '~/trpc/react'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  // State to manage selected month and year
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  // Query for transaction summary
  const { data: transactionSummary, isLoading, error, } = api.transactions.getSummary.useQuery()

  // Query for expense data breakdown based on selected month and year
  const { data: expenseData, isLoading: isExpenseLoading, } = api.transactions.getExpenseBreakdown.useQuery(
    { month: selectedMonth, year: selectedYear, }
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const totalIncome = transactionSummary ? transactionSummary.netTotal : 0
  const allIncome = transactionSummary ? transactionSummary.income : 0
  const allExpenses = transactionSummary ? transactionSummary.expense : 0

  if (isLoading) {
    return <p>Loading total income...</p>
  }

  if (error) {
    return <p>Error loading total income: {error.message}</p>
  }

  // Handle the month selection change
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value)
  }

  // Handle the year selection change
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value)
  }

  return (
    <div>
      {session ? (
        <div>
          <p>Welcome, {session.user?.name}!</p>

          <div>
            <p>Total Income: ${totalIncome}</p>
            <p>All Income: ${allIncome}</p>
            <p>All Expenses: ${allExpenses}</p>
          </div>

          {/* Dropdown to select a year */}
          <div className='mt-4'>
            <label htmlFor='year' className='mr-2'>Select Year:</label>
            <select
              id='year'
              value={selectedYear}
              onChange={handleYearChange}
              className='border p-2'
            >
              <option value=''>All Years</option>
              {/* You can populate this list dynamically if you prefer */}
              {Array.from({ length: 6, }, (_, i) => 2020 + i).map((year) => (
                <option key={year} value={`${year}`}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown to select a month */}
          <div className='mt-4'>
            <label htmlFor='month' className='mr-2'>Select Month:</label>
            <select
              id='month'
              value={selectedMonth}
              onChange={handleMonthChange}
              className='border p-2'
            >
              <option value=''>All Months</option>
              {Array.from({ length: 12, }, (_, i) => {
                const month = i + 1
                return (
                  <option key={month} value={`${month < 10 ? '0' : ''}${month}`}>
                    {new Date(0, month - 1).toLocaleString('en', { month: 'long', })}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Render expenses breakdown chart */}
          {!isExpenseLoading && expenseData && expenseData.length > 0 && (
            <div className='mt-8'>
              <h2 className='text-lg font-semibold mb-4'>Expenses Breakdown</h2>
              <ExpensesRingChart data={expenseData} />
            </div>
          )}
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
