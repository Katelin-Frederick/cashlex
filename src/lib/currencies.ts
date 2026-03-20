export type Currency = {
  code: string
  name: string
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', },
  { code: 'EUR', name: 'Euro', },
  { code: 'GBP', name: 'British Pound', },
  { code: 'CAD', name: 'Canadian Dollar', },
  { code: 'AUD', name: 'Australian Dollar', },
  { code: 'JPY', name: 'Japanese Yen', },
  { code: 'CHF', name: 'Swiss Franc', },
  { code: 'CNY', name: 'Chinese Yuan', },
  { code: 'INR', name: 'Indian Rupee', },
  { code: 'MXN', name: 'Mexican Peso', },
  { code: 'BRL', name: 'Brazilian Real', },
  { code: 'KRW', name: 'South Korean Won', },
  { code: 'SGD', name: 'Singapore Dollar', },
  { code: 'HKD', name: 'Hong Kong Dollar', },
  { code: 'NZD', name: 'New Zealand Dollar', }
]

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code)

export const formatCurrency = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', { currency, style: 'currency', }).format(amount)
