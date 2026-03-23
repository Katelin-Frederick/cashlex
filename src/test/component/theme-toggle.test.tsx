import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSetTheme = vi.fn()
let mockResolvedTheme = 'light'

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme, setTheme: mockSetTheme }),
}))

import { ThemeToggle } from '~/components/theme-toggle'

beforeEach(() => {
  mockSetTheme.mockClear()
  mockResolvedTheme = 'light'
})

describe('ThemeToggle — light mode', () => {
  it('renders a button with aria-label', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('shows "Dark mode" label', () => {
    render(<ThemeToggle />)
    expect(screen.getByText('Dark mode')).toBeInTheDocument()
  })

  it('calls setTheme with "dark" when clicked', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})

describe('ThemeToggle — dark mode', () => {
  beforeEach(() => { mockResolvedTheme = 'dark' })

  it('shows "Light mode" label', () => {
    render(<ThemeToggle />)
    expect(screen.getByText('Light mode')).toBeInTheDocument()
  })

  it('calls setTheme with "light" when clicked', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })
})
