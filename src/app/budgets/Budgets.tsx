'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import React, { useEffect, useState, } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useForm, } from 'react-hook-form'
import { motion, } from 'framer-motion'
import { X, } from 'lucide-react'
import { z, } from 'zod'

import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import { CardDescription, CardContent, CardHeader, CardTitle, Card, } from '~/components/ui/card'
import { CurrencyInput, } from '~/components/CurrencyInput/CurrencyInput'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'

type Budget = {
  name: string
  amount: number
  description?: string
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.', }),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.', })
    .refine((val) => parseFloat(val) > 0, { message: 'Amount must be a positive number.', }),
  description: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

const Budgets = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [undo, setUndo] = useState<{ budget: Budget; index: number } | null>(null)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: '',
      description: '',
    },
  })

  const onSubmit = (values: FormSchema) => {
    const { name, amount, description, } = values
    const amountNumber = parseFloat(amount)

    setBudgets([
      ...budgets,
      {
        name,
        amount: amountNumber,
        description,
      }
    ])

    form.reset()
  }

  const handleDelete = (index: number) => {
    const budgetToDelete = budgets[index]
    if (budgetToDelete) {
      setUndo({ budget: budgetToDelete, index, })
      setBudgets(budgets.filter((_, i) => i !== index))
      setDeletingId(null)
    }
  }

  const handleUndo = () => {
    if (undo) {
      const { budget, index, } = undo
      setBudgets([
        ...budgets.slice(0, index),
        budget,
        ...budgets.slice(index)
      ])
      setUndo(null)
    }
  }

  const handleCancelDelete = () => {
    setDeletingId(null)
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

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field, }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder='Description' {...field} />
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
            <div className='mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch'>
              {budgets.map((budget, index) => (
                <motion.div
                  key={index}
                  className='w-52'
                  initial={{ opacity: 0, }}
                  animate={{ opacity: 1, }}
                  exit={{ opacity: 0, }}
                  transition={{ duration: 0.3, }}
                >
                  <Card className='flex flex-col h-full relative'>
                    <CardHeader className='flex-grow'>
                      <CardTitle>{budget.name}</CardTitle>
                      {budget.description !== '' && (
                        <CardDescription>{budget.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p>${budget.amount.toFixed(2)}</p>
                    </CardContent>
                    <div className='absolute top-2 right-2'>
                      <Button
                        variant='destructive'
                        size='icon'
                        className='size-6 p-0.5'
                        onClick={() => setDeletingId(index)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className='mt-12'>No budgets. Create a budget to get started.</p>
          )}
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}

      {/* Confirmation Modal */}
      {deletingId !== null && (
        <div className='fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center'>
          <div className='bg-white p-6 rounded-md w-1/3'>
            <h3 className='text-xl mb-4'>Are you sure you want to delete this budget?</h3>
            <div className='flex justify-end space-x-4'>
              <Button variant='outline' onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={() => handleDelete(deletingId)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Snackbar */}
      {undo && (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-md'>
          <div className='flex justify-between items-center'>
            <span>
              Budget deleted. <span className='font-bold'>{undo.budget.name}</span>
            </span>
            <Button variant='link' className='text-white' onClick={handleUndo}>
              Undo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budgets
