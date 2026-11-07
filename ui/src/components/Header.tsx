import type { Cardholder } from '../types'
import { formatPHP } from '../utils'

interface Props {
  cardholder: Cardholder | null
}

export default function Header({ cardholder }: Props) {
  return (
    <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5282] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">💳</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Local Ledge</h1>
            <p className="text-blue-200 text-xs">Philippine Credit Card Tracker · Makati, Metro Manila</p>
          </div>
        </div>
        {cardholder && (
          <div className="text-right">
            <div className="font-semibold text-sm">{cardholder.name}</div>
            <div className="text-blue-200 text-xs font-mono">{cardholder.card_number}</div>
            <div className="text-blue-300 text-xs">Limit: {formatPHP(cardholder.credit_limit)}</div>
          </div>
        )}
      </div>
    </header>
  )
}
