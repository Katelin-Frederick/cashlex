'use client'

import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Tag,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, } from 'next/navigation'

import { signOutAction, } from '~/server/actions/auth'

const NAV_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', },
  { href: '/dashboard/wallets', icon: Wallet, label: 'Wallets', },
  { href: '/dashboard/categories', icon: Tag, label: 'Categories', },
  { href: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions', },
  { href: '/dashboard/budgets', icon: PiggyBank, label: 'Budgets', },
]

type Props = { userLabel: string }

export const Nav = ({ userLabel, }: Props) => {
  const pathname = usePathname()

  return (
    <aside className='flex h-screen w-56 shrink-0 flex-col border-r bg-white'>
      {/* Logo */}
      <div className='flex h-16 items-center border-b px-5'>
        <span className='text-xl font-bold tracking-tight'>Cashlex</span>
      </div>

      {/* Nav links */}
      <nav className='flex-1 overflow-y-auto px-3 py-4'>
        <ul className='space-y-1'>
          {NAV_LINKS.map(({ href, icon: Icon, label, }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
        <p className='truncate px-3 text-xs text-slate-500'>{userLabel}</p>
        <form action={signOutAction}>
          <button
            type='submit'
            className='flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900'
          >
            <LogOut className='size-4 shrink-0' />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
