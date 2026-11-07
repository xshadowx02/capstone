export interface StatementLine {
  id: number
  transaction_date: string
  merchant_name: string
  amount: number
  raw_text: string
  merchant_category_code?: string
  category?: string
  subcategory?: string
  confidence?: number
  reasoning?: string
  guardrail_passed?: boolean
  guardrail_flags?: string
  eval_score?: number
  eval_feedback?: string
  rag_context?: string
}

export interface BudgetItem {
  category: string
  monthly_limit: number
  spent: number
  remaining: number
  pct_used: number
  txn_count: number
}

export interface StoreRanking {
  merchant_name: string
  visit_count: number
  total_spent: number
  last_visit: string
  category?: string
}

export interface CategorySummary {
  category: string
  txn_count: number
  total_spent: number
  avg_confidence: number
  avg_eval_score: number
}

export interface Cardholder {
  id: number
  name: string
  card_number: string
  credit_limit: number
  location: string
}
