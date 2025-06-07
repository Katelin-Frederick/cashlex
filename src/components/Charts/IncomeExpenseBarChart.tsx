'use client'

import { ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Tooltip, Legend, XAxis, YAxis, Bar, } from 'recharts'

type IncomeExpenseData = {
  month: string
  income: number
  expense: number
}

const IncomeExpenseBarChart = ({ data, }: { data: IncomeExpenseData[] }) => (
  <ResponsiveContainer width='100%' height={400}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray='3 3' />
      <XAxis dataKey='month' />
      <YAxis />
      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
      <Legend />
      <ReferenceLine y={0} stroke='#000' />
      <Bar dataKey='income' fill='#38A169' name='Income' />
      <Bar dataKey='expense' fill='#F56565' name='Expense' />
    </BarChart>
  </ResponsiveContainer>
)

export default IncomeExpenseBarChart
