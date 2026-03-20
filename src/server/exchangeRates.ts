// Exchange rates from frankfurter.app (free, no API key, ECB data, updates daily)
// Rates are cached in memory for 1 hour to avoid hammering the API.

type RateCache = { fetchedAt: number; rates: Record<string, number> }

const cache = new Map<string, RateCache>()
const TTL = 60 * 60 * 1000 // 1 hour

type FrankfurterResponse = { rates: Record<string, number> }

/**
 * Returns exchange rates where base currency = 1.
 * e.g. getExchangeRates("USD") → { USD: 1, EUR: 0.92, GBP: 0.79, ... }
 */
export const getExchangeRates = async (base: string): Promise<Record<string, number>> => {
  const cached = cache.get(base)
  if (cached && Date.now() - cached.fetchedAt < TTL) return cached.rates

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`)
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)
    const data = (await res.json()) as FrankfurterResponse
    const rates: Record<string, number> = { [base]: 1, ...data.rates, }
    cache.set(base, { fetchedAt: Date.now(), rates, })
    return rates
  } catch {
    // On failure return the cached value (even if stale) or identity map
    const stale = cache.get(base)
    return stale?.rates ?? { [base]: 1, }
  }
}

/**
 * Converts an amount in `currency` to the base currency using fetched rates.
 * rates[currency] = "how much 1 base = X foreign"
 * So: base_amount = foreign_amount / rates[currency]
 *
 * If the currency is unknown or rate is missing, returns the amount unchanged.
 */
export const convertToBase = (
  amount: number,
  currency: string,
  rates: Record<string, number>
): number => {
  const rate = rates[currency]
  if (!rate || rate === 0) return amount
  return amount / rate
}
