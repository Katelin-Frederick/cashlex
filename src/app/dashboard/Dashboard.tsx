'use client'

import React, { useEffect, useState, } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { format, } from 'date-fns'

import { PopoverContent, PopoverTrigger, Popover, } from '~/components/ui/popover'
import ExpensesRingChart from '~/components/Charts/ExpensesPieChart'
import { Calendar, } from '~/components/ui/calendar'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const defaultEndDate = new Date()
  const defaultStartDate = new Date(defaultEndDate)
  defaultStartDate.setMonth(defaultEndDate.getMonth() - 1)

  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate)

  const { data: transactionSummary, isLoading, error, } = api.transactions.getSummary.useQuery()

  const startDateString = startDate ? startDate.toISOString() : undefined
  const endDateString = endDate ? endDate.toISOString() : undefined

  const { data: expenseData, isLoading: isExpenseLoading, } = api.transactions.getExpenseBreakdown.useQuery(
    {
      startDate: startDateString,
      endDate: endDateString,
    }
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

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      const adjustedStartDate = new Date(date)
      adjustedStartDate.setHours(0, 0, 0, 0)
      setStartDate(adjustedStartDate)
    } else {
      setStartDate(undefined)
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const adjustedEndDate = new Date(date)
      adjustedEndDate.setHours(23, 59, 59, 999)
      setEndDate(adjustedEndDate)
    } else {
      setEndDate(undefined)
    }
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

          <div className='mt-4'>
            <label htmlFor='startDate' className='mr-2'>Start Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full pl-3 text-left'>
                  {startDate ? format(startDate, 'PPP') : 'Select start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={startDate}
                  onSelect={(date) => handleStartDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className='mt-4'>
            <label htmlFor='endDate' className='mr-2'>End Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full pl-3 text-left'>
                  {endDate ? format(endDate, 'PPP') : 'Select end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={endDate}
                  onSelect={(date) => handleEndDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

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
