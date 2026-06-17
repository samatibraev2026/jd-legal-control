import type { Priority } from '../types'

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#6b7280',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span style={{ color: PRIORITY_COLORS[priority], fontWeight: 600, fontSize: 13 }}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
