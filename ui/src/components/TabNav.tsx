type Tab = 'statements' | 'budget' | 'rankings'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  counts?: { statements: number; budget: number; rankings: number }
}

export default function TabNav({ active, onChange, counts }: Props) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'statements', label: 'Statements', icon: '📄' },
    { id: 'budget', label: 'Budget', icon: '📊' },
    { id: 'rankings', label: 'Store Rankings', icon: '🏆' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                active === tab.id
                  ? 'border-[#1e3a5f] text-[#1e3a5f] bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'statements' && counts?.statements !== undefined && counts.statements > 0 && (
                <span className="bg-[#1e3a5f] text-white text-xs rounded-full px-2 py-0.5">
                  {counts.statements}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
