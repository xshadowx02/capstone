import type { StoreRanking } from '../types'
import { formatPHP, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  rankings: StoreRanking[]
  loading: boolean
}

export default function RankingsPage({ rankings, loading }: Props) {
  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-2">⏳</div>
        <p>Loading rankings...</p>
      </div>
    )
  }

  const top10 = rankings.slice(0, 10)
  const chartData = top10.map((r) => ({
    name: r.merchant_name.length > 14 ? r.merchant_name.slice(0, 14) + '...' : r.merchant_name,
    fullName: r.merchant_name,
    visits: r.visit_count,
    spent: Number(r.total_spent),
    color: CATEGORY_COLORS[r.category ?? ''] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top 10 Most Visited Stores</h2>
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No ranking data yet. Load synthetic data first.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ left: 0, right: 16, top: 4, bottom: 60 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number, name: string) =>
                  name === 'visits'
                    ? [`${v} visit${v !== 1 ? 's' : ''}`, 'Visits']
                    : [formatPHP(v), 'Spent']
                }
                labelFormatter={(
                  _: unknown,
                  payload: Array<{ payload?: { fullName?: string } }>,
                ) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Store Rankings</h2>
          <span className="text-xs text-gray-400">{rankings.length} stores tracked</span>
        </div>
        {rankings.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No data yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rankings.map((store, idx) => (
              <div
                key={store.merchant_name}
                className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    idx === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : idx === 1
                      ? 'bg-gray-300 text-gray-700'
                      : idx === 2
                      ? 'bg-amber-600 text-amber-100'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="text-xl flex-shrink-0">
                  {CATEGORY_ICONS[store.category ?? ''] ?? '📦'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {store.merchant_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[store.category ?? ''] ?? '#94a3b8' }}
                    >
                      {store.category ?? 'Uncategorized'}
                    </span>
                    <span className="text-xs text-gray-400">Last: {formatDate(store.last_visit)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-[#1e3a5f] text-sm">
                    {store.visit_count} visit{store.visit_count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500">{formatPHP(Number(store.total_spent))}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
