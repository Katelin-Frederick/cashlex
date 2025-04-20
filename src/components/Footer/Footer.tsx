'use client'

import { useSession, signOut, } from 'next-auth/react'
import Link from 'next/link'

import { Button, } from '../ui/button'

const Footer = () => {
  const { status, } = useSession()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <footer className='bg-gray-800 text-gray-300 py-10 border-t-5 border-green-500'>
      <div className='max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8'>

        <div>
          <Link href='/' className='text-2xl font-bold text-white mb-4 hover:text-green-300'>Cashlex</Link>
          <p className='text-gray-400'>Smart finances start here.</p>
        </div>

        <div className='flex flex-col space-y-2'>
          <Link href='/' className='hover:text-green-300'>Home</Link>
          {status === 'authenticated' ? (
            <Button
              variant='link'
              size='sm'
              onClick={handleSignOut}
              className='max-w-max p-0 text-md text-gray-300 hover:text-green-300 hover:no-underline'
            >
              Logout
            </Button>
          ) : (
            <>
              <Link href='/login' className='hover:text-green-300'>Login</Link>
              <Link href='/sign-up' className='hover:text-green-300'>Sign Up</Link>
            </>
          )}
        </div>

        <div className='flex flex-col space-y-2'>
          <a
            href='https://twitter.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-green-300'
          >
            Twitter
          </a>

          <a
            href='https://instagram.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-green-300'
          >
            Instagram
          </a>
        </div>
      </div>

      <div className='mt-8 text-center text-gray-500 text-sm'>
        <a
          className='hover:text-green-300 hover:underline'
          href='https://storyset.com/business'
        >
          Cashlex illustrations by Storyset
        </a>
      </div>
    </footer>
  )
}

export default Footer
