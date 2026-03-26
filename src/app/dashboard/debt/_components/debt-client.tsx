'use client'

import { useState } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, CreditCard, Link } from 'lucide-react'
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

// ── Constants ─────────────────────────────────────────────────────────────────

const DEBT_TYPES = ['CREDIT_CARD', 'STUDENT_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'PERSONAL_LOAN', 'MEDICAL', 'OTHER'] as const
// CREDIT_CARD debts are auto-created from CREDIT wallets — not available for manual entry
const MANUAL_DEBT_TYPES = DEBT_TYPES.filter((t) => t !== 'CREDIT_CARD')
type DebtType = typeof DEBT_TYPES[number]

const TYPE_LABELS: Record<DebtType, string> = {
  AUTO_LOAN: 'Auto Loan',
  CREDIT_CARD: 'Credit Card',
  MEDICAL: 'Medical',
  MORTGAGE: 'Mortgage',
  OTHER: 'Other',
  PERSONAL_LOAN: 'Personal Loan',
  STUDENT_LOAN: 'Student Loan',
}

const TYPE_COLORS: Record<DebtType, string> = {
  AUTO_LOAN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CREDIT_CARD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MEDICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MORTGAGE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTHER: 'bg-muted text-muted-foreground',
  PERSONAL_LOAN: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  STUDENT_LOAN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { currency: 'USD', minimumFractionDigits: 0, style: 'currency' }).format(n)

const calcPayoffMonths = (balance: number, minPayment: number | null | undefined, apr: number | null | undefined): number | null => {
  if (!minPayment || minPayment <= 0 || balance <= 0) return null
  const r = apr ? apr / 100 / 12 : 0
  if (r === 0) return Math.ceil(balance / minPayment)
  if (minPayment <= balance * r) return null
  return Math.ceil(-Math.log(1 - (r * balance) / minPayment) / Math.log(1 + r))
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const debtSchema = z.object({
  creditor: z.string().max(100).optional(),
  currentBalance: z.coerce.number().positive('Must be greater than 0'),
  dueDay: z.coerce.number().int().min(1).max(31).optional().or(z.literal('')),
  interestRate: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  minimumPayment: z.coerce.number().min(0).optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required').max(50),
  notes: z.string().max(200).optional(),
  originalAmount: z.coerce.number().positive('Must be greater than 0'),
  type: z.enum(DEBT_TYPES),
})

type DebtFormValues = z.infer<typeof debtSchema>

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Must be greater than 0'),
  walletId: z.string().min(1, 'Select a wallet'),
})
type PaymentValues = z.infer<typeof paymentSchema>

// ── Wallet types ──────────────────────────────────────────────────────────────

type WalletOption = { balance: number; id: string; name: string; type: string }

// ── Debt form ─────────────────────────────────────────────────────────────────

type DebtFormProps = {
  defaultValues?: Partial<DebtFormValues>
  isLinked?: boolean  // true for wallet-linked (CREDIT_CARD) debts
  onCancel: () => void
  onSubmit: (values: DebtFormValues) => void
  submitting: boolean
}

const DebtForm = ({ defaultValues, onSubmit, onCancel, submitting, isLinked }: DebtFormProps) => {
  const form = useForm<DebtFormValues>({
    defaultValues: {
      creditor: '',
      currentBalance: undefined,
      dueDay: '',
      interestRate: '',
      minimumPayment: '',
      name: '',
      notes: '',
      originalAmount: undefined,
      type: 'OTHER',
      ...defaultValues,
    },
    resolver: zodResolver(debtSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {isLinked && (
          <div className='flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground'>
            <Link className='size-3 shrink-0' />
            Name and balance are synced from the linked wallet. Edit the details below.
          </div>
        )}

        <div className='grid grid-cols-2 gap-4'>
          {!isLinked && (
            <FormField control={form.control} name='name' render={({ field }) => (
              <FormItem className='col-span-2'>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} placeholder='Car loan, student loan…' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          {!isLinked && (
            <FormField control={form.control} name='type' render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder='Select type…' /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MANUAL_DEBT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name='creditor' render={({ field }) => (
            <FormItem className={isLinked ? 'col-span-2' : ''}>
              <FormLabel>Creditor <span className='text-muted-foreground'>(optional)</span></FormLabel>
              <FormControl><Input {...field} placeholder='Chase, Sallie Mae…' /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name='originalAmount' render={({ field }) => (
            <FormItem className={isLinked ? 'col-span-2' : ''}>
              <FormLabel>Original amount</FormLabel>
              <FormControl><Input {...field} type='number' min={0} step={0.01} placeholder='10000' /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {!isLinked && (
            <FormField control={form.control} name='currentBalance' render={({ field }) => (
              <FormItem>
                <FormLabel>Current balance</FormLabel>
                <FormControl><Input {...field} type='number' min={0} step={0.01} placeholder='8500' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name='interestRate' render={({ field }) => (
            <FormItem>
              <FormLabel>Interest rate % <span className='text-muted-foreground'>(APR)</span></FormLabel>
              <FormControl><Input {...field} type='number' min={0} max={100} step={0.01} placeholder='19.99' /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name='minimumPayment' render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum payment <span className='text-muted-foreground'>(optional)</span></FormLabel>
              <FormControl><Input {...field} type='number' min={0} step={0.01} placeholder='250' /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name='dueDay' render={({ field }) => (
            <FormItem>
              <FormLabel>Due day <span className='text-muted-foreground'>(optional)</span></FormLabel>
              <FormControl><Input {...field} type='number' min={1} max={31} placeholder='15' /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name='notes' render={({ field }) => (
          <FormItem>
            <FormLabel>Notes <span className='text-muted-foreground'>(optional)</span></FormLabel>
            <FormControl><Input {...field} value={field.value ?? ''} placeholder='Any additional details…' /></FormControl>
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

// ── Payment form ──────────────────────────────────────────────────────────────

type PaymentFormProps = {
  defaultAmount?: number
  linkedWalletId?: string | null
  onCancel: () => void
  onSubmit: (v: PaymentValues) => void
  submitting: boolean
  wallets: WalletOption[]
}

const PaymentForm = ({ onSubmit, onCancel, submitting, wallets, defaultAmount, linkedWalletId }: PaymentFormProps) => {
  // Exclude the linked credit wallet from the "pay from" list
  const sourceWallets = wallets.filter((w) => w.id !== linkedWalletId)

  const form = useForm<PaymentValues>({
    defaultValues: { amount: defaultAmount ?? undefined, walletId: '' },
    resolver: zodResolver(paymentSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField control={form.control} name='walletId' render={({ field }) => (
          <FormItem>
            <FormLabel>Pay from wallet</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder='Select wallet…' /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {sourceWallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name} ({fmt(w.balance)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name='amount' render={({ field }) => (
          <FormItem>
            <FormLabel>Payment amount</FormLabel>
            <FormControl><Input {...field} type='number' min={0} step={0.01} placeholder='250' /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>Cancel</Button>
          <Button type='submit' disabled={submitting}>{submitting ? 'Processing…' : 'Make Payment'}</Button>
        </div>
      </form>
    </Form>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Debt = {
  creditor: string | null
  currentBalance: number
  dueDay: number | null
  id: string
  interestRate: number | null
  isPaidOff: boolean
  minimumPayment: number | null
  name: string
  notes: string | null
  originalAmount: number
  type: DebtType
  wallet: { id: string; name: string } | null
  walletId: string | null
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 9

export const DebtClient = () => {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editDebt, setEditDebt] = useState<Debt | null>(null)
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null)
  const [payDebt, setPayDebt] = useState<Debt | null>(null)

  const utils = api.useUtils()
  const invalidate = () => utils.debt.listPaginated.invalidate()

  const { data, isLoading } = api.debt.listPaginated.useQuery(
    { page, pageSize: PAGE_SIZE },
    { placeholderData: keepPreviousData }
  )

  const { data: walletsData } = api.wallet.list.useQuery()
  const wallets: WalletOption[] = walletsData ?? []

  const create = api.debt.create.useMutation({ onSuccess: () => { setCreateOpen(false); void invalidate() } })
  const update = api.debt.update.useMutation({ onSuccess: () => { setEditDebt(null); void invalidate() } })
  const makePayment = api.debt.makePayment.useMutation({ onSuccess: () => { setPayDebt(null); void invalidate() } })
  const remove = api.debt.delete.useMutation({ onSuccess: () => { setDeleteDebt(null); void invalidate() } })

  const debts: Debt[] = data?.items ?? []
  const pageCount = data?.pageCount ?? 1

  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0)
  const totalMinPayments = debts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0)

  const toDebtFormValues = (d: Debt): Partial<DebtFormValues> => ({
    creditor: d.creditor ?? '',
    currentBalance: d.currentBalance,
    dueDay: d.dueDay ?? '',
    interestRate: d.interestRate ?? '',
    minimumPayment: d.minimumPayment ?? '',
    name: d.name,
    notes: d.notes ?? '',
    originalAmount: d.originalAmount,
    type: d.type,
  })

  const submitDebt = (id: string | null, v: DebtFormValues) => {
    const payload = {
      ...v,
      dueDay: v.dueDay === '' ? undefined : Number(v.dueDay),
      interestRate: v.interestRate === '' ? undefined : Number(v.interestRate),
      minimumPayment: v.minimumPayment === '' ? undefined : Number(v.minimumPayment),
    }
    if (id) {
      update.mutate({ ...payload, id })
    } else {
      create.mutate(payload)
    }
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Debt Tracker</h1>
          <p className='text-sm text-muted-foreground'>Monitor balances, track payments, and plan your payoff</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='mr-2 size-4' /> Add Debt
        </Button>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className='grid gap-4 sm:grid-cols-2'>
          <Card>
            <CardContent className='pt-4'>
              <p className='text-xs text-muted-foreground uppercase tracking-wide'>Total Outstanding</p>
              <p className='mt-1 text-2xl font-bold text-destructive'>{fmt(totalDebt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4'>
              <p className='text-xs text-muted-foreground uppercase tracking-wide'>Min. Payments / Month</p>
              <p className='mt-1 text-2xl font-bold'>{fmt(totalMinPayments)}</p>
            </CardContent>
          </Card>
        </div>
      )}

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
      ) : debts.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <CreditCard className='size-8 text-muted-foreground mb-3' />
          <p className='font-medium'>No debts tracked yet</p>
          <p className='mt-1 text-sm text-muted-foreground'>Add a debt to start monitoring your payoff progress</p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            <Plus className='mr-2 size-4' /> Add Debt
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {debts.map((debt) => {
            const paidOff = debt.originalAmount - debt.currentBalance
            const pct = debt.originalAmount > 0
              ? Math.min(100, (paidOff / debt.originalAmount) * 100)
              : 0
            const months = calcPayoffMonths(debt.currentBalance, debt.minimumPayment, debt.interestRate)

            return (
              <Card key={debt.id} className={debt.isPaidOff ? 'opacity-75' : ''}>
                <CardHeader className='pb-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[debt.type]}`}>
                          {TYPE_LABELS[debt.type]}
                        </span>
                        {debt.wallet && (
                          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                            <Link className='size-3' />
                            {debt.wallet.name}
                          </span>
                        )}
                      </div>
                      <CardTitle className='mt-1 truncate text-base'>{debt.name}</CardTitle>
                      {debt.creditor && (
                        <p className='text-xs text-muted-foreground'>{debt.creditor}</p>
                      )}
                    </div>
                    <div className='flex shrink-0 gap-1'>
                      <button
                        onClick={() => setEditDebt(debt)}
                        className='rounded p-1 text-muted-foreground hover:text-foreground transition-colors'
                      >
                        <Pencil className='size-4' />
                      </button>
                      {!debt.walletId && (
                        <button
                          onClick={() => setDeleteDebt(debt)}
                          className='rounded p-1 text-muted-foreground hover:text-red-500 transition-colors'
                        >
                          <Trash2 className='size-4' />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='space-y-3'>
                  {/* Balance */}
                  <div className='flex items-baseline justify-between'>
                    <span className='text-xl font-bold'>{fmt(debt.currentBalance)}</span>
                    <span className='text-sm text-muted-foreground'>of {fmt(debt.originalAmount)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className={`h-full rounded-full transition-all ${debt.isPaidOff ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{pct.toFixed(0)}% paid off</span>
                    {debt.isPaidOff ? (
                      <span className='text-emerald-500 font-medium'>Paid off ✓</span>
                    ) : (
                      <span>{fmt(debt.currentBalance)} remaining</span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className='flex flex-wrap gap-1.5 text-xs'>
                    {debt.interestRate != null && (
                      <span className='rounded bg-muted px-2 py-0.5 text-muted-foreground'>
                        {debt.interestRate}% APR
                      </span>
                    )}
                    {debt.minimumPayment != null && (
                      <span className='rounded bg-muted px-2 py-0.5 text-muted-foreground'>
                        {fmt(debt.minimumPayment)}/mo min
                      </span>
                    )}
                    {debt.dueDay != null && (
                      <span className='rounded bg-muted px-2 py-0.5 text-muted-foreground'>
                        Due day {debt.dueDay}
                      </span>
                    )}
                  </div>

                  {months != null && !debt.isPaidOff && (
                    <p className='text-xs text-muted-foreground'>
                      ~{months} month{months !== 1 ? 's' : ''} at minimum payment
                    </p>
                  )}

                  {debt.notes && (
                    <p className='text-xs text-muted-foreground truncate'>{debt.notes}</p>
                  )}

                  {!debt.isPaidOff && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={() => setPayDebt(debt)}
                    >
                      <CreditCard className='mr-2 size-3.5' /> Make Payment
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
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>Add debt</DialogTitle></DialogHeader>
          <DebtForm
            onSubmit={(v) => submitDebt(null, v)}
            onCancel={() => setCreateOpen(false)}
            submitting={create.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editDebt} onOpenChange={(o) => { if (!o) setEditDebt(null) }}>
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>Edit debt</DialogTitle></DialogHeader>
          {editDebt && (
            <DebtForm
              isLinked={!!editDebt.walletId}
              defaultValues={toDebtFormValues(editDebt)}
              onSubmit={(v) => submitDebt(editDebt.id, v)}
              onCancel={() => setEditDebt(null)}
              submitting={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={!!payDebt} onOpenChange={(o) => { if (!o) setPayDebt(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make payment — {payDebt?.name}</DialogTitle>
          </DialogHeader>
          {payDebt && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Current balance</span>
                <span className='font-medium'>{fmt(payDebt.currentBalance)}</span>
              </div>
              {payDebt.wallet && (
                <div className='flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground'>
                  <Link className='size-3' />
                  Linked to <span className='font-medium text-foreground'>{payDebt.wallet.name}</span> — balance will sync automatically
                </div>
              )}
              <PaymentForm
                wallets={wallets}
                linkedWalletId={payDebt.walletId}
                defaultAmount={payDebt.minimumPayment ?? undefined}
                onSubmit={(v) => makePayment.mutate({ amount: v.amount, debtId: payDebt.id, walletId: v.walletId })}
                onCancel={() => setPayDebt(null)}
                submitting={makePayment.isPending}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteDebt} onOpenChange={(o) => { if (!o) setDeleteDebt(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteDebt?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the debt record and all payment history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDebt && remove.mutate({ id: deleteDebt.id })}
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
