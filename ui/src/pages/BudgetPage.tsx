import type { BudgetItem, CategorySummary } from '../types'
import { formatPHP, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils'
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  budget: BudgetItem[]
  summary: CategorySummary[]
  loading: boolean
}

export default function BudgetPage({ budget, summary, loading }: Props) {
  const totalBudget = budget.reduce((s, b) => s + Number(b.monthly_limit), 0)
  const totalSpent = budget.reduce((s, b) => s + Number(b.spent), 0)

  const pieData = summary.map((s) => ({
    name: s.category,
    value: Number(s.total_spent),
    color: CATEGORY_COLORS[s.category] ?? '#94a3b8',
  }))

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-2">⏳</div>
        <p>Loading budget...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Monthly Budget</div>
          <div className="text-xl font-bold text-[#1e3a5f]">{formatPHP(totalBudget)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Spent This Month</div>
          <div className="text-xl font-bold text-red-600">{formatPHP(totalSpent)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Remaining</div>
          <div
            className={`text-xl font-bold ${
              totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatPHP(totalBudget - totalSpent)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Budget Used</div>
          <div
            className={`text-xl font-bold ${
              totalBudget > 0 && totalSpent / totalBudget > 0.8 ? 'text-red-600' : 'text-[#1e3a5f]'
            }`}
          >
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0'}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Budget vs Spent</h2>
          <div className="space-y-3">
            {budget.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    {CATEGORY_ICONS[item.category] ?? '📦'} {item.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatPHP(Number(item.spent))} / {formatPHP(Number(item.monthly_limit))}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Number(item.pct_used), 100)}%`,
                      backgroundColor:
                        Number(item.pct_used) > 100
                          ? '#ef4444'
                          : Number(item.pct_used) > 80
                          ? '#f59e0b'
                          : CATEGORY_COLORS[item.category] ?? '#94a3b8',
                    }}
                  />
                </div>
                <div className="text-right text-xs mt-0.5">
                  <span
                    className={
                      Number(item.pct_used) > 100
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-400'
                    }
                  >
                    {Number(item.pct_used).toFixed(1)}% used
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Spending by Category</h2>
          {pieData.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No spending data yet. Load synthetic data first.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPHP(v)} />
                <Legend formatter={(v) => `${CATEGORY_ICONS[v] ?? ''} ${v}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Category Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Category</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium"># Txns</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Total Spent</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Avg Confidence</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Avg Eval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.map((row) => (
                <tr key={row.category} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[row.category] ?? '#94a3b8' }}
                      />
                      {CATEGORY_ICONS[row.category] ?? '📦'} {row.category}
                    </span>
                  </td>
                  <td className="text-right px-4 py-2 text-gray-600">{row.txn_count}</td>
                  <td className="text-right px-4 py-2 font-medium">
                    {formatPHP(Number(row.total_spent))}
                  </td>
                  <td className="text-right px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        Number(row.avg_confidence) >= 0.8
                          ? 'bg-green-100 text-green-800'
                          : Number(row.avg_confidence) >= 0.6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(Number(row.avg_confidence) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right px-4 py-2 text-gray-500">
                    {row.avg_eval_score
                      ? (Number(row.avg_eval_score) * 100).toFixed(1) + '%'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
