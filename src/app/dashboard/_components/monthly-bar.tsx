'use client'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, } from 'react-chartjs-2'

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip)

type MonthEntry = { expenses: number; income: number; label: string }

type Props = { months: MonthEntry[] }

export const MonthlyBar = ({ months, }: Props) => {
  const data = {
    datasets: [
      {
        backgroundColor: '#34d399',
        borderRadius: 4,
        data: months.map((m) => m.income),
        label: 'Income',
      },
      {
        backgroundColor: '#f87171',
        borderRadius: 4,
        data: months.map((m) => m.expenses),
        label: 'Expenses',
      },
    ],
    labels: months.map((m) => m.label),
  }

  return (
    <Bar
      data={data}
      options={{
        plugins: {
          legend: {
            labels: { boxWidth: 12, font: { size: 12, }, padding: 16, },
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed.y as number).toFixed(2)}`,
            },
          },
        },
        responsive: true,
        scales: {
          x: { grid: { display: false, }, },
          y: {
            grid: { color: '#f1f5f9', },
            ticks: {
              callback: (v) => `$${v as number}`,
            },
          },
        },
      }}
    />
  )
}
