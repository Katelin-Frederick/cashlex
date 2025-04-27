'use client'

import { api, } from '~/trpc/react'

import TransactionTable from './TransactionTable'
import TransactionForm from './TransactionForm'

const TransactionsPage = () => {
  const utils = api.useUtils()

  const { data: transactions = [], isLoading, } = api.transactions.getAll.useQuery()
  const { data: budgets = [], } = api.budget.getAll.useQuery()

  const deleteTransaction = api.transactions.delete.useMutation({
    onSuccess: async () => {
      await utils.transactions.getAll.invalidate()
    },
  })

  return (
    <div className='flex flex-col items-center my-12'>
      <div className='flex flex-col items-center'>
        <h2 className='text-2xl font-semibold mb-4'>Add New Transaction</h2>
        <TransactionForm onSuccess={() => utils.transactions.getAll.invalidate()} />
      </div>

      <div className='w-full'>
        <h2 className='text-2xl font-semibold mb-4'>Transaction History</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <TransactionTable
            data={transactions}
            budgets={budgets}
            deleteTransaction={deleteTransaction}
          />
        )}
      </div>
    </div>
  )
}

export default TransactionsPage
