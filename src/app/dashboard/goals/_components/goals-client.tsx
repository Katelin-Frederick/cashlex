'use client'

import { useState } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, PlusCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '~/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '~/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { api } from '~/trpc/react'

// ── Schema ────────────────────────────────────────────────────────────────────

const goalSchema = z.object({
  description: z.string().max(200).optional(),
  name: z.string().min(1, 'Name is required').max(50),
  targetAmount: z.coerce.number().positive('Must be greater than 0'),
  targetDate: z.string().optional(),
})

type GoalFormValues = z.infer<typeof goalSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { currency: 'USD', minimumFractionDigits: 0, style: 'currency' }).format(n)

const formatDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null

const daysUntil = (d: Date | null | undefined) => {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}

// ── Goal form ─────────────────────────────────────────────────────────────────

type GoalFormProps = {
  defaultValues?: Partial<GoalFormValues>
  onCancel: () => void
  onSubmit: (values: GoalFormValues) => void
  submitting: boolean
}

const GoalForm = ({ defaultValues, onSubmit, onCancel, submitting }: GoalFormProps) => {
  const form = useForm<GoalFormValues>({
    defaultValues: { name: '', targetAmount: undefined, targetDate: '', description: '', ...defaultValues },
    resolver: zodResolver(goalSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField control={form.control} name='name' render={({ field }) => (
          <FormItem>
            <FormLabel>Goal name</FormLabel>
            <FormControl><Input {...field} placeholder='Emergency fund, vacation…' /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name='targetAmount' render={({ field }) => (
          <FormItem>
            <FormLabel>Target amount</FormLabel>
            <FormControl><Input {...field} type='number' min={0} step={0.01} placeholder='5000' /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name='targetDate' render={({ field }) => (
          <FormItem>
            <FormLabel>Target date <span className='text-muted-foreground'>(optional)</span></FormLabel>
            <FormControl><Input {...field} value={field.value ?? ''} type='date' /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name='description' render={({ field }) => (
          <FormItem>
            <FormLabel>Notes <span className='text-muted-foreground'>(optional)</span></FormLabel>
            <FormControl><Input {...field} value={field.value ?? ''} placeholder='What is this goal for?' /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>Cancel</Button>
          <Button type='submit' disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Form>
  )
}

// ── Contribution form ─────────────────────────────────────────────────────────

const contributionSchema = z.object({
  amount: z.coerce.number().positive('Must be greater than 0'),
  walletId: z.string().min(1, 'Select a wallet'),
})
type ContributionValues = z.infer<typeof contributionSchema>

type Wallet = { id: string; name: string; balance: number }

type ContributionFormProps = {
  onCancel: () => void
  onSubmit: (v: ContributionValues) => void
  submitting: boolean
  wallets: Wallet[]
}

const ContributionForm = ({ onSubmit, onCancel, submitting, wallets }: ContributionFormProps) => {
  const form = useForm<ContributionValues>({
    defaultValues: { amount: undefined, walletId: '' },
    resolver: zodResolver(contributionSchema),
  })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField control={form.control} name='walletId' render={({ field }) => (
          <FormItem>
            <FormLabel>Wallet</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder='Select wallet…' /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name} ({fmt(w.balance)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name='amount' render={({ field }) => (
          <FormItem>
            <FormLabel>Amount to add</FormLabel>
            <FormControl><Input {...field} type='number' min={0} step={0.01} placeholder='100' /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>Cancel</Button>
          <Button type='submit' disabled={submitting}>{submitting ? 'Saving…' : 'Add'}</Button>
        </div>
      </form>
    </Form>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Goal = {
  createdAt: Date
  description: string | null
  id: string
  isCompleted: boolean
  name: string
  savedAmount: number
  targetAmount: number
  targetDate: Date | null
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 9

export const GoalsClient = () => {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)

  const utils = api.useUtils()
  const invalidate = () => utils.savingsGoal.listPaginated.invalidate()

  const { data, isLoading } = api.savingsGoal.listPaginated.useQuery(
    { page, pageSize: PAGE_SIZE },
    { placeholderData: keepPreviousData }
  )

  const { data: walletsData } = api.wallet.list.useQuery()
  const wallets: Wallet[] = walletsData ?? []

  const create = api.savingsGoal.create.useMutation({ onSuccess: () => { setCreateOpen(false); void invalidate() } })
  const update = api.savingsGoal.update.useMutation({ onSuccess: () => { setEditGoal(null); void invalidate() } })
  const addContribution = api.savingsGoal.addContribution.useMutation({ onSuccess: () => { setContributeGoal(null); void invalidate() } })
  const remove = api.savingsGoal.delete.useMutation({ onSuccess: () => { setDeleteGoal(null); void invalidate() } })

  const goals: Goal[] = data?.items ?? []
  const pageCount = data?.pageCount ?? 1

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Savings Goals</h1>
          <p className='text-sm text-muted-foreground'>Track your progress toward financial milestones</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='mr-2 size-4' /> New Goal
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className='pt-6 space-y-3'>
              <div className='h-5 w-32 animate-pulse rounded bg-muted' />
              <div className='h-3 w-full animate-pulse rounded bg-muted' />
              <div className='h-2 w-full animate-pulse rounded bg-muted' />
            </CardContent></Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='font-medium'>No savings goals yet</p>
          <p className='mt-1 text-sm text-muted-foreground'>Create your first goal to start tracking progress</p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            <Plus className='mr-2 size-4' /> New Goal
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0
            const days = daysUntil(goal.targetDate)
            const overdue = days !== null && days < 0 && !goal.isCompleted
            const remaining = goal.targetAmount - goal.savedAmount

            return (
              <Card key={goal.id} className={goal.isCompleted ? 'opacity-75' : ''}>
                <CardHeader className='pb-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <CardTitle className='truncate text-base'>{goal.name}</CardTitle>
                    </div>
                    <div className='flex shrink-0 gap-1'>
                      <button
                        onClick={() => setEditGoal(goal)}
                        className='rounded p-1 text-muted-foreground hover:text-foreground transition-colors'
                      >
                        <Pencil className='size-4' />
                      </button>
                      <button
                        onClick={() => setDeleteGoal(goal)}
                        className='rounded p-1 text-muted-foreground hover:text-red-500 transition-colors'
                      >
                        <Trash2 className='size-4' />
                      </button>
                    </div>
                  </div>
                  {goal.description && (
                    <p className='text-xs text-muted-foreground truncate'>{goal.description}</p>
                  )}
                </CardHeader>

                <CardContent className='space-y-3'>
                  {/* Amounts */}
                  <div className='flex items-baseline justify-between'>
                    <span className='text-xl font-bold'>{fmt(goal.savedAmount)}</span>
                    <span className='text-sm text-muted-foreground'>of {fmt(goal.targetAmount)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className={`h-full rounded-full transition-all ${goal.isCompleted ? 'bg-emerald-500' : pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{pct.toFixed(0)}% saved</span>
                    {!goal.isCompleted && remaining > 0 && (
                      <span>{fmt(remaining)} to go</span>
                    )}
                    {goal.isCompleted && (
                      <span className='text-emerald-500 font-medium'>Completed ✓</span>
                    )}
                  </div>

                  {/* Target date */}
                  {goal.targetDate && (
                    <p className={`text-xs ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {overdue ? '⚠ Overdue · ' : ''}
                      {formatDate(goal.targetDate)}
                      {days !== null && !overdue && !goal.isCompleted && ` · ${days}d left`}
                    </p>
                  )}

                  {/* Add contribution */}
                  {!goal.isCompleted && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={() => setContributeGoal(goal)}
                    >
                      <PlusCircle className='mr-2 size-3.5' /> Add contribution
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className='text-sm text-muted-foreground'>{page} / {pageCount}</span>
          <Button variant='outline' size='sm' disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New savings goal</DialogTitle></DialogHeader>
          <GoalForm
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setCreateOpen(false)}
            submitting={create.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => { if (!o) setEditGoal(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit goal</DialogTitle></DialogHeader>
          {editGoal && (
            <GoalForm
              defaultValues={{
                description: editGoal.description ?? '',
                name: editGoal.name,
                targetAmount: editGoal.targetAmount,
                targetDate: editGoal.targetDate
                  ? new Date(editGoal.targetDate).toISOString().slice(0, 10)
                  : '',
              }}
              onSubmit={(v) => update.mutate({ ...v, id: editGoal.id })}
              onCancel={() => setEditGoal(null)}
              submitting={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Contribution dialog */}
      <Dialog open={!!contributeGoal} onOpenChange={(o) => { if (!o) setContributeGoal(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to {contributeGoal?.name}</DialogTitle>
          </DialogHeader>
          {contributeGoal && (
            <ContributionForm
              wallets={wallets}
              onSubmit={(v) => addContribution.mutate({ amount: v.amount, id: contributeGoal.id, walletId: v.walletId })}
              onCancel={() => setContributeGoal(null)}
              submitting={addContribution.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteGoal} onOpenChange={(o) => { if (!o) setDeleteGoal(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteGoal?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the goal and all progress. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGoal && remove.mutate({ id: deleteGoal.id })}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
