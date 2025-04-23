'use client'

import { ChevronDown, ChevronUp, Menu, X, } from 'lucide-react'
import { AnimatePresence, motion, } from 'framer-motion'
import { useSession, signOut, } from 'next-auth/react'
import { usePathname, } from 'next/navigation'
import { useState, } from 'react'
import Link from 'next/link'

import { cn, } from '~/lib/utils'

import { Button, } from '../ui/button'

const Navbar = () => {
  const { status, } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const toggleDropdown = () => setIsDropdownVisible((prev) => !prev)
  const closeAllMenus = () => {
    setIsDropdownVisible(false)
    setIsMenuOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getLinkClasses = (href: string, baseClasses: string, activeClasses: string) => cn(baseClasses, pathname === href && activeClasses)

  const menuLinks = [
    { href: '/dashboard', label: 'Dashboard', },
    { href: '/transactions', label: 'Transactions', },
    { href: '/budgets', label: 'Budgets', },
    { href: '/reports', label: 'Reports', },
    { href: '/recurring', label: 'Recurring', }
  ]

  return (
    <header className='bg-gray-800 shadow-lg sticky top-0 w-full z-50 border-b-5 border-green-500'>
      <nav className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between container mx-auto'>
        <Link href='/' className='text-2xl font-bold text-white hover:text-green-600'>
          Cashlex
        </Link>

        {/* Desktop Nav */}
        <div className='hidden md:flex space-x-8 text-lg items-center relative'>
          {status === 'authenticated' && (
            <div className='relative'>
              <button
                onClick={toggleDropdown}
                className='flex items-center text-white hover:text-green-600 transition'
              >
                My Finances
                {isDropdownVisible ? (
                  <ChevronUp className='ml-1 h-5 w-5' />
                ) : (
                  <ChevronDown className='ml-1 h-5 w-5' />
                )}
              </button>

              <AnimatePresence>
                {isDropdownVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, }}
                    animate={{ opacity: 1, y: 0, }}
                    exit={{ opacity: 0, y: -10, }}
                    transition={{ duration: 0.4, }}
                    className='absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50'
                  >
                    {menuLinks.map(({ href, label, }, idx) => (
                      <Link
                        key={idx}
                        href={href}
                        onClick={closeAllMenus}
                        className={getLinkClasses(
                          href,
                          'block px-4 py-2 text-white hover:bg-green-700 transition',
                          'bg-green-700'
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className='flex items-center space-x-4'>
          {status === 'authenticated' ? (
            <Button variant='green' size='sm' onClick={handleSignOut}>
              Logout
            </Button>
          ) : (
            <>
              <Link href='/sign-up'>
                <Button variant='secondary' size='sm'>
                  Sign Up
                </Button>
              </Link>
              <Link href='/login'>
                <Button variant='green' size='sm'>
                  Login
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger */}
          {status === 'authenticated' && (
            <div className='md:hidden'>
              <button onClick={toggleMenu} className='text-white' aria-label='Toggle Menu'>
                <Menu size={28} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, }}
            animate={{ opacity: 1, y: 0, }}
            exit={{ opacity: 0, y: -10, }}
            transition={{ duration: 0.4, }}
            className='fixed inset-0 bg-gray-800 bg-opacity-95 z-40 flex flex-col items-center justify-center space-y-6 text-white text-xl md:hidden'
          >
            <button
              onClick={toggleMenu}
              className='absolute top-6 right-6 text-white hover:text-green-500'
              aria-label='Close Menu'
            >
              <X size={32} />
            </button>

            {menuLinks.map(({ href, label, }, idx) => (
              <Link
                key={idx}
                href={href}
                onClick={closeAllMenus}
                className={getLinkClasses(
                  href,
                  'hover:text-green-500 transition',
                  'text-green-500 underline'
                )}
              >
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
