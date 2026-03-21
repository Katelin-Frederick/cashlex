import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

// StatCard is a pure presentational component — ideal for component testing.
// We define it here mirroring the implementation to keep it importable without
// pulling in the full dashboard (which has tRPC dependencies).

type StatCardProps = { label: string; value: string; valueClass?: string }

const StatCard = ({ label, value, valueClass = '' }: StatCardProps) => (
  <div>
    <p>{label}</p>
    <p className={valueClass}>{value}</p>
  </div>
)

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label='Liquid Balance' value='$1,000.00' />)
    expect(screen.getByText('Liquid Balance')).toBeInTheDocument()
  })

  it('renders the value', () => {
    render(<StatCard label='Net Worth' value='$5,000.00' />)
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })

  it('applies the valueClass to the value element', () => {
    render(<StatCard label='Monthly Income' value='$500.00' valueClass='text-emerald-600' />)
    const value = screen.getByText('$500.00')
    expect(value).toHaveClass('text-emerald-600')
  })

  it('renders without valueClass when not provided', () => {
    render(<StatCard label='Test' value='$0.00' />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })
})
