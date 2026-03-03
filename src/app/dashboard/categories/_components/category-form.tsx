'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useWatch, useForm, } from 'react-hook-form'
import { z, } from 'zod'

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
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'

import { PRESET_COLORS, } from '../_lib/constants'

// ── Schema ────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  icon: z.string().max(2).optional(),
  color: z.string().optional(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// ── Component ─────────────────────────────────────────────────────────

type CategoryFormProps = {
  defaultValues: CategoryFormValues
  onSubmit: (values: CategoryFormValues) => void
  isPending: boolean
  submitLabel: string
  onCancel: () => void
}

export const CategoryForm = ({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
  onCancel,
}: CategoryFormProps) => {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  })

  const selectedColor = useWatch({ control: form.control, name: 'color', })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Groceries' {...field} />
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
                  <SelectItem value='INCOME'>Income</SelectItem>
                  <SelectItem value='EXPENSE'>Expense</SelectItem>
                  <SelectItem value='TRANSFER'>Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='icon'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Icon <span className='text-muted-foreground font-normal'>(optional emoji)</span></FormLabel>
              <FormControl>
                <Input
                  placeholder='🛒'
                  maxLength={2}
                  className='w-20 text-center text-lg'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='color'
          render={({ field, }) => (
            <FormItem>
              <FormLabel>Color <span className='text-muted-foreground font-normal'>(optional)</span></FormLabel>
              <FormControl>
                <div className='flex flex-wrap gap-2'>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type='button'
                      onClick={() => field.onChange(color)}
                      className='size-7 rounded-full transition-transform hover:scale-110 focus:outline-none'
                      style={{ backgroundColor: color, }}
                      aria-label={color}
                    >
                      {selectedColor === color && (
                        <span className='flex items-center justify-center text-xs text-white'>✓</span>
                      )}
                    </button>
                  ))}
                  {selectedColor && (
                    <button
                      type='button'
                      onClick={() => field.onChange(undefined)}
                      className='text-muted-foreground text-xs underline'
                    >
                      Clear
                    </button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
