interface Props {
  passed?: boolean
  flags?: string
}

export default function GuardrailBadge({ passed, flags }: Props) {
  if (passed === undefined) return null
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        passed ? 'bg-green-50 text-green-700' : 'bg-red-100 text-red-700'
      }`}
      title={flags || 'No flags'}
    >
      {passed ? '✓ Guard' : `⚠ ${flags?.split(',')[0] ?? 'Blocked'}`}
    </span>
  )
}
