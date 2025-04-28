'use client'

import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import React, { useEffect, } from 'react'

import { api, } from '~/trpc/react'

import ExpensesSummary from './_ExpensesSummary/ExpensesSummary'
import IncomeSummary from './_IncomeSummary/IncomeSummary'


const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const { data: transactionSummary, isLoading, error, } = api.transactions.getSummary.useQuery()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const totalIncome = transactionSummary ? transactionSummary.netTotal : 0
  const allIncome = transactionSummary ? transactionSummary.income : 0
  const allExpenses = transactionSummary ? transactionSummary.expense : 0

  if (isLoading) {
    return <p>Loading total income...</p>
  }

  if (error) {
    return <p>Error loading total income: {error.message}</p>
  }

  return (
    <div>
      {session ? (
        <div>
          <p>Welcome, {session.user?.name}!</p>

          <div>
            <p>Total Income: ${totalIncome}</p>
            <p>All Income: ${allIncome}</p>
            <p>All Expenses: ${allExpenses}</p>
          </div>

          <ExpensesSummary />
          <IncomeSummary />
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
