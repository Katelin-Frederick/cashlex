'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useForm, } from 'react-hook-form'
import { z, } from 'zod'

import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import {
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
  Select,
} from '~/components/ui/select'
import { Switch, } from '~/components/ui/switch'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'

// ── Types ──────────────────────────────────────────────────────────────

export type Category = {
  color: string | null
  icon: string | null
  id: string
  name: string
}

// ── Schema ─────────────────────────────────────────────────────────────

export const budgetSchema = z.object({
  alertEnabled: z.boolean(),
  alertThreshold: z.coerce.number().min(1, 'Must be at least 1%').max(100, 'Must be at most 100%'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Please select a category'),
  endDate: z.string().min(1, 'Please select an end date'),
  name: z.string().min(1, 'Name is required').max(50),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1, 'Please select a start date'),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after the start date',
  path: ['endDate'],
})

export type BudgetFormValues = z.infer<typeof budgetSchema>

const PERIOD_OPTIONS = [
  { label: 'Weekly', value: 'WEEKLY', },
  { label: 'Monthly', value: 'MONTHLY', },
  { label: 'Yearly', value: 'YEARLY', }
] as const

// ── Component ──────────────────────────────────────────────────────────

type BudgetFormProps = {
  categories: Category[]
  defaultValues: BudgetFormValues
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: BudgetFormValues) => void
  submitLabel: string
}

export const BudgetForm = ({
  categories,
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: BudgetFormProps) => {
  const form = useForm<BudgetFormValues>({
    defaultValues,
    resolver: zodResolver(budgetSchema),
  })

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.]/g, '')
    const parts = raw.split('.')
    const sanitised = parts.length > 2
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : raw
    e.target.value = sanitised
  }

  return (
    <Form {...form}>
      <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
        {/* Name */}
        <FormField
          control={form.control}
          name='name'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Budget name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Groceries' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name='categoryId'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a category' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <FormLabel>Budget limit</FormLabel>
              <FormControl>
                <Input
                  inputMode='decimal'
                  placeholder='0.00'
                  {...field}
                  onChange={(e) => {
                    handleAmountChange(e)
                    field.onChange(e)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Period */}
        <FormField
          control={form.control}
          name='period'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Period</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start / End date side by side */}
        <div className='grid grid-cols-2 gap-3'>
          <FormField
            control={form.control}
            name='startDate'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='endDate'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Alert settings */}
        <div className='rounded-lg border p-4 space-y-3'>
          <FormField
            control={form.control}
            name='alertEnabled'
            render={({ field, }) => (
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium'>Budget alerts</p>
                  <p className='text-muted-foreground text-xs'>Email me when spending nears the limit</p>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />

          {form.watch('alertEnabled') && (
            <FormField
              control={form.control}
              name='alertThreshold'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Alert threshold (%)</FormLabel>
                  <FormControl>
                    <Input inputMode='numeric' placeholder='80' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={isPending} type='submit'>
            {isPending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
