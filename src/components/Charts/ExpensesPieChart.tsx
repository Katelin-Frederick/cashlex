'use client'

import {
  ResponsiveContainer,
  PieChart,
  Tooltip,
  Legend,
  Cell,
  Pie,
} from 'recharts'

// Function to generate a color based on an index (hue rotation)
const generateColor = (index: number) => {
  const hue = (index * 137.508) % 360
  return `hsl(${hue}, 70%, 60%)`
}

type ExpenseData = {
  name: string
  value: number
}

const ExpensesRingChart = ({ data, }: { data: ExpenseData[] }) => {
  // Currency formatter
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)

  return (
    <ResponsiveContainer width='100%' height={300}>
      <PieChart>
        <Pie
          dataKey='value'
          data={data}
          nameKey='name'
          cx='50%'
          cy='50%'
          outerRadius={100}
          innerRadius={70}
          fill='#8884d8'
          label={({ value, }) => formatCurrency(value)} // Format the label as currency
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={generateColor(index)} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default ExpensesRingChart
