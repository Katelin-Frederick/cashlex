'use client'

import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import React, { useEffect, } from 'react'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div>
      {session ? (
        <p>Welcome, {session.user?.name}!</p>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
