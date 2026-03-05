'use client'

import { keepPreviousData, } from '@tanstack/react-query'
import { zodResolver, } from '@hookform/resolvers/zod'
import { useForm, } from 'react-hook-form'
import { useState, } from 'react'
import { z, } from 'zod'

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
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
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
import { CardContent, CardHeader, CardTitle, Card, } from '~/components/ui/card'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'

// ── Constants ────────────────────────────────────────────────────────

const WALLET_TYPES = ['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'INVESTMENT'] as const
type WalletType = typeof WALLET_TYPES[number]

const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT: 'Credit Card',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
}

const WALLET_TYPE_COLORS: Record<WalletType, string> = {
  CHECKING: 'bg-blue-100 text-blue-700',
  SAVINGS: 'bg-emerald-100 text-emerald-700',
  CREDIT: 'bg-rose-100 text-rose-700',
  CASH: 'bg-amber-100 text-amber-700',
  INVESTMENT: 'bg-violet-100 text-violet-700',
}

const PAGE_SIZE = 9 // 3-column grid looks best with multiples of 3

// ── Zod schema ───────────────────────────────────────────────────────

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'INVESTMENT']),
  balance: z.coerce.number(),
})

type WalletFormValues = z.infer<typeof walletSchema>

// ── Wallet form (shared by create + edit dialogs) ────────────────────

type WalletFormProps = {
  defaultValues: WalletFormValues
  onSubmit: (values: WalletFormValues) => void
  isPending: boolean
  submitLabel: string
  onCancel: () => void
  showBalance: boolean
}

const WalletForm = ({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
  onCancel,
  showBalance,
}: WalletFormProps) => {
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Wallet name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Chase Checking' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='type'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WALLET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {WALLET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showBalance && (
          <FormField
            control={form.control}
            name='balance'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Starting balance</FormLabel>
                <FormControl>
                  <Input
                    inputMode='decimal'
                    placeholder='0.00'
                    {...field}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = raw.split('.')
                      const sanitized = parts.length > 2
                        ? `${parts[0]}.${parts.slice(1).join('')}`
                        : raw
                      field.onChange(sanitized)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// ── Main client component ────────────────────────────────────────────

type Wallet = {
  id: string
  name: string
  type: WalletType
  balance: number
  currency: string
  _count: { transactions: number }
}

export const WalletsClient = () => {
  const utils = api.useUtils()

  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editWallet, setEditWallet] = useState<Wallet | null>(null)
  const [deleteWallet, setDeleteWallet] = useState<Wallet | null>(null)

  const { data, isLoading, isFetching, } = api.wallet.listPaginated.useQuery(
    { page, pageSize: PAGE_SIZE, },
    { placeholderData: keepPreviousData, }
  )

  const wallets = data?.items ?? []
  const pageCount = data?.pageCount ?? 1
  const total = data?.total ?? 0

  const invalidate = async () => {
    await Promise.all([
      utils.wallet.listPaginated.invalidate(),
      utils.wallet.list.invalidate()
    ])
  }

  const create = api.wallet.create.useMutation({onSuccess: () => { setCreateOpen(false); void invalidate() },})
  const update = api.wallet.update.useMutation({onSuccess: () => { setEditWallet(null); void invalidate() },})
  const remove = api.wallet.delete.useMutation({onSuccess: () => { setDeleteWallet(null); void invalidate() },})

  const formatBalance = (balance: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, }).format(balance)

  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <p className='text-muted-foreground'>Loading wallets…</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-5xl px-6 py-10'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Wallets</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Manage your accounts and track balances
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Add wallet</Button>
      </div>

      {/* Empty state */}
      {wallets.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='text-muted-foreground text-sm'>No wallets yet.</p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            Create your first wallet
          </Button>
        </div>
      )}

      {/* Wallet grid */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader className='pb-2'>
              <div className='flex items-start justify-between'>
                <CardTitle className='text-base'>{wallet.name}</CardTitle>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${WALLET_TYPE_COLORS[wallet.type as WalletType]}`}>
                  {WALLET_TYPE_LABELS[wallet.type as WalletType]}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>
                {formatBalance(wallet.balance, wallet.currency)}
              </p>
              <p className='text-muted-foreground mt-1 text-xs'>
                {wallet._count.transactions} transaction{wallet._count.transactions !== 1 ? 's' : ''}
              </p>
              <div className='mt-4 flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='flex-1'
                  onClick={() => setEditWallet(wallet as Wallet)}
                >
                  Edit
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  className='flex-1'
                  onClick={() => setDeleteWallet(wallet as Wallet)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className='mt-6 flex items-center justify-between'>
          <p className='text-muted-foreground text-sm'>{total} wallets total</p>
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
            <DialogTitle>Add wallet</DialogTitle>
          </DialogHeader>
          <WalletForm
            showBalance
            defaultValues={{ name: '', type: 'CHECKING', balance: 0, }}
            isPending={create.isPending}
            submitLabel='Create'
            onCancel={() => setCreateOpen(false)}
            onSubmit={(values) => create.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editWallet} onOpenChange={(open) => { if (!open) setEditWallet(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit wallet</DialogTitle>
          </DialogHeader>
          {editWallet && (
            <WalletForm
              showBalance={false}
              defaultValues={{
                name: editWallet.name,
                type: editWallet.type,
                balance: editWallet.balance,
              }}
              isPending={update.isPending}
              submitLabel='Save changes'
              onCancel={() => setEditWallet(null)}
              onSubmit={(values) => update.mutate({ id: editWallet.id, ...values, })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteWallet} onOpenChange={(open) => { if (!open) setDeleteWallet(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteWallet?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the wallet and all its transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => deleteWallet && remove.mutate({ id: deleteWallet.id, })}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
