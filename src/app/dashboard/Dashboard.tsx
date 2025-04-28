'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import React, { useEffect, useState, } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useForm, } from 'react-hook-form'
import { format, } from 'date-fns'
import { z, } from 'zod'

import { FormControl, FormMessage, FormField, FormLabel, FormItem, Form, } from '~/components/ui/form'
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

  const expensesOverviewSchema = z.object({
    startDate: z.date({ required_error: 'Start Date is required.', }),
    endDate: z.date({ required_error: 'End Date is required.', }),
  })

  type ExpensesOverviewFormValues = z.infer<typeof expensesOverviewSchema>

  const form = useForm({
    resolver: zodResolver(expensesOverviewSchema),
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    },
  })

  const { handleSubmit, setValue, } = form

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

  const onSubmit = (data: ExpensesOverviewFormValues) => {
    console.log('Form Submitted with: ', data)
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

          {/* Form */}
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
              {/* Start Date Form Field */}
              <FormField
                name='startDate'
                render={({ field, }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full pl-3 text-left'
                          >
                            {startDate ? format(startDate, 'PPP') : 'Select start date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={startDate}
                            onSelect={(date) => {
                              if (date) {
                                setStartDate(new Date(date))
                                setValue('startDate', new Date(date))
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date Form Field */}
              <FormField
                name='endDate'
                render={({ field, }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full pl-3 text-left'
                          >
                            {endDate ? format(endDate, 'PPP') : 'Select end date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={endDate}
                            onSelect={(date) => {
                              if (date) {
                                setEndDate(new Date(date))
                                setValue('endDate', new Date(date))
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit'>Submit</Button>
            </form>
          </Form>

          {/* Expenses Breakdown */}
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
