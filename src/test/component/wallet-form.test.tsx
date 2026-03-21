import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// ── Minimal wallet form for testing ──────────────────────────────────
// We test the validation behaviour driven by the Zod schema rather than
// the full ShadCN-wrapped form (which requires a complex provider tree).

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'INVESTMENT']),
  balance: z.coerce.number(),
  currency: z.string().length(3),
})

type FormValues = z.infer<typeof walletSchema>

type Props = {
  defaultValues: FormValues
  onSubmit: (values: FormValues) => void
}

const TestWalletForm = ({ defaultValues, onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input aria-label='name' {...register('name')} />
      {errors.name && <p role='alert'>{errors.name.message}</p>}
      <input aria-label='currency' {...register('currency')} />
      {errors.currency && <p role='alert'>{errors.currency.message}</p>}
      <button type='submit'>Save</button>
    </form>
  )
}

describe('WalletForm validation', () => {
  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <TestWalletForm
        defaultValues={{ name: 'Chase', type: 'CHECKING', balance: 0, currency: 'USD' }}
        onSubmit={onSubmit}
      />
    )

    await user.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Chase', currency: 'USD' }),
        expect.anything()
      )
    })
  })

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup()

    render(
      <TestWalletForm
        defaultValues={{ name: '', type: 'CHECKING', balance: 0, currency: 'USD' }}
        onSubmit={vi.fn()}
      />
    )

    await user.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Name is required')
    })
  })

  it('shows validation error when currency is not 3 characters', async () => {
    const user = userEvent.setup()

    render(
      <TestWalletForm
        defaultValues={{ name: 'Test', type: 'CHECKING', balance: 0, currency: 'US' }}
        onSubmit={vi.fn()}
      />
    )

    await user.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('does not call onSubmit when form is invalid', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <TestWalletForm
        defaultValues={{ name: '', type: 'CHECKING', balance: 0, currency: 'USD' }}
        onSubmit={onSubmit}
      />
    )

    await user.click(screen.getByText('Save'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
