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
import { MoreHorizontal, CalendarIcon, ChevronDown, } from 'lucide-react'
import { zodResolver, } from '@hookform/resolvers/zod'
import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useEffect, useState, } from 'react'
import { useForm, } from 'react-hook-form'
import { format, } from 'date-fns'
import { z, } from 'zod'

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
import { SelectContent, SelectTrigger, SelectValue, SelectItem, Select, } from '~/components/ui/select'
import { FormControl, FormMessage, FormField, FormLabel, FormItem, Form, } from '~/components/ui/form'
import { PopoverContent, PopoverTrigger, Popover, } from '~/components/ui/popover'
import { CurrencyInput, } from '~/components/CurrencyInput/CurrencyInput'
import { RadioGroupItem, RadioGroup, } from '~/components/ui/radio-group'
import { Checkbox, } from '~/components/ui/checkbox'
import { Calendar, } from '~/components/ui/calendar'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'
import { cn, } from '~/lib/utils'

export type Transaction = {
  amount: number
  paymentName: string
  paymentType: 'income' | 'expense'
  paidDate: Date
  budget?: null | string
  category?: string
}

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
    cell: ({ row, }) => <div className='capitalize text-left'>{row.getValue('budget')}</div>,
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
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableHiding: false,
  }
]

const formSchema = z.object({
  paymentName: z.string().min(2, { message: 'Payment Name must be at least 2 characters.', }),
  paymentType: z.string().min(1, { message: 'Payment Type is required.', }),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.', })
    .refine((val) => parseFloat(val) > 0, { message: 'Amount must be positive.', }),
  paidDate: z.date({ required_error: 'Paid Date is required.', }),
  budget: z.string().optional().nullable(),
  category: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

const Transactions = () => {
  const { status, } = useSession()
  const router = useRouter()
  const { data: budgets = [], isLoading, } = api.budget.getAll.useQuery()

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      paymentName: '',
      paymentType: '',
      paidDate: new Date(),
      budget: null,
      category: '',
    },
  })

  const [sorting, setSorting] = useState<SortingState>([{ id: 'paidDate', desc: false, }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: transactions,
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

  const onSubmit = (values: FormSchema) => {
    const newTransaction: Transaction = {
      amount: parseFloat(values.amount),
      paymentName: values.paymentName,
      paymentType: values.paymentType as 'income' | 'expense',
      paidDate: values.paidDate,
      budget: values.budget ?? null,
      category: values.category,
    }

    setTransactions((prev) => [newTransaction, ...prev])
    form.reset()
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') return <div>Loading session...</div>

  return (
    <div className='flex flex-col items-center my-12'>
      <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl mb-12'>
        <h1 className='text-2xl font-bold text-center mb-6'>Add a Transaction</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4'>
            <FormField
              control={form.control}
              name='paymentName'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Payment Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Netflix' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='paymentType'
              render={({ field, }) => (
                <FormItem className='space-y-3'>
                  <FormLabel>Payment Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value='income' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          Income
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value='expense' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          Expense
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amount'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <CurrencyInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='paidDate'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Paid Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='budget'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a budget (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.name}>
                          {budget.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='category'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder='Entertainment, Utilities, etc.' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit'>Submit</Button>
          </form>
        </Form>
      </div>

      <div className='w-full'>
        <div className='flex items-center py-4'>
          <Input
            placeholder='Filter Payments...'
            value={(table.getColumn('paymentName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('paymentName')?.setFilterValue(event.target.value)
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
    </div>
  )
}

export default Transactions