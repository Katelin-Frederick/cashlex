'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip, } from 'chart.js'
import { Doughnut, } from 'react-chartjs-2'

ChartJS.register(ArcElement, Legend, Tooltip)

type SpendingItem = { amount: number; color: string; name: string }

type Props = { items: SpendingItem[] }

export const SpendingDonut = ({ items, }: Props) => {
  if (items.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground text-sm'>No expense data this month</p>
      </div>
    )
  }

  const data = {
    datasets: [
      {
        backgroundColor: items.map((i) => i.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        data: items.map((i) => i.amount),
        hoverOffset: 6,
      },
    ],
    labels: items.map((i) => i.name),
  }

  return (
    <Doughnut
      data={data}
      options={{
        cutout: '65%',
        plugins: {
          legend: {
            labels: { boxWidth: 12, font: { size: 12, }, padding: 16, },
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed as number).toFixed(2)}`,
            },
          },
        },
      }}
    />
  )
}
