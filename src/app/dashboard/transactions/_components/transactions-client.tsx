'use client'

import { keepPreviousData, } from '@tanstack/react-query'
import { useState, useEffect, } from 'react'

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
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
  Select,
} from '~/components/ui/select'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dialog,
} from '~/components/ui/dialog'
import { TabsTrigger, TabsList, Tabs, } from '~/components/ui/tabs'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'

import type { TransactionFormValues, } from './transaction-form'
import type { TransactionType, } from '../_lib/constants'

import { AMOUNT_COLORS, AMOUNT_PREFIX, TYPE_LABELS, } from '../_lib/constants'
import { TransactionForm, } from './transaction-form'

// ── Types ──────────────────────────────────────────────────────────────

type Filter = 'ALL' | TransactionType

type Transaction = {
  amount: number
  category: { color: string | null; icon: string | null; id: string; name: string } | null
  date: Date
  description: string | null
  id: string
  type: TransactionType
  wallet: { id: string; name: string; type: string }
}

// ── Helpers ────────────────────────────────────────────────────────────

const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const todayString = () => new Date().toISOString().split('T')[0] ?? ''

const PAGE_SIZE = 10

// ── Main client component ──────────────────────────────────────────────

export const TransactionsClient = () => {
  const utils = api.useUtils()

  const [typeFilter, setTypeFilter] = useState<Filter>('ALL')
  const [walletFilter, setWalletFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])
  const [createOpen, setCreateOpen] = useState(false)
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null)

  // Wallets + categories: loaded in full for the filter dropdown and form selects
  const { data: wallets = [], } = api.wallet.list.useQuery()
  const { data: categories = [], } = api.category.list.useQuery()

  const { data, isLoading, isFetching, } = api.transaction.listPaginated.useQuery(
    {
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      walletId: walletFilter === 'ALL' ? undefined : walletFilter,
    },
    { placeholderData: keepPreviousData, }
  )

  const transactions = data?.items ?? []
  const pageCount = data?.pageCount ?? 1
  const total = data?.total ?? 0

  const handleTypeFilter = (v: string) => {
    setTypeFilter(v as Filter)
    setPage(1)
  }

  const handleWalletFilter = (v: string) => {
    setWalletFilter(v)
    setPage(1)
  }

  const invalidate = () => utils.transaction.listPaginated.invalidate()

  const create = api.transaction.create.useMutation({
    onSuccess: () => {
      setCreateOpen(false)
      void invalidate()
      void utils.wallet.list.invalidate()
    },
  })

  const update = api.transaction.update.useMutation({
    onSuccess: () => {
      setEditTransaction(null)
      void invalidate()
      void utils.wallet.list.invalidate()
    },
  })

  const remove = api.transaction.delete.useMutation({
    onSuccess: () => {
      setDeleteTransaction(null)
      void invalidate()
      void utils.wallet.list.invalidate()
    },
  })

  const createDefaults: TransactionFormValues = {
    amount: 0,
    categoryId: undefined,
    date: todayString(),
    description: '',
    type: 'EXPENSE',
    walletId: wallets[0]?.id ?? '',
  }

  if (isLoading) {
    return (
      <div className='flex min-h-100 items-center justify-center'>
        <p className='text-muted-foreground'>Loading transactions…</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-3xl px-6 py-10'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Transactions</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Track your income, expenses, and transfers
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Add transaction</Button>
      </div>

      {/* Filters */}
      <div className='mb-6 space-y-3'>
        <Input
          placeholder='Search by description…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />
        <div className='flex flex-wrap items-center gap-4'>
          <Tabs value={typeFilter} onValueChange={handleTypeFilter}>
            <TabsList>
              <TabsTrigger value='ALL'>All</TabsTrigger>
              <TabsTrigger value='INCOME'>{TYPE_LABELS.INCOME}</TabsTrigger>
              <TabsTrigger value='EXPENSE'>{TYPE_LABELS.EXPENSE}</TabsTrigger>
              <TabsTrigger value='TRANSFER'>{TYPE_LABELS.TRANSFER}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={walletFilter} onValueChange={handleWalletFilter}>
            <SelectTrigger className='w-44'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All wallets</SelectItem>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='text-muted-foreground text-sm'>
            {debouncedSearch
              ? `No transactions matching "${debouncedSearch}".`
              : typeFilter === 'ALL'
                ? 'No transactions yet.'
                : `No ${TYPE_LABELS[typeFilter].toLowerCase()} transactions yet.`}
          </p>
          {!debouncedSearch && (
            <Button className='mt-4' onClick={() => setCreateOpen(true)}>
              Record your first transaction
            </Button>
          )}
        </div>
      )}

      {/* Transaction list */}
      <div className={`space-y-2 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className='flex items-center gap-4 rounded-lg border bg-white px-4 py-3'
          >
            {/* Category icon */}
            <div
              className='flex size-9 shrink-0 items-center justify-center rounded-full text-base'
              style={{ backgroundColor: tx.category?.color ?? '#e2e8f0', }}
            >
              {tx.category?.icon ?? tx.category?.name.charAt(0).toUpperCase() ?? '?'}
            </div>

            {/* Details */}
            <div className='flex-1 overflow-hidden'>
              <p className='truncate font-medium'>
                {tx.description ?? tx.category?.name ?? 'Uncategorized'}
              </p>
              <p className='text-muted-foreground text-xs'>
                {tx.wallet.name} · {formatDate(tx.date)}
              </p>
            </div>

            {/* Amount */}
            <span className={`shrink-0 font-semibold ${AMOUNT_COLORS[tx.type as TransactionType]}`}>
              {AMOUNT_PREFIX[tx.type as TransactionType]}
              {tx.amount.toFixed(2)}
            </span>

            {/* Actions */}
            <div className='flex shrink-0 gap-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setEditTransaction(tx as Transaction)}
              >
                Edit
              </Button>
              <Button
                className='text-destructive hover:text-destructive'
                size='sm'
                variant='ghost'
                onClick={() => setDeleteTransaction(tx as Transaction)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className='mt-4 flex items-center justify-between'>
          <p className='text-muted-foreground text-sm'>{total} transactions total</p>
          <div className='flex items-center gap-2'>
            <Button
              disabled={page <= 1 || isFetching}
              size='sm'
              variant='outline'
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className='text-muted-foreground text-sm'>
              Page {page} of {pageCount}
            </span>
            <Button
              disabled={page >= pageCount || isFetching}
              size='sm'
              variant='outline'
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            categories={categories}
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
      <Dialog
        open={!!editTransaction}
        onOpenChange={(open) => { if (!open) setEditTransaction(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editTransaction && (
            <TransactionForm
              categories={categories}
              defaultValues={{
                amount: editTransaction.amount,
                categoryId: editTransaction.category?.id,
                date: new Date(editTransaction.date).toISOString().split('T')[0] ?? '',
                description: editTransaction.description ?? '',
                type: editTransaction.type,
                walletId: editTransaction.wallet.id,
              }}
              isPending={update.isPending}
              submitLabel='Save changes'
              wallets={wallets}
              onCancel={() => setEditTransaction(null)}
              onSubmit={(values) => update.mutate({ id: editTransaction.id, ...values, })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTransaction}
        onOpenChange={(open) => { if (!open) setDeleteTransaction(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the transaction and reverse its effect on the wallet balance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => deleteTransaction && remove.mutate({ id: deleteTransaction.id, })}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
