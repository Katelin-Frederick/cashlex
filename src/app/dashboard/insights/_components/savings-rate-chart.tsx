'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { useTheme } from 'next-themes'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

type MonthItem = { label: string; rate: number | null }

type Props = { months: MonthItem[] }

export const SavingsRateChart = ({ months }: Props) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const labelColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'

  const data = {
    labels: months.map((m) => m.label),
    datasets: [
      {
        data: months.map((m) => m.rate ?? 0),
        backgroundColor: months.map((m) =>
          (m.rate ?? 0) >= 0 ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)'
        ),
        borderRadius: 4,
      },
    ],
  }

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y as number).toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor } },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              callback: (v) => `${v}%`,
            },
          },
        },
      }}
    />
  )
}
