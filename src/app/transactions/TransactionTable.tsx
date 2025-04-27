'use client'

import {
  type ColumnFiltersState,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { ChevronDown, } from 'lucide-react'
import { useState, } from 'react'

import { DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenu, } from '~/components/ui/dropdown-menu'
import {
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
} from '~/components/ui/table'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'

import { getColumns, } from './columns'

export type Transaction = {
  id: string
  userId: string
  paymentName: string
  paymentType: 'income' | 'expense'
  amount: number
  paidDate: Date
  budgetId: string | null
  category: string | null
  createdAt: Date | null
  budget?: string | null
}

type Budgets = {
  amount: number;
  spent: number;
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date | null;
}[]

const TransactionTable = ({
  data,
  budgets,
  deleteTransaction,
}: {
  data: Transaction[]
  budgets: Budgets
  deleteTransaction: ReturnType<typeof api.transactions.delete.useMutation>
}) => {
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])

  const utils = api.useUtils()

  const table = useReactTable({
    data,
    columns: getColumns(budgets, deleteTransaction),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    state: {
      columnVisibility,
      rowSelection,
      sorting,
      columnFilters: filters,
    },
  })


  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Input
          placeholder='Filter Payments...'
          value={(table.getColumn('paymentName')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('paymentName')?.setFilterValue(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='green'>
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={getColumns(budgets, deleteTransaction).length}>
                  No transactions found.
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
          <Button
            variant='destructive'
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete ${table.getFilteredSelectedRowModel().rows.length} transaction(s)?`
                )
              ) {
                const selectedRows = table.getFilteredSelectedRowModel().rows

                await Promise.all(
                  selectedRows.map((row) => deleteTransaction.mutateAsync({ id: row.original.id, })
                  )
                )

                await utils.transactions.getAll.invalidate()
                setRowSelection({})
              }
            }}
          >
            Delete Selected
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TransactionTable
