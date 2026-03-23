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

type DayItem = { average: number; day: string }

type Props = { items: DayItem[] }

export const DayOfWeekChart = ({ items }: Props) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const labelColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'

  const maxIdx = items.reduce((max, item, i, arr) => (item.average > arr[max]!.average ? i : max), 0)

  const data = {
    labels: items.map((i) => i.day),
    datasets: [
      {
        data: items.map((i) => i.average),
        backgroundColor: items.map((_, i) =>
          i === maxIdx ? 'rgb(239,68,68)' : isDark ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.8)'
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
              label: (ctx) => ` Avg $${(ctx.parsed.y as number).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor } },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              callback: (v) => `$${v}`,
            },
          },
        },
      }}
    />
  )
}
