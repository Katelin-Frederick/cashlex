'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useForm, } from 'react-hook-form'
import { motion, } from 'framer-motion'
import { useEffect, } from 'react'
import { X, } from 'lucide-react'
import { z, } from 'zod'

import {
  DialogDescription,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  Dialog,
} from '~/components/ui/dialog'
import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import {
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from '~/components/ui/card'
import { CurrencyInput, } from '~/components/CurrencyInput/CurrencyInput'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'
import { cn, } from '~/lib/utils'

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
  const { status: sessionStatus, } = useSession()
  const router = useRouter()

  const utils = api.useUtils()

  const { data: budgets = [], isLoading, } = api.budget.getAll.useQuery(undefined, { enabled: sessionStatus === 'authenticated', })

  const { mutate: createBudgetMutate, status: mutationStatus, } = api.budget.create.useMutation({
    onSuccess: async () => {
      await utils.budget.getAll.invalidate()
      form.reset()
    },
  })

  const isCreating = mutationStatus === 'pending'

  const { mutate: deleteBudgetMutate, status: deleteStatus, } = api.budget.delete.useMutation({
    onSuccess: async () => {
      await utils.budget.getAll.invalidate()
    },
  })

  const isDeleting = deleteStatus === 'pending'

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: '',
      description: '',
    },
  })

  const onSubmit = (values: FormSchema) => {
    createBudgetMutate(values)
  }

  const handleDelete = (id: string) => {
    deleteBudgetMutate({ id, })
  }

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [sessionStatus, router])

  if (sessionStatus === 'loading') return <div>Loading session...</div>

  return (
    <div className='flex flex-col items-center my-12'>
      <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl'>
        <h1 className='text-2xl font-bold text-center mb-6'>Create a Budget</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 flex flex-col'>
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

            <Button type='submit' className='w-full' disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </Form>
      </div>

      {isLoading && <p className='mt-12'>Loading budgets...</p>}

      {!isLoading && budgets.length === 0 && (
        <p className='mt-12'>No budgets yet. Add one to get started!</p>
      )}

      {!isLoading && budgets.length > 0 && (
        <div className='mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
          {budgets.map((budget) => (
            <motion.div
              key={budget.id}
              className='w-56'
              initial={{ opacity: 0, }}
              animate={{ opacity: 1, }}
              exit={{ opacity: 0, }}
              transition={{ duration: 0.3, }}
            >
              <Card className='relative'>
                <CardHeader>
                  <CardTitle>{budget.name}</CardTitle>
                  {budget.description && <CardDescription>{budget.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <p>Amount: ${budget.amount.toFixed(2)}</p>
                  <p>Spent: ${budget.spent.toFixed(2)}</p>
                  <p
                    className={cn(
                      budget.amount - budget.spent >= 0 ? 'text-green-800' : 'text-red-300'
                    )}
                  >
                    Remaining: ${(budget.amount - budget.spent).toFixed(2)}
                  </p>
                </CardContent>
                <div className='absolute top-2 right-2'>
                  <Dialog>
                    <DialogTrigger className='size-6 p-0.5 hover:text-red-300'>
                      <X size={16} />
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Budget</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete {budget.name}? <br />
                          This action is permanent.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogClose asChild>
                        <Button variant='outline'>Cancel</Button>
                      </DialogClose>
                      <Button
                        variant='destructive'
                        onClick={() => handleDelete(budget.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Budgets
