'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { CalendarIcon, } from 'lucide-react'
import { useForm, } from 'react-hook-form'
import { format, } from 'date-fns'
import React from 'react'
import { z, } from 'zod'

import { FormControl, FormMessage, FormField, FormLabel, FormItem, Form, } from '~/components/ui/form'
import { PopoverTrigger, PopoverContent, Popover, } from '~/components/ui/popover'
import CategoryRingChart from '~/components/Charts/CategoryRingChart'
import { Calendar, } from '~/components/ui/calendar'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'
import { cn, } from '~/lib/utils'


const IncomeSummary = () => {
  const defaultEndDate = new Date()
  const defaultStartDate = new Date(defaultEndDate)
  defaultStartDate.setMonth(defaultEndDate.getMonth() - 1)

  const incomeOverviewSchema = z.object({
    startDate: z.date({ required_error: 'Start Date is required.', }),
    endDate: z.date({ required_error: 'End Date is required.', }),
  })

  type IncomeOverviewFormValues = z.infer<typeof incomeOverviewSchema>

  const form = useForm({
    resolver: zodResolver(incomeOverviewSchema),
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    },
  })

  const { handleSubmit, watch, } = form

  const watchAllFields = watch()

  const onSubmit = (data: IncomeOverviewFormValues) => {
    console.log('Form Submitted with: ', data)
  }

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

  const { data: incomeData, isLoading: isIncomeLoading, } = api.transactions.getIncomeBreakdown.useQuery(
    {
      startDate: startDateString,
      endDate: endDateString,
    }
  )

  return (
    <div className='bg-gray-500 p-6 rounded-md text-center'>
      <h2 className='text-lg font-semibold mb-4'>Income Breakdown</h2>

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

      {!isIncomeLoading && (
        <div className='mt-8 bg-gray-100 p-5'>
          {incomeData && incomeData.length > 0 ? (
            <CategoryRingChart data={incomeData} />
          ) : (
            <p className='text-muted-foreground'>No income found for the selected date range.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default IncomeSummary