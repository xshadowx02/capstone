interface Props {
  confidence?: number
  evalScore?: number
}

export default function ConfidenceBadge({ confidence, evalScore }: Props) {
  const score = confidence ?? 0
  const color =
    score >= 0.8
      ? 'bg-green-100 text-green-800'
      : score >= 0.6
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${color}`}>
        {(score * 100).toFixed(0)}%
      </span>
      {evalScore !== undefined && evalScore !== null && (
        <span className="text-xs text-gray-400" title="Eval score">
          eval:{(evalScore * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}
