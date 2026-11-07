import type { StatementLine, BudgetItem, StoreRanking, CategorySummary, Cardholder } from './types'

const BASE = '/api'

export interface StatementChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface NewStatementInput {
  transaction_date: string
  merchant_name: string
  amount: number
  description?: string
}

export async function fetchStatements(cardholderId = 1): Promise<StatementLine[]> {
  const res = await fetch(`${BASE}/statements/list?cardholder_id=${cardholderId}&limit=200`)
  if (!res.ok) throw new Error('Failed to fetch statements')
  return res.json()
}

export async function seedSynthetic(cardholderId = 1, count = 60): Promise<{ imported: number }> {
  const res = await fetch(`${BASE}/statements/seed?cardholder_id=${cardholderId}&count=${count}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to seed data')
  return res.json()
}

export async function addStatement(input: NewStatementInput): Promise<{
  imported: number
  results: Array<{ merchant: string; category: string; confidence: number }>
}> {
  const rawText = [input.merchant_name, input.description, `PHP ${input.amount.toFixed(2)}`]
    .filter(Boolean)
    .join(' ')
  const res = await fetch(`${BASE}/statements/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardholder_id: 1,
      transactions: [{ ...input, raw_text: rawText }],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Failed to add transaction')
  return data
}

export async function clearStatements(cardholderId = 1): Promise<void> {
  const res = await fetch(`${BASE}/statements/clear?cardholder_id=${cardholderId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to clear statements')
}

export async function fetchBudgetOverview(cardholderId = 1): Promise<BudgetItem[]> {
  const res = await fetch(`${BASE}/budget/overview?cardholder_id=${cardholderId}`)
  if (!res.ok) throw new Error('Failed to fetch budget')
  return res.json()
}

export async function askStatementAssistant(
  message: string,
  history: StatementChatTurn[],
  cardholderId = 1,
): Promise<string> {
  const res = await fetch(`${BASE}/statements/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardholder_id: cardholderId, message, history }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? 'Budget assistant could not respond')
  }
  return data.reply
}

export async function fetchStoreRankings(cardholderId = 1): Promise<StoreRanking[]> {
  const res = await fetch(`${BASE}/rankings/stores?cardholder_id=${cardholderId}&limit=20`)
  if (!res.ok) throw new Error('Failed to fetch rankings')
  return res.json()
}

export async function fetchCategorySummary(cardholderId = 1): Promise<CategorySummary[]> {
  const res = await fetch(`${BASE}/statements/categories/summary?cardholder_id=${cardholderId}`)
  if (!res.ok) throw new Error('Failed to fetch category summary')
  return res.json()
}

export async function fetchCardholder(cardholderId = 1): Promise<Cardholder> {
  const res = await fetch(`${BASE}/rankings/cardholder?cardholder_id=${cardholderId}`)
  if (!res.ok) throw new Error('Failed to fetch cardholder')
  return res.json()
}
