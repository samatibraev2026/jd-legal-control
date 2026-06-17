import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { getCaseStatus } from '../utils/status'

export function Banner() {
  const navigate = useNavigate()
  const { cases, processes } = useStore()

  const alertCases = cases.filter((c) => {
    const process = processes.find((p) => p.id === c.processId)
    if (!process) return false
    const status = getCaseStatus(c, process)
    return status === 'overdue' || status === 'urgent'
  })

  const overdue = alertCases.filter((c) => {
    const process = processes.find((p) => p.id === c.processId)!
    return getCaseStatus(c, process) === 'overdue'
  }).length

  const urgent = alertCases.filter((c) => {
    const process = processes.find((p) => p.id === c.processId)!
    return getCaseStatus(c, process) === 'urgent'
  }).length

  if (alertCases.length === 0) return null

  return (
    <div
      style={{
        background: overdue > 0 ? '#fef2f2' : '#fffbeb',
        borderBottom: `2px solid ${overdue > 0 ? '#fca5a5' : '#fcd34d'}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 18 }}>{overdue > 0 ? '🚨' : '⚠️'}</span>
      <span style={{ flex: 1, fontSize: 14, color: overdue > 0 ? '#991b1b' : '#92400e', fontWeight: 500 }}>
        {overdue > 0 && <><strong>{overdue}</strong> просроченных{urgent > 0 ? ` и ` : ''}</>}
        {urgent > 0 && <><strong>{urgent}</strong> горящих</>}
        {' '}дел требуют внимания
      </span>
      <button
        onClick={() => navigate('/deadlines')}
        style={{
          background: overdue > 0 ? '#dc2626' : '#d97706',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Контрольные сроки →
      </button>
    </div>
  )
}
