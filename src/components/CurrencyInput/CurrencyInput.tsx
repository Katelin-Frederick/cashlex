'use client'

import { X, } from 'lucide-react'
import * as React from 'react'

import { Input, } from '~/components/ui/input'
import { cn, } from '~/lib/utils'

type CurrencyInputProps = {
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
} & React.InputHTMLAttributes<HTMLInputElement>

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({
    className, value = '', onChange, onBlur, ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      setDisplayValue(value)
    }, [value])

    const formatCurrency = (val: string) => {
      const num = Number(val.replace(/[^0-9.]/g, ''))
      if (isNaN(num)) return ''
      return num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '')
      setDisplayValue(raw)

      onChange?.({
        ...e,
        target: {
          ...e.target,
          value: raw,
        },
      })
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(displayValue)
      setDisplayValue(formatted)

      onBlur?.({
        ...e,
        target: {
          ...e.target,
          value: displayValue,
        },
      })
    }

    const handleClear = () => {
      setDisplayValue('')

      if (inputRef.current) {
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set?.call(inputRef.current, '')

        const event = new Event('input', { bubbles: true, })
        inputRef.current.dispatchEvent(event)
      }
    }

    return (
      <div className='relative w-full'>
        <Input
          {...props}
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
            }
          }}
          inputMode='decimal'
          className={cn('pr-10', className)}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder='$0.00'
        />

        {displayValue && (
          <button
            type='button'
            onClick={handleClear}
            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 p-1'
            aria-label='Clear'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
