'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useForm, } from 'react-hook-form'
import { z, } from 'zod'

import { Button, } from '~/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from '~/components/ui/form'
import { Input, } from '~/components/ui/input'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select,
} from '~/components/ui/select'

// ── Schema ─────────────────────────────────────────────────────────────

export const recurringSchema = z.object({
  amount: z.number({ invalid_type_error: 'Amount is required', }).positive('Must be positive'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  name: z.string().min(1, 'Name is required').max(50),
  nextDueDate: z.string().min(1, 'Due date is required'),
  walletId: z.string().min(1, 'Wallet is required'),
})

export type RecurringFormValues = z.infer<typeof recurringSchema>

export const FREQUENCY_LABELS: Record<RecurringFormValues['frequency'], string> = {
  BIWEEKLY: 'Every 2 weeks',
  DAILY: 'Daily',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  WEEKLY: 'Weekly',
  YEARLY: 'Yearly',
}

// ── Props ──────────────────────────────────────────────────────────────

type Category = { id: string; name: string }
type Wallet = { id: string; name: string }

type Props = {
  categories: Category[]
  defaultValues: RecurringFormValues
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: RecurringFormValues) => void
  submitLabel: string
  wallets: Wallet[]
}

// ── Component ──────────────────────────────────────────────────────────

export const RecurringForm = ({ categories, defaultValues, isPending, onCancel, onSubmit, submitLabel, wallets, }: Props) => {
  const form = useForm<RecurringFormValues>({
    defaultValues,
    resolver: zodResolver(recurringSchema),
  })

  return (
    <Form {...form}>
      <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
        {/* Name */}
        <FormField
          control={form.control}
          name='name'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Monthly rent' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name='amount'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  placeholder='0.00'
                  type='number'
                  min='0'
                  step='0.01'
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Wallet */}
        <FormField
          control={form.control}
          name='walletId'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Wallet</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select wallet' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Frequency */}
        <FormField
          control={form.control}
          name='frequency'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select frequency' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABELS) as RecurringFormValues['frequency'][]).map((f) => (
                    <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Next due date */}
        <FormField
          control={form.control}
          name='nextDueDate'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Next due date</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category (optional) */}
        <FormField
          control={form.control}
          name='categoryId'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Category <span className='text-muted-foreground font-normal'>(optional)</span></FormLabel>
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='None' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='__none__'>None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description (optional) */}
        <FormField
          control={form.control}
          name='description'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Description <span className='text-muted-foreground font-normal'>(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder='Notes…' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>Cancel</Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
