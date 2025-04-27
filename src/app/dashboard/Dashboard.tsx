'use client'

import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import React, { useEffect, } from 'react'

import { api, } from '~/trpc/react'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const { data: totalIncomeData, isLoading, error, } = api.transactions.getTotalIncome.useQuery()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const totalIncome = totalIncomeData ? totalIncomeData.totalIncome : 0

  let content: React.ReactNode

  if (isLoading) {
    content = <p>Loading total income...</p>
  } else if (error) {
    content = <p>Error loading total income: {error.message}</p>
  } else {
    content = <p>Total Income: ${totalIncome}</p>
  }

  return (
    <div>
      {session ? (
        <div>
          <p>Welcome, {session.user?.name}!</p>
          <div>{content}</div>
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
