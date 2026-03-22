'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className='flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
      aria-label='Toggle theme'
    >
      {resolvedTheme === 'dark' ? <Sun className='size-4 shrink-0' /> : <Moon className='size-4 shrink-0' />}
      {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
