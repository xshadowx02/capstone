import { useState, useCallback, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { StatementLine } from '../types'
import { formatPHP, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils'
import ConfidenceBadge from '../components/ConfidenceBadge'
import GuardrailBadge from '../components/GuardrailBadge'
import StatementChat from '../components/StatementChat'
import { addStatement, seedSynthetic, clearStatements } from '../api'

interface Props {
  statements: StatementLine[]
  loading: boolean
  onRefresh: () => void
}

export default function StatementsPage({ statements, loading, onRefresh }: Props) {
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [savingEntry, setSavingEntry] = useState(false)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [entrySuccess, setEntrySuccess] = useState<string | null>(null)
  const [entry, setEntry] = useState({
    transaction_date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10),
    merchant_name: '',
    amount: '',
    description: '',
  })
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const handleSeed = useCallback(async () => {
    setSeeding(true)
    try {
      await seedSynthetic(1, 60)
      onRefresh()
    } catch (e) {
      alert('Seeding failed: ' + (e as Error).message)
    } finally {
      setSeeding(false)
    }
  }, [onRefresh])

  const handleClear = useCallback(async () => {
    if (!confirm('Clear all statement data?')) return
    setClearing(true)
    try {
      await clearStatements(1)
      onRefresh()
    } catch (e) {
      alert('Clear failed: ' + (e as Error).message)
    } finally {
      setClearing(false)
    }
  }, [onRefresh])

  const handleAddEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingEntry(true)
    setEntryError(null)
    setEntrySuccess(null)
    try {
      const result = await addStatement({
        transaction_date: entry.transaction_date,
        merchant_name: entry.merchant_name.trim(),
        amount: Number(entry.amount),
        description: entry.description.trim() || undefined,
      })
      const categorized = result.results[0]
      setEntrySuccess(
        categorized
          ? `Added and categorized as ${categorized.category}.`
          : 'Transaction added and categorized.',
      )
      setEntry((current) => ({
        ...current,
        merchant_name: '',
        amount: '',
        description: '',
      }))
      setFilter('')
      setCategoryFilter('All')
      await onRefresh()
    } catch (error) {
      setEntryError((error as Error).message)
    } finally {
      setSavingEntry(false)
    }
  }

  const categories = ['All', ...Array.from(new Set(statements.map((s) => s.category ?? 'Uncategorized'))).sort()]

  const filtered = statements.filter((s) => {
    const matchText =
      s.merchant_name.toLowerCase().includes(filter.toLowerCase()) ||
      s.raw_text.toLowerCase().includes(filter.toLowerCase())
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter
    return matchText && matchCat
  })

  const totalSpent = filtered.reduce((sum, s) => sum + Number(s.amount), 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setShowEntryForm((open) => !open)
              setEntryError(null)
              setEntrySuccess(null)
            }}
            disabled={loading || savingEntry}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {showEntryForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {showEntryForm ? 'Cancel' : 'Add transaction'}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding || loading}
            className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d5282] disabled:opacity-50 transition-colors"
          >
            {seeding ? '⏳ Seeding...' : '🔄 Load Synthetic Data'}
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || loading}
            className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {clearing ? '⏳ Clearing...' : '🗑️ Clear All'}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Search merchant..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] w-48"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {showEntryForm && (
        <form onSubmit={handleAddEntry} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-gray-600">
              Date
              <input
                type="date"
                required
                value={entry.transaction_date}
                onChange={(event) => setEntry({ ...entry, transaction_date: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
              />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Merchant
              <input
                type="text"
                required
                maxLength={255}
                value={entry.merchant_name}
                onChange={(event) => setEntry({ ...entry, merchant_name: event.target.value })}
                placeholder="Merchant name"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
              />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Amount (PHP)
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={entry.amount}
                onChange={(event) => setEntry({ ...entry, amount: event.target.value })}
                placeholder="0.00"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
              />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Description (optional)
              <input
                type="text"
                maxLength={500}
                value={entry.description}
                onChange={(event) => setEntry({ ...entry, description: event.target.value })}
                placeholder="What was it for?"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div aria-live="polite" className="text-sm">
              {entryError && <p className="text-red-600" role="alert">{entryError}</p>}
              {entrySuccess && <p className="text-emerald-700" role="status">{entrySuccess}</p>}
            </div>
            <button
              type="submit"
              disabled={savingEntry || !entry.merchant_name.trim() || !entry.amount}
              className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d5282] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingEntry ? 'Categorizing...' : 'Categorize and add'}
            </button>
          </div>
        </form>
      )}

      {filtered.length > 0 && (
        <div className="bg-[#1e3a5f] text-white rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="font-bold text-lg">{formatPHP(totalSpent)}</span>
        </div>
      )}

      <StatementChat />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            <p>Loading statements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No statements yet.</p>
            <p className="text-xs mt-1">Click "Load Synthetic Data" to generate sample Philippine transactions.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <div key={s.id}>
                <div
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">
                        {CATEGORY_ICONS[s.category ?? ''] ?? '📦'}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {s.merchant_name}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(s.transaction_date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-sm text-gray-900">
                          {formatPHP(Number(s.amount))}
                        </div>
                        <div
                          className="text-xs px-2 py-0.5 rounded-full text-white inline-block"
                          style={{
                            backgroundColor: CATEGORY_COLORS[s.category ?? ''] ?? '#94a3b8',
                          }}
                        >
                          {s.category ?? 'Uncategorized'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <ConfidenceBadge confidence={s.confidence} evalScore={s.eval_score} />
                        <GuardrailBadge
                          passed={s.guardrail_passed}
                          flags={s.guardrail_flags ?? undefined}
                        />
                      </div>
                      <span className="text-gray-300 text-xs">{expanded === s.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </div>
                {expanded === s.id && (
                  <div className="bg-blue-50 px-4 py-3 text-xs space-y-2 border-t border-blue-100">
                    <div>
                      <span className="font-semibold text-gray-600">Subcategory:</span>{' '}
                      {s.subcategory ?? '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Reasoning:</span>{' '}
                      {s.reasoning ?? '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Eval Feedback:</span>{' '}
                      {s.eval_feedback ?? '—'}
                    </div>
                    {s.rag_context && (
                      <div>
                        <span className="font-semibold text-gray-600">RAG Context:</span>
                        <pre className="mt-1 whitespace-pre-wrap text-gray-500 bg-white rounded p-2 border">
                          {s.rag_context}
                        </pre>
                      </div>
                    )}
                    {s.guardrail_flags && (
                      <div className="text-red-600">
                        <span className="font-semibold">Guardrail Flags:</span> {s.guardrail_flags}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
