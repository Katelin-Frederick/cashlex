'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { CircleIcon, } from 'lucide-react'
import * as React from 'react'

import { cn, } from '~/lib/utils'

const RadioGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) => (
  <RadioGroupPrimitive.Root
    data-slot='radio-group'
    className={cn('grid gap-3', className)}
    {...props}
  />
)

const RadioGroupItem = ({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) => (
  <RadioGroupPrimitive.Item
    data-slot='radio-group-item'
    className={cn(
      'border-input text-primary focus-visible:ring-green-800 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-5 shrink-0 rounded-full border-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      data-slot='radio-group-indicator'
      className='relative flex items-center justify-center'
    >
      <CircleIcon className='fill-green-800 absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2' />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
)

export { RadioGroup, RadioGroupItem, }
