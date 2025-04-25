'use client'

import { type inferRouterOutputs, } from '@trpc/server'
import { motion, } from 'framer-motion'
import { X, } from 'lucide-react'

import {
  DialogDescription,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogClose,
  Dialog,
} from '~/components/ui/dialog'
import {
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from '~/components/ui/card'
import { type AppRouter, } from '~/server/api/root'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'
import { cn, } from '~/lib/utils'

type RouterOutput = inferRouterOutputs<AppRouter>
type Budget = RouterOutput['budget']['getAll'][number]

const BudgetCard = ({ budget, }: { budget: Budget }) => {
  const utils = api.useUtils()
  const { mutate, status, } = api.budget.delete.useMutation({
    onMutate: async ({ id, }) => {
      await utils.budget.getAll.cancel()
      const previous = utils.budget.getAll.getData()
      utils.budget.getAll.setData(undefined, (old = []) => old.filter((b) => b.id !== id))
      return { previous, }
    },
    onError: (_err, _vars, ctx) => {
      utils.budget.getAll.setData(undefined, ctx?.previous)
    },
    onSettled: async () => {
      await utils.budget.getAll.invalidate()
    },
  })

  const isDeleting = status === 'pending'
  const remaining = Number(budget.amount) - Number(budget.spent)

  return (
    <motion.div className='w-56' initial={{ opacity: 0, }} animate={{ opacity: 1, }} exit={{ opacity: 0, }} transition={{ duration: 0.3, }}>
      <Card className='relative'>
        <CardHeader>
          <CardTitle>{budget.name}</CardTitle>
          {budget.description && <CardDescription>{budget.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p>Amount: ${Number(budget.amount).toFixed(2)}</p>
          <p>Spent: ${Number(budget.spent).toFixed(2)}</p>
          <p className={cn(remaining >= 0 ? 'text-green-800' : 'text-red-300')}>Remaining: ${remaining.toFixed(2)}</p>
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
                  Are you sure you want to delete {budget.name}? This action is permanent.
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button
                variant='destructive'
                onClick={() => mutate({ id: budget.id, })}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </motion.div>
  )
}

export default BudgetCard