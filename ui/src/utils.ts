export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#ef4444',
  'Groceries': '#22c55e',
  'Transportation': '#3b82f6',
  'Shopping': '#a855f7',
  'Entertainment': '#f59e0b',
  'Health & Wellness': '#14b8a6',
  'Bills & Utilities': '#64748b',
  'Travel': '#06b6d4',
  'Education': '#8b5cf6',
  'Other': '#94a3b8',
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Food & Dining': '🍽️',
  'Groceries': '🛒',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Health & Wellness': '💊',
  'Bills & Utilities': '💡',
  'Travel': '✈️',
  'Education': '📚',
  'Other': '📦',
}
