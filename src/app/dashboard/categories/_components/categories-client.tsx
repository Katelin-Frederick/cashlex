'use client'

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
import { TabsTrigger, TabsList, Tabs, } from '~/components/ui/tabs'
import { Button, } from '~/components/ui/button'
import { api, } from '~/trpc/react'

import type { TransactionType, } from '../_lib/constants'

import { TYPE_COLORS, TYPE_LABELS, } from '../_lib/constants'
import { CategoryForm, } from './category-form'

// ── Types ─────────────────────────────────────────────────────────────

type Filter = 'ALL' | TransactionType

type Category = {
  id: string
  name: string
  type: TransactionType
  icon: string | null
  color: string | null
  _count: { transactions: number }
}

// ── Main client component ─────────────────────────────────────────────

export const CategoriesClient = () => {
  const utils = api.useUtils()

  const { data: categories = [], isLoading, } = api.category.list.useQuery()

  const [filter, setFilter] = useState<Filter>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)

  const invalidate = () => utils.category.list.invalidate()

  const create = api.category.create.useMutation({onSuccess: () => { setCreateOpen(false); void invalidate() },})

  const update = api.category.update.useMutation({onSuccess: () => { setEditCategory(null); void invalidate() },})

  const remove = api.category.delete.useMutation({onSuccess: () => { setDeleteCategory(null); void invalidate() },})

  const filtered = filter === 'ALL'
    ? categories
    : categories.filter((c) => c.type === filter)

  if (isLoading) {
    return (
      <div className='flex min-h-100 items-center justify-center'>
        <p className='text-muted-foreground'>Loading categories…</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-3xl px-6 py-10'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Categories</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Organise your transactions by category
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Add category</Button>
      </div>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        className='mb-6'
      >
        <TabsList>
          <TabsTrigger value='ALL'>All</TabsTrigger>
          <TabsTrigger value='INCOME'>{TYPE_LABELS.INCOME}</TabsTrigger>
          <TabsTrigger value='EXPENSE'>{TYPE_LABELS.EXPENSE}</TabsTrigger>
          <TabsTrigger value='TRANSFER'>{TYPE_LABELS.TRANSFER}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='text-muted-foreground text-sm'>
            {filter === 'ALL' ? 'No categories yet.' : `No ${TYPE_LABELS[filter].toLowerCase()} categories yet.`}
          </p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            Create your first category
          </Button>
        </div>
      )}

      {/* Category list */}
      <div className='space-y-2'>
        {filtered.map((category) => (
          <div
            key={category.id}
            className='flex items-center gap-4 rounded-lg border bg-white px-4 py-3'
          >
            <div
              className='flex size-9 shrink-0 items-center justify-center rounded-full text-base'
              style={{ backgroundColor: category.color ?? '#e2e8f0', }}
            >
              {category.icon ?? category.name.charAt(0).toUpperCase()}
            </div>

            <div className='flex-1'>
              <p className='font-medium'>{category.name}</p>
              <p className='text-muted-foreground text-xs'>
                {category._count.transactions} transaction{category._count.transactions !== 1 ? 's' : ''}
              </p>
            </div>

            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[category.type as TransactionType]}`}>
              {TYPE_LABELS[category.type as TransactionType]}
            </span>

            <div className='flex gap-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setEditCategory(category as Category)}
              >
                Edit
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='text-destructive hover:text-destructive'
                onClick={() => setDeleteCategory(category as Category)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            defaultValues={{
              name: '', type: 'EXPENSE', icon: '', color: '', 
            }}
            isPending={create.isPending}
            submitLabel='Create'
            onCancel={() => setCreateOpen(false)}
            onSubmit={(values) => create.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCategory} onOpenChange={(open) => { if (!open) setEditCategory(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <CategoryForm
              defaultValues={{
                name: editCategory.name,
                type: editCategory.type,
                icon: editCategory.icon ?? '',
                color: editCategory.color ?? '',
              }}
              isPending={update.isPending}
              submitLabel='Save changes'
              onCancel={() => setEditCategory(null)}
              onSubmit={(values) => update.mutate({ id: editCategory.id, ...values, })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => { if (!open) setDeleteCategory(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteCategory?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category. Transactions linked to it will lose their category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => deleteCategory && remove.mutate({ id: deleteCategory.id, })}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
