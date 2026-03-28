'use client'

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line, } from 'react-chartjs-2'

ChartJS.register(CategoryScale, Filler, LineElement, LinearScale, PointElement, Tooltip)

type Entry = { label: string; netWorth: number }

type Props = { baseCurrency: string; months: Entry[] }

export const NetWorthLine = ({ baseCurrency, months, }: Props) => {
  const values = months.map((m) => m.netWorth)
  const isPositive = (values[values.length - 1] ?? 0) >= (values[0] ?? 0)

  const lineColor = isPositive ? '#34d399' : '#f87171'

  const data = {
    datasets: [
      {
        backgroundColor: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        borderColor: lineColor,
        borderWidth: 2,
        data: values,
        fill: true,
        label: 'Net Worth',
        pointBackgroundColor: lineColor,
        pointRadius: 3,
        tension: 0.35,
      },
    ],
    labels: months.map((m) => m.label),
  }

  return (
    <Line
      data={data}
      options={{
        plugins: {
          legend: { display: false, },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${baseCurrency} ${(ctx.parsed.y as number).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2, })}`,
            },
          },
        },
        responsive: true,
        scales: {
          x: { grid: { display: false, }, },
          y: {
            grid: { color: '#f1f5f9', },
            ticks: {
              callback: (v) => {
                const n = v as number
                if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`
                return String(n)
              },
            },
          },
        },
      }}
    />
  )
}
