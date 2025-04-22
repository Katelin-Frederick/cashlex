import { CreditCard, ChartPie, Timer, Bell, } from 'lucide-react'
import React from 'react'

const KeyFeatures = () => (
  <section className='py-12'>
    <h2 className='text-2xl md:text-4xl font-bold text-center mb-8'>Key Features</h2>

    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
        <CreditCard size='48px' />
        <h3 className='font-bold text-2xl my-4 text-center'>Expense Tracking</h3>

        <p>
          Add, edit, and delete transactions (expenses and income) with details like amount, category, and date.
        </p>
      </div>

      <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
        <ChartPie size='48px' />
        <h3 className='font-bold text-2xl my-4 text-center'>Budgeting</h3>

        <p>
          Create and track category-based budgets, with real-time feedback and warnings when nearing limits.
        </p>
      </div>

      <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
        <Timer size='48px' />
        <h3 className='font-bold text-2xl my-4 text-center'>Recurring Expenses</h3>

        <p>
          Set and automate repeating transactions (e.g., subscriptions, rent).
        </p>
      </div>

      <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
        <Bell size='48px' />
        <h3 className='font-bold text-2xl my-4 text-center'>Real-Time Notifications</h3>

        <p>
          Alerts for budget limits and due recurring payments.
        </p>
      </div>
    </div>
  </section>
)

export default KeyFeatures