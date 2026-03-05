'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useWatch, useForm, } from 'react-hook-form'
import { useEffect, } from 'react'
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
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'

// ── Types ──────────────────────────────────────────────────────────────

export type Wallet = { id: string; name: string; type: string }
export type Category = {
  color: string | null
  icon: string | null
  id: string
  name: string
  type: string
}

// ── Schema ─────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1).optional(),
  date: z.string().min(1, 'Please select a date'),
  description: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  walletId: z.string().min(1, 'Please select a wallet'),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

// ── Component ──────────────────────────────────────────────────────────

type TransactionFormProps = {
  categories: Category[]
  defaultValues: TransactionFormValues
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: TransactionFormValues) => void
  submitLabel: string
  wallets: Wallet[]
}

export const TransactionForm = ({
  categories,
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
  wallets,
}: TransactionFormProps) => {
  const form = useForm<TransactionFormValues>({
    defaultValues,
    resolver: zodResolver(transactionSchema),
  })

  const { setValue, } = form

  const selectedWalletId = useWatch({ control: form.control, name: 'walletId', })
  const selectedType = useWatch({ control: form.control, name: 'type', })
  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId', })

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId)
  const isCreditWallet = selectedWallet?.type === 'CREDIT'

  // CREDIT wallets don't support INCOME — reset type to EXPENSE if needed
  useEffect(() => {
    if (isCreditWallet && selectedType === 'INCOME') {
      setValue('type', 'EXPENSE')
    }
  }, [isCreditWallet, selectedType, setValue])

  // When type changes, clear categoryId if it no longer matches the new type
  useEffect(() => {
    if (!selectedCategoryId) return
    const cat = categories.find((c) => c.id === selectedCategoryId)
    if (cat && cat.type !== selectedType) {
      setValue('categoryId', undefined)
    }
  }, [selectedType, selectedCategoryId, categories, setValue])

  const filteredCategories = categories.filter((c) => c.type === selectedType)

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
                    <SelectValue placeholder='Select a wallet' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type */}
        <FormField
          control={form.control}
          name='type'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!isCreditWallet && (
                    <SelectItem value='INCOME'>Income</SelectItem>
                  )}
                  <SelectItem value='EXPENSE'>Expense</SelectItem>
                  <SelectItem value='TRANSFER'>Transfer</SelectItem>
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
              <FormLabel>Amount</FormLabel>
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

        {/* Category */}
        <FormField
          control={form.control}
          name='categoryId'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Category <span className='text-muted-foreground'>(optional)</span></FormLabel>
              <Select
                value={field.value ?? '__none__'}
                onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='No category' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='__none__'>No category</SelectItem>
                  {filteredCategories.map((c) => (
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

        {/* Date */}
        <FormField
          control={form.control}
          name='date'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name='description'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Description <span className='text-muted-foreground'>(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder='e.g. Grocery run' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
