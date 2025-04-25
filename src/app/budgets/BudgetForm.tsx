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
import { CurrencyInput, } from '~/components/CurrencyInput/CurrencyInput'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.', }),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.', })
    .refine((val) => parseFloat(val) > 0, { message: 'Amount must be positive.', }),
  description: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

const BudgetForm = () => {
  const utils = api.useUtils()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', amount: '', description: '', },
  })

  const { mutate, status, } = api.budget.create.useMutation({
    onMutate: async (newBudget) => {
      await utils.budget.getAll.cancel()
      const previous = utils.budget.getAll.getData()

      const optimisticBudget = {
        id: `temp-${Date.now()}`,
        name: newBudget.name,
        amount: parseFloat(newBudget.amount),
        description: newBudget.description ?? '',
        spent: 0,
        createdAt: new Date(),
        userId: '', // optional depending on your UI
      }

      utils.budget.getAll.setData(undefined, (old = []) => [...old, optimisticBudget])
      return { previous, }
    },
    onError: (_err, _vars, ctx) => {
      utils.budget.getAll.setData(undefined, ctx?.previous)
    },
    onSuccess: () => {
      form.reset()
    },
    onSettled: async () => {
      await utils.budget.getAll.invalidate()
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className='space-y-8 flex flex-col'>
        <FormField
          control={form.control}
          name='name'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Budget Name</FormLabel>
              <FormControl>
                <Input placeholder='Groceries, Rent, etc.' {...field} />
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
              <FormLabel>Budget Amount</FormLabel>
              <FormControl>
                <CurrencyInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder='Optional details' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={status === 'pending'}>
          {status === 'pending' ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </Form>
  )
}

export default BudgetForm