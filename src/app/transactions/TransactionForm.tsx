'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { CalendarIcon, } from 'lucide-react'
import { useForm, } from 'react-hook-form'
import { format, } from 'date-fns'

import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import { SelectContent, SelectTrigger, SelectValue, SelectItem, Select, } from '~/components/ui/select'
import { PopoverContent, PopoverTrigger, Popover, } from '~/components/ui/popover'
import { RadioGroupItem, RadioGroup, } from '~/components/ui/radio-group'
import { CurrencyInput, } from '~/components/CurrencyInput/CurrencyInput'
import { Calendar, } from '~/components/ui/calendar'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'
import { cn, } from '~/lib/utils'

import { type TransactionFormValues, transactionSchema, } from './_validation/transactionsSchema'

const TransactionForm = ({ onSuccess, }: { onSuccess?: () => void }) => {
  const createTransaction = api.transactions.create.useMutation()
  const { data: budgets = [], } = api.budget.getAll.useQuery()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      paymentName: '',
      paymentType: '',
      paidDate: new Date(),
      budget: null,
      category: '',
    },
  })

  const watchAllFields = form.watch()

  const onSubmit = async (values: TransactionFormValues) => {
    await createTransaction.mutateAsync({
      paymentName: values.paymentName,
      paymentType: values.paymentType as 'income' | 'expense',
      amount: parseFloat(values.amount),
      paidDate: values.paidDate,
      budgetId: values.budget ?? null,
      category: values.category,
    })

    onSuccess?.()
    form.reset()
  }

  return (
    <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl mb-12'>
      <h1 className='text-2xl font-bold text-center mb-6'>Add a Transaction</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <FormField
            control={form.control}
            name='paymentName'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Payment Name</FormLabel>
                <FormControl>
                  <Input placeholder='Netflix' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='paymentType'
            render={({ field, }) => (
              <FormItem className='space-y-3'>
                <FormLabel>Payment Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className='flex flex-col space-y-1'
                    value={field.value}
                  >
                    <FormItem className='flex items-center space-x-3 space-y-0'>
                      <FormControl>
                        <RadioGroupItem value='income' />
                      </FormControl>
                      <FormLabel className='font-normal'>
                        Income
                      </FormLabel>
                    </FormItem>
                    <FormItem className='flex items-center space-x-3 space-y-0'>
                      <FormControl>
                        <RadioGroupItem value='expense' />
                      </FormControl>
                      <FormLabel className='font-normal'>
                        Expense
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='amount'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <CurrencyInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='paidDate'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Paid Date</FormLabel>
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
          {watchAllFields.paymentType === 'expense' && (
            <FormField
              control={form.control}
              name='budget'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a budget (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className='max-h-40 overflow-y-auto'>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name='category'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder='Entertainment, Utilities, etc.' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Submit</Button>
        </form>
      </Form>
    </div>
  )
}

export default TransactionForm
