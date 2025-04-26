'use client'

import { useSession, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useEffect, } from 'react'

import { api, } from '~/trpc/react'

import BudgetForm from './BudgetForm'
import BudgetCard from './BudgetCard'

const BudgetsPage = () => {
  const { status, } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const query = api.budget.getAll.useQuery(undefined, {
    enabled: status === 'authenticated',
    staleTime: 0, // always consider cache stale to trigger fresh fetch
  })

  const { data: budgets = [], isLoading, } = query

  useEffect(() => {
    if (status === 'authenticated') {
      void query.refetch()
    }
  }, [status])

  if (status === 'loading') return <div>Loading session...</div>

  return (
    <div className='flex flex-col items-center my-12'>
      <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl'>
        <h1 className='text-2xl font-bold text-center mb-6'>Create a Budget</h1>
        <BudgetForm />
      </div>

      {isLoading && <p className='mt-12'>Loading budgets...</p>}
      {!isLoading && budgets.length === 0 && (
        <p className='mt-12'>No budgets yet. Add one to get started!</p>
      )}

      {!isLoading && budgets.length > 0 && (
        <div className='mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BudgetsPage
