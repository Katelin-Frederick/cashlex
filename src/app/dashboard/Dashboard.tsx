'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { CalendarIcon, } from 'lucide-react'
import { useForm, } from 'react-hook-form'
import React, { useEffect, } from 'react'
import { format, } from 'date-fns'
import { z, } from 'zod'

import { FormControl, FormMessage, FormField, FormLabel, FormItem, Form, } from '~/components/ui/form'
import { PopoverContent, PopoverTrigger, Popover, } from '~/components/ui/popover'
import ExpensesRingChart from '~/components/Charts/ExpensesPieChart'
import { Calendar, } from '~/components/ui/calendar'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'
import { cn, } from '~/lib/utils'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const defaultEndDate = new Date()
  const defaultStartDate = new Date(defaultEndDate)
  defaultStartDate.setMonth(defaultEndDate.getMonth() - 1)

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

  const { handleSubmit, watch, } = form

  const watchAllFields = watch()

  const { data: transactionSummary, isLoading, error, } = api.transactions.getSummary.useQuery()

  const startOfDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const endOfDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  const startDateString = watchAllFields.startDate ? startOfDay(watchAllFields.startDate).toISOString() : undefined
  const endDateString = watchAllFields.endDate ? endOfDay(watchAllFields.endDate).toISOString() : undefined

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

          <div className='bg-gray-500 p-6 rounded-md text-center'>
            <h2 className='text-lg font-semibold mb-4'>Expenses Breakdown</h2>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                {/* Start Date Form Field */}
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field, }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date Form Field */}
                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field, }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit'>Submit</Button>
              </form>
            </Form>

            {/* Expenses Breakdown */}
            {!isExpenseLoading && (
              <div className='mt-8 bg-gray-100 p-5'>
                {expenseData && expenseData.length > 0 ? (
                  <ExpensesRingChart data={expenseData} />
                ) : (
                  <p className='text-muted-foreground'>No expenses found for the selected date range.</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
