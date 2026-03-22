'use client'

import { keepPreviousData, } from '@tanstack/react-query'
import { useState, } from 'react'

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
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dialog,
} from '~/components/ui/dialog'
import { CardContent, CardHeader, CardTitle, Card, } from '~/components/ui/card'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'

import type { BudgetFormValues, } from './budget-form'

import { BudgetForm, } from './budget-form'

// ── Types ──────────────────────────────────────────────────────────────

type Budget = {
  amount: number
  category: { color: string | null; icon: string | null; id: string; name: string; type: string }
  categoryId: string
  endDate: Date
  id: string
  name: string
  period: 'MONTHLY' | 'WEEKLY' | 'YEARLY'
  spent: number
  startDate: Date
}

// ── Helpers ────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<'MONTHLY' | 'WEEKLY' | 'YEARLY', string> = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  YEARLY: 'Yearly',
}

const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', })

const toDateInput = (date: Date) => new Date(date).toISOString().split('T')[0] ?? ''

const todayString = () => new Date().toISOString().split('T')[0] ?? ''

// ── Budget card ────────────────────────────────────────────────────────

type BudgetCardProps = {
  budget: Budget
  onDelete: (b: Budget) => void
  onEdit: (b: Budget) => void
}

const BudgetCard = ({ budget, onDelete, onEdit, }: BudgetCardProps) => {
  const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
  const isOverBudget = budget.spent > budget.amount
  const remaining = budget.amount - budget.spent

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 overflow-hidden'>
            <div
              className='flex size-8 shrink-0 items-center justify-center rounded-full text-sm'
              style={{ backgroundColor: budget.category.color ?? '#e2e8f0', }}
            >
              {budget.category.icon ?? budget.category.name.charAt(0).toUpperCase()}
            </div>
            <div className='overflow-hidden'>
              <CardTitle className='truncate text-base'>{budget.name}</CardTitle>
              <p className='text-muted-foreground truncate text-xs'>{budget.category.name}</p>
            </div>
          </div>
          <span className='shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
            {PERIOD_LABELS[budget.period]}
          </span>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Progress bar */}
        <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(percent, 100)}%`, }}
          />
        </div>

        {/* Spent / limit */}
        <div className='flex items-baseline justify-between text-sm'>
          <span className={isOverBudget ? 'font-semibold text-red-600' : 'font-medium'}>
            ${budget.spent.toFixed(2)} spent
          </span>
          <span className='text-muted-foreground'>of ${budget.amount.toFixed(2)}</span>
        </div>

        {/* Remaining or over-budget note */}
        <p className={`text-xs ${isOverBudget ? 'font-medium text-red-500' : 'text-muted-foreground'}`}>
          {isOverBudget
            ? `$${Math.abs(remaining).toFixed(2)} over budget`
            : `$${remaining.toFixed(2)} remaining`}
        </p>

        {/* Date range */}
        <p className='text-muted-foreground text-xs'>
          {formatDate(budget.startDate)} – {formatDate(budget.endDate)}
        </p>

        {/* Actions */}
        <div className='flex gap-2 pt-1'>
          <Button className='flex-1' size='sm' variant='outline' onClick={() => onEdit(budget)}>
            Edit
          </Button>
          <Button className='flex-1' size='sm' variant='destructive' onClick={() => onDelete(budget)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main client component ──────────────────────────────────────────────

export const BudgetsClient = () => {
  const utils = api.useUtils()

  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [deleteBudget, setDeleteBudget] = useState<Budget | null>(null)

  const { data, isLoading, isFetching, } = api.budget.listPaginated.useQuery(
    { page, pageSize: 9, },
    { placeholderData: keepPreviousData, }
  )
  const { data: categories = [], } = api.category.list.useQuery()

  const budgets = (data?.items ?? []) as Budget[]
  const pageCount = data?.pageCount ?? 1

  const invalidate = () => {
    void utils.budget.listPaginated.invalidate()
    void utils.budget.list.invalidate()
  }

  const create = api.budget.create.useMutation({ onSuccess: () => { setCreateOpen(false); invalidate() }, })
  const update = api.budget.update.useMutation({ onSuccess: () => { setEditBudget(null); invalidate() }, })
  const remove = api.budget.delete.useMutation({ onSuccess: () => { setDeleteBudget(null); invalidate() }, })

  const createDefaults: BudgetFormValues = {
    amount: 0,
    categoryId: '',
    endDate: '',
    name: '',
    period: 'MONTHLY',
    startDate: todayString(),
  }

  if (isLoading) {
    return (
      <div className='flex min-h-100 items-center justify-center'>
        <p className='text-muted-foreground'>Loading budgets…</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-5xl px-6 py-10'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Budgets</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Set spending limits and track progress
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Add budget</Button>
      </div>

      {/* Empty state */}
      {budgets.length === 0 && !isFetching && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='text-muted-foreground text-sm'>No budgets yet.</p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            Create your first budget
          </Button>
        </div>
      )}

      {/* Budget grid */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onDelete={setDeleteBudget}
            onEdit={setEditBudget}
          />
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className='mt-6 flex items-center justify-center gap-4'>
          <Button
            disabled={page === 1 || isFetching}
            size='sm'
            variant='outline'
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className='text-muted-foreground text-sm'>
            Page {page} of {pageCount}
          </span>
          <Button
            disabled={page === pageCount || isFetching}
            size='sm'
            variant='outline'
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add budget</DialogTitle>
          </DialogHeader>
          <BudgetForm
            categories={categories}
            defaultValues={createDefaults}
            isPending={create.isPending}
            submitLabel='Create'
            onCancel={() => setCreateOpen(false)}
            onSubmit={(values) => create.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editBudget}
        onOpenChange={(open) => { if (!open) setEditBudget(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit budget</DialogTitle>
          </DialogHeader>
          {editBudget && (
            <BudgetForm
              categories={categories}
              defaultValues={{
                amount: editBudget.amount,
                categoryId: editBudget.categoryId,
                endDate: toDateInput(editBudget.endDate),
                name: editBudget.name,
                period: editBudget.period,
                startDate: toDateInput(editBudget.startDate),
              }}
              isPending={update.isPending}
              submitLabel='Save changes'
              onCancel={() => setEditBudget(null)}
              onSubmit={(values) => update.mutate({ id: editBudget.id, ...values, })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteBudget}
        onOpenChange={(open) => { if (!open) setDeleteBudget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteBudget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the budget. Your transactions will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => deleteBudget && remove.mutate({ id: deleteBudget.id, })}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
