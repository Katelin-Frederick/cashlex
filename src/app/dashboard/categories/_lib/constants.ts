export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER: 'Transfer',
}

export const TYPE_COLORS: Record<TransactionType, string> = {
  INCOME: 'bg-emerald-100 text-emerald-700',
  EXPENSE: 'bg-rose-100 text-rose-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
}

export const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#0ea5e9' // sky
]
