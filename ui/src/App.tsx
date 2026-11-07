import { useState, useEffect, useCallback } from 'react'
import type { StatementLine, BudgetItem, StoreRanking, CategorySummary, Cardholder } from './types'
import {
  fetchStatements,
  fetchBudgetOverview,
  fetchStoreRankings,
  fetchCategorySummary,
  fetchCardholder,
} from './api'
import Header from './components/Header'
import TabNav from './components/TabNav'
import StatementsPage from './pages/StatementsPage'
import BudgetPage from './pages/BudgetPage'
import RankingsPage from './pages/RankingsPage'

type Tab = 'statements' | 'budget' | 'rankings'

export default function App() {
  const [tab, setTab] = useState<Tab>('statements')
  const [statements, setStatements] = useState<StatementLine[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [rankings, setRankings] = useState<StoreRanking[]>([])
  const [summary, setSummary] = useState<CategorySummary[]>([])
  const [cardholder, setCardholder] = useState<Cardholder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, b, r, cat, ch] = await Promise.all([
        fetchStatements(),
        fetchBudgetOverview(),
        fetchStoreRankings(),
        fetchCategorySummary(),
        fetchCardholder(),
      ])
      setStatements(s)
      setBudget(b)
      setRankings(r)
      setSummary(cat)
      setCardholder(ch)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cardholder={cardholder} />
      <TabNav
        active={tab}
        onChange={setTab}
        counts={{ statements: statements.length, budget: budget.length, rankings: rankings.length }}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
            ⚠️ {error} — Make sure the API server is running.
          </div>
        )}
        {tab === 'statements' && (
          <StatementsPage statements={statements} loading={loading} onRefresh={loadAll} />
        )}
        {tab === 'budget' && <BudgetPage budget={budget} summary={summary} loading={loading} />}
        {tab === 'rankings' && <RankingsPage rankings={rankings} loading={loading} />}
      </main>
    </div>
  )
}
