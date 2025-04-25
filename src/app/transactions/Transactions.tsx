'use client'


import {
  type ColumnFiltersState,
  getPaginationRowModel,
  type VisibilityState,
  getFilteredRowModel,
  type SortingState,
  getSortedRowModel,
  getCoreRowModel,
  type ColumnDef,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { MoreHorizontal, ChevronDown, } from 'lucide-react'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useEffect, useState, } from 'react'
import { format, } from 'date-fns'

import {
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenu,
} from '~/components/ui/dropdown-menu'
import {
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
} from '~/components/ui/table'
import { Checkbox, } from '~/components/ui/checkbox'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'

export type Transaction = {
  id: string
  amount: number
  paymentType: string
  paidDate: Date
  budget?: null | string
  category?: string
}

const data: Transaction[] = [
  {
    id: 'm5gr84i9',
    amount: 200,
    paymentType: 'Walmart',
    paidDate: new Date('4/1/2025'),
    budget: 'Groceries',
    category: 'Food',
  },
  {
    id: '3u1reuv4',
    amount: 1500,
    paymentType: 'Rent Payment',
    paidDate: new Date('4/21/2025'),
    budget: 'Rent',
    category: 'Housing',
  },
  {
    id: 'derv1ws0',
    amount: 78,
    paymentType: 'Water Bill',
    paidDate: new Date('4/11/2025'),
    budget: null,
    category: 'Utilities',
  },
  {
    id: '5kma53ae',
    amount: 55,
    paymentType: 'Electric Bill',
    paidDate: new Date('4/15/2025'),
    budget: null,
    category: 'Utilities',
  },
  {
    id: 'bhqecj4p',
    amount: 32,
    paymentType: 'Gas',
    paidDate: new Date('4/17/2025'),
    budget: null,
  }
]

export const columns: ColumnDef<Transaction>[] = [
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
    cell: ({ row, }) => (
      <div className='capitalize'>{row.getValue('paymentType')}</div>
    ),
    enableSorting: true,
    enableHiding: false,
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

      return <div className='text-left font-medium'>{formatted}</div>
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
      const formattedDate = format(row.getValue('paidDate'), 'MM-dd-yyyy')

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
    cell: ({ row, }) => (
      <div className='capitalize text-left'>{row.getValue('category')}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'budget',
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
    cell: ({ row, }) => (
      <div className='capitalize text-left'>{row.getValue('budget')}</div>
    ),
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableHiding: false,
  }
]

const Transactions = () => {
  const { status, } = useSession()
  const router = useRouter()

  const [sorting, setSorting] = useState<SortingState>([{ id: 'paidDate', desc: false, }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility]
    = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') return <div>Loading session...</div>

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder='Filter Payments...'
          value={(table.getColumn('paymentType')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('paymentType')?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className='capitalize'
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Transactions