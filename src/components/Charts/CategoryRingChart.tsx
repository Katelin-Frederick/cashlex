'use client'

import {
  ResponsiveContainer,
  PieChart,
  Tooltip,
  Legend,
  Cell,
  Pie,
} from 'recharts'

const generateColor = (index: number) => {
  const hue = (index * 137.508) % 360
  return `hsl(${hue}, 70%, 60%)`
}

type ExpenseData = {
  name: string
  value: number
}

const CategoryRingChart = ({ data, }: { data: ExpenseData[] }) => {
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
          label={({ value, }: { value: number }) => formatCurrency(value)}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={generateColor(index)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default CategoryRingChart
