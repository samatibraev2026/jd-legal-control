import type { CaseStatus } from '../types'
import { STATUS_LABELS, STATUS_TEXT_COLORS, STATUS_COLORS, STATUS_BORDER_COLORS } from '../utils/status'

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      style={{
        background: STATUS_COLORS[status],
        color: STATUS_TEXT_COLORS[status],
        border: `1px solid ${STATUS_BORDER_COLORS[status]}`,
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
