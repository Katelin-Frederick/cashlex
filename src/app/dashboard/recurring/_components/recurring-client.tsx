'use client'

import { useState, } from 'react'

import { keepPreviousData, } from '@tanstack/react-query'

import {
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialog,
} from '~/components/ui/alert-dialog'
import { CardContent, CardHeader, CardTitle, Card, } from '~/components/ui/card'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dialog,
} from '~/components/ui/dialog'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'

import type { RecurringFormValues, } from './recurring-form'

import { FREQUENCY_LABELS, RecurringForm, } from './recurring-form'

// ── Types ──────────────────────────────────────────────────────────────

type RecurringExpense = {
  amount: number
  category: { color: string | null; icon: string | null; name: string } | null
  categoryId: string | null
  description: string | null
  frequency: RecurringFormValues['frequency']
  id: string
  isActive: boolean
  name: string
  nextDueDate: Date
  walletId: string | null
  wallet: { name: string } | null
}

// ── Helpers ────────────────────────────────────────────────────────────

const toDateInput = (date: Date) => new Date(date).toISOString().split('T')[0] ?? ''

const todayString = () => new Date().toISOString().split('T')[0] ?? ''

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', })

const isPast = (date: Date) => new Date(date) < new Date(new Date().toDateString())

// ── Card component ─────────────────────────────────────────────────────

type CardProps = {
  expense: RecurringExpense
  onDelete: (e: RecurringExpense) => void
  onEdit: (e: RecurringExpense) => void
  onToggle: (e: RecurringExpense) => void
}

const RecurringCard = ({ expense, onDelete, onEdit, onToggle, }: CardProps) => {
  const dueSoon = !isPast(expense.nextDueDate) &&
    (new Date(expense.nextDueDate).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000

  return (
    <Card className={expense.isActive ? '' : 'opacity-60'}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 overflow-hidden'>
            {expense.category && (
              <div
                className='flex size-8 shrink-0 items-center justify-center rounded-full text-sm'
                style={{ backgroundColor: expense.category.color ?? '#e2e8f0', }}
              >
                {expense.category.icon ?? expense.category.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className='overflow-hidden'>
              <CardTitle className='truncate text-base'>{expense.name}</CardTitle>
              <p className='text-muted-foreground truncate text-xs'>{expense.wallet?.name ?? 'No wallet'}</p>
            </div>
          </div>
          <span className='shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
            {FREQUENCY_LABELS[expense.frequency]}
          </span>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        <p className='text-2xl font-bold'>${expense.amount.toFixed(2)}</p>

        {expense.description && (
          <p className='text-muted-foreground truncate text-xs'>{expense.description}</p>
        )}

        <div className='flex items-center justify-between'>
          <div>
            <p className='text-muted-foreground text-xs'>Next due</p>
            <p className={`text-sm font-medium ${isPast(expense.nextDueDate) ? 'text-red-500' : dueSoon ? 'text-amber-500' : ''}`}>
              {formatDate(expense.nextDueDate)}
              {isPast(expense.nextDueDate) && ' · overdue'}
              {!isPast(expense.nextDueDate) && dueSoon && ' · due soon'}
            </p>
          </div>
          <button
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${expense.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
            onClick={() => onToggle(expense)}
          >
            <span
              className={`inline-block size-4 rounded-full bg-background shadow transition-transform ${expense.isActive ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        <div className='flex gap-2 pt-1'>
          <Button className='flex-1' size='sm' variant='outline' onClick={() => onEdit(expense)}>
            Edit
          </Button>
          <Button className='flex-1' size='sm' variant='destructive' onClick={() => onDelete(expense)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────

export const RecurringClient = () => {
  const utils = api.useUtils()

  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<RecurringExpense | null>(null)
  const [deleteExpense, setDeleteExpense] = useState<RecurringExpense | null>(null)

  const { data, isLoading, isFetching, } = api.recurringExpense.listPaginated.useQuery(
    { page, pageSize: 9, },
    { placeholderData: keepPreviousData, }
  )
  const { data: wallets = [], } = api.wallet.list.useQuery()
  const { data: categories = [], } = api.category.list.useQuery()

  const expenses = (data?.items ?? []) as RecurringExpense[]
  const pageCount = data?.pageCount ?? 1

  const invalidate = () => {
    void utils.recurringExpense.listPaginated.invalidate()
    void utils.recurringExpense.list.invalidate()
  }

  const create = api.recurringExpense.create.useMutation({ onSuccess: () => { setCreateOpen(false); invalidate() }, })
  const update = api.recurringExpense.update.useMutation({ onSuccess: () => { setEditExpense(null); invalidate() }, })
  const toggle = api.recurringExpense.toggleActive.useMutation({ onSuccess: () => invalidate(), })
  const remove = api.recurringExpense.delete.useMutation({ onSuccess: () => { setDeleteExpense(null); invalidate() }, })

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')

  const createDefaults: RecurringFormValues = {
    amount: 0,
    categoryId: undefined,
    description: undefined,
    frequency: 'MONTHLY',
    name: '',
    nextDueDate: todayString(),
    walletId: '',
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <p className='text-muted-foreground'>Loading recurring expenses…</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-5xl px-6 py-10'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Recurring Expenses</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Auto-generated on their due date each period
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Add recurring</Button>
      </div>

      {/* Empty state */}
      {expenses.length === 0 && !isFetching && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='text-muted-foreground text-sm'>No recurring expenses yet.</p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            Add your first one
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        {expenses.map((expense) => (
          <RecurringCard
            key={expense.id}
            expense={expense}
            onDelete={setDeleteExpense}
            onEdit={setEditExpense}
            onToggle={(e) => toggle.mutate({ id: e.id, isActive: !e.isActive, })}
          />
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className='mt-6 flex items-center justify-center gap-4'>
          <Button disabled={page === 1 || isFetching} size='sm' variant='outline' onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className='text-muted-foreground text-sm'>Page {page} of {pageCount}</span>
          <Button disabled={page === pageCount || isFetching} size='sm' variant='outline' onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add recurring expense</DialogTitle></DialogHeader>
          <RecurringForm
            categories={expenseCategories}
            defaultValues={createDefaults}
            isPending={create.isPending}
            submitLabel='Create'
            wallets={wallets}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(values) => create.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editExpense} onOpenChange={(open) => { if (!open) setEditExpense(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit recurring expense</DialogTitle></DialogHeader>
          {editExpense && (
            <RecurringForm
              categories={expenseCategories}
              defaultValues={{
                amount: editExpense.amount,
                categoryId: editExpense.categoryId ?? undefined,
                description: editExpense.description ?? undefined,
                frequency: editExpense.frequency,
                name: editExpense.name,
                nextDueDate: toDateInput(editExpense.nextDueDate),
                walletId: editExpense.walletId ?? '',
              }}
              isPending={update.isPending}
              submitLabel='Save changes'
              wallets={wallets}
              onCancel={() => setEditExpense(null)}
              onSubmit={(values) => update.mutate({ id: editExpense.id, ...values, })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteExpense} onOpenChange={(open) => { if (!open) setDeleteExpense(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteExpense?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This stops future auto-generation. Existing transactions are not affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => deleteExpense && remove.mutate({ id: deleteExpense.id, })}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
