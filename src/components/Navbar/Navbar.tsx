'use client'

import { ChevronDown, ChevronUp, Menu, X, } from 'lucide-react'
import { useSession, signOut, } from 'next-auth/react'
import { useState, } from 'react'
import Link from 'next/link'

import { Button, } from '../ui/button'

const Navbar = () => {
  const { status, } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const toggleDropdown = () => setIsDropdownVisible((prev) => !prev)
  const closeDropdown = () => setIsDropdownVisible(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className='bg-gray-800 shadow-lg sticky top-0 w-full z-50 border-b-5 border-green-500'>
      <nav className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
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

              {isDropdownVisible && (
                <div className='absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50'>
                  <Link
                    href='/dashboard'
                    onClick={closeDropdown}
                    className='block px-4 py-2 text-white hover:bg-green-700 transition rounded-t-md'
                  >
                    Dashboard
                  </Link>

                  <Link
                    href='/transactions'
                    onClick={closeDropdown}
                    className='block px-4 py-2 text-white hover:bg-green-700 transition'
                  >
                    Transactions
                  </Link>

                  <Link
                    href='/budgets'
                    onClick={closeDropdown}
                    className='block px-4 py-2 text-white hover:bg-green-700 transition'
                  >
                    Budgets
                  </Link>

                  <Link
                    href='/reports'
                    onClick={closeDropdown}
                    className='block px-4 py-2 text-white hover:bg-green-700 transition'
                  >
                    Reports
                  </Link>

                  <Link
                    href='/recurring'
                    onClick={closeDropdown}
                    className='block px-4 py-2 text-white hover:bg-green-700 transition rounded-b-md'
                  >
                    Recurring
                  </Link>
                </div>
              )}
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
                <Button variant='secondary' size='sm'>Sign Up</Button>
              </Link>
              <Link href='/login'>
                <Button variant='green' size='sm'>Login</Button>
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
      {isMenuOpen && (
        <div className='fixed inset-0 bg-gray-800 bg-opacity-95 z-40 flex flex-col items-center justify-center space-y-6 text-white text-xl md:hidden'>
          <button
            onClick={toggleMenu}
            className='absolute top-6 right-6 text-white hover:text-green-500'
            aria-label='Close Menu'
          >
            <X size={32} />
          </button>

          {status === 'authenticated' && (
            <>
              <Link
                href='/dashboard'
                onClick={closeDropdown}
                className='hover:text-green-500 transition'
              >
                Dashboard
              </Link>

              <Link
                href='/transactions'
                onClick={closeDropdown}
                className='hover:text-green-500 transition'
              >
                Transactions
              </Link>

              <Link
                href='/budgets'
                onClick={closeDropdown}
                className='hover:text-green-500 transition'
              >
                Budgets
              </Link>

              <Link
                href='/reports'
                onClick={closeDropdown}
                className='hover:text-green-500 transition'
              >
                Reports
              </Link>

              <Link
                href='/recurring'
                onClick={closeDropdown}
                className='hover:text-green-500 transition'
              >
                Recurring
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar
