'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import React, { useEffect, useState, } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.', }),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.', })
    .refine((val) => parseFloat(val) > 0, { message: 'Amount must be a positive number.', }),
})

type FormSchema = z.infer<typeof formSchema>

const Budgets = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const [budgets, setBudgets] = useState<
    {
      name: string
      amount: number
    }[]
  >([])

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: '',
    },
  })

  const onSubmit = (values: FormSchema) => {
    const amountNumber = parseFloat(values.amount)

    setBudgets([
      ...budgets,
      {
        name: values.name,
        amount: amountNumber,
      }
    ])
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div>
      {session ? (
        <div className='flex justify-center items-center flex-col my-12'>
          <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl'>
            <h1 className='text-2xl font-bold text-center mb-6'>Create a Budget</h1>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-8 flex flex-col justify-center items-center w-full'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field, }) => (
                    <FormItem>
                      <FormLabel>Budget Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Budget Name' {...field} />
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

                <Button type='submit' className='w-full'>
                  Create
                </Button>
              </form>
            </Form>
          </div>

          {budgets.length > 0 ? (
            <div className='mt-12'>
              {budgets.map((budget, index) => (
                <div key={index}>
                  <p>{budget.name}</p>
                  <p>${budget.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='mt-12'>No budgets. Create a budget to get started.</p>
          )}
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Budgets
