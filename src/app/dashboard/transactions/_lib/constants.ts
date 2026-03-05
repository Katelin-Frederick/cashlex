export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

export const TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  TRANSFER: 'Transfer',
}

// Badge colors
export const TYPE_COLORS: Record<TransactionType, string> = {
  EXPENSE: 'bg-red-100 text-red-700',
  INCOME: 'bg-emerald-100 text-emerald-700',
  TRANSFER: 'bg-slate-100 text-slate-600',
}

// Amount text colors
export const AMOUNT_COLORS: Record<TransactionType, string> = {
  EXPENSE: 'text-red-600',
  INCOME: 'text-emerald-600',
  TRANSFER: 'text-slate-500',
}

// Amount prefix symbol
export const AMOUNT_PREFIX: Record<TransactionType, string> = {
  EXPENSE: '−',
  INCOME: '+',
  TRANSFER: '−',
}
