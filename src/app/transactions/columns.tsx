import type { ColumnDef, } from '@tanstack/react-table'

import { MoreHorizontal, ChevronDown, } from 'lucide-react'
import { format, } from 'date-fns'

import type { api, } from '~/trpc/react'

import { DropdownMenuSeparator, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem, DropdownMenu, } from '~/components/ui/dropdown-menu'
import { Checkbox, } from '~/components/ui/checkbox'
import { Button, } from '~/components/ui/button'
import { cn, } from '~/lib/utils'

import type { Transaction, } from './Transactions'

type Budgets = {
  amount: number;
  spent: number;
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date | null;
}[]

type DeleteTransactionMutation = ReturnType<typeof api.transactions.delete.useMutation>

export const getColumns = (budgets: Budgets, deleteTransaction: DeleteTransactionMutation): ColumnDef<Transaction>[] => ([
  {
    id: 'select',
    header: ({ table, }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
          || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row, }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'paymentName',
    header: ({ column, }) => (
      <button
        className='flex items-center space-x-2'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>Payment Name</span>
        {column.getIsSorted() === 'asc' && <ChevronDown className='h-4 w-4 rotate-180' />}
        {column.getIsSorted() === 'desc' && <ChevronDown className='h-4 w-4' />}
      </button>
    ),
    cell: ({ row, }) => <div className='capitalize'>{row.getValue('paymentName')}</div>,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'paymentType',
    header: ({ column, }) => (
      <button
        className='flex items-center space-x-2'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>Payment Type</span>
        {column.getIsSorted() === 'asc' && <ChevronDown className='h-4 w-4 rotate-180' />}
        {column.getIsSorted() === 'desc' && <ChevronDown className='h-4 w-4' />}
      </button>
    ),
    cell: ({ row, }) => <div className='capitalize'>{row.getValue('paymentType')}</div>,
    enableSorting: true,
  },
  {
    accessorKey: 'amount',
    header: ({ column, }) => (
      <button
        className='flex items-center space-x-2'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>Amount</span>
        {column.getIsSorted() === 'asc' && <ChevronDown className='h-4 w-4 rotate-180' />}
        {column.getIsSorted() === 'desc' && <ChevronDown className='h-4 w-4' />}
      </button>
    ),
    cell: ({ row, }) => {
      const amount = parseFloat(row.getValue('amount'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

      return (
        <div
          className={cn('text-left font-medium', row.getValue('paymentType') === 'income' ? 'text-green-800' : 'text-red-300')}
        >
          {`${row.getValue('paymentType') === 'expense' ? '-' : ''}${formatted}`}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'paidDate',
    header: ({ column, }) => (
      <button
        className='flex items-center space-x-2'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>Paid Date</span>
        {column.getIsSorted() === 'asc' && <ChevronDown className='h-4 w-4 rotate-180' />}
        {column.getIsSorted() === 'desc' && <ChevronDown className='h-4 w-4' />}
      </button>
    ),
    cell: ({ row, }) => {
      const formattedDate = format(new Date(row.getValue('paidDate')), 'MM-dd-yyyy')
      return <div className='text-left font-medium'>{formattedDate}</div>
    },
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: ({ column, }) => (
      <button
        className='flex items-center space-x-2'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>Category</span>
        {column.getIsSorted() === 'asc' && <ChevronDown className='h-4 w-4 rotate-180' />}
        {column.getIsSorted() === 'desc' && <ChevronDown className='h-4 w-4' />}
      </button>
    ),
    cell: ({ row, }) => <div className='capitalize text-left'>{row.getValue('category')}</div>,
    enableSorting: true,
  },
  {
    accessorKey: 'budgetId',
    header: ({ column, }) => (
      <button
        className='flex items-center space-x-2'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>Budget</span>
        {column.getIsSorted() === 'asc' && <ChevronDown className='h-4 w-4 rotate-180' />}
        {column.getIsSorted() === 'desc' && <ChevronDown className='h-4 w-4' />}
      </button>
    ),
    cell: ({ row, }) => {
      const budgetId = row.getValue('budgetId')
      const budget = budgets.find((budget) => budget.id === budgetId)

      return <div className='capitalize text-left'>{budget ? budget.name : 'No Budget'}</div>
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row, }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.paymentName)}>
              Copy Payment Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this transaction?')) {
                  await deleteTransaction.mutateAsync({ id: payment.id, })
                }
              }}
            >
              Delete Transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableHiding: false,
  }
])