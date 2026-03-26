'use client'

import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCcw,
  BarChart2,
  Lightbulb,
  PiggyBank,
  Target,
  CreditCard,
  Settings,
  LogOut,
  Wallet,
  Tag,
} from 'lucide-react'
import { usePathname, } from 'next/navigation'
import Link from 'next/link'

import { signOutAction, } from '~/server/actions/auth'
import { ThemeToggle, } from '~/components/theme-toggle'

const NAV_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', },
  { href: '/dashboard/wallets', icon: Wallet, label: 'Wallets', },
  { href: '/dashboard/categories', icon: Tag, label: 'Categories', },
  { href: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions', },
  { href: '/dashboard/budgets', icon: PiggyBank, label: 'Budgets', },
  { href: '/dashboard/recurring', icon: RefreshCcw, label: 'Recurring', },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Reports', },
  { href: '/dashboard/insights', icon: Lightbulb, label: 'Insights', },
  { href: '/dashboard/goals', icon: Target, label: 'Goals', },
  { href: '/dashboard/debt', icon: CreditCard, label: 'Debt', },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', }
]

type Props = { userLabel: string }

export const Nav = ({ userLabel, }: Props) => {
  const pathname = usePathname()

  return (
    <aside className='flex h-screen w-56 shrink-0 flex-col border-r bg-card print:hidden'>
      {/* Logo */}
      <div className='flex h-16 items-center border-b px-5'>
        <span className='text-xl font-bold tracking-tight'>Cashlex</span>
      </div>

      {/* Nav links */}
      <nav className='flex-1 overflow-y-auto px-3 py-4'>
        <ul className='space-y-1'>
          {NAV_LINKS.map(({ href, icon: Icon, label, }) => {
            const isActive
              = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <Icon className='size-4 shrink-0' />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User + sign out */}
      <div className='border-t px-3 py-4 space-y-1'>
        <p className='truncate px-3 text-xs text-muted-foreground'>{userLabel}</p>
        <ThemeToggle />
        <form action={signOutAction}>
          <button
            type='submit'
            className='flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
          >
            <LogOut className='size-4 shrink-0' />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
