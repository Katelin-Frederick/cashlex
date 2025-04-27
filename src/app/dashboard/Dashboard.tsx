'use client'

import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import React, { useEffect, } from 'react'

import { api, } from '~/trpc/react'

const Dashboard = () => {
  const { data: session, status, } = useSession()
  const router = useRouter()

  const {
    data: totalIncomeData,
    isLoading,
    error,
  } = api.transactions.getTotalIncome.useQuery()
  const {
    data: allIncomeData,
    isLoading: isAllIncomeDataLoading,
    error: allIncomeDataError,
  } = api.transactions.getAllIncome.useQuery()
  const {
    data: allExpensesData,
    isLoading: isAllExpensesDataLoading,
    error: allExpensesDataError,
  } = api.transactions.getAllExpenses.useQuery()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const totalIncome = totalIncomeData ? totalIncomeData.totalIncome : 0
  const allIncome = allIncomeData ? allIncomeData.allIncome : 0
  const allExpenses = allExpensesData ? allExpensesData.allExpenses : 0

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
        </div>
      ) : (
        <p>You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  )
}

export default Dashboard
