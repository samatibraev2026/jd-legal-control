import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { getCaseStatus } from '../utils/status'
import { StatusBadge } from '../components/StatusBadge'
import { format, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'

export function Deadlines() {
  const navigate = useNavigate()
  const { cases, processes, user } = useStore()
  const [onlyMine, setOnlyMine] = useState(false)

  const alertCases = cases.filter((c) => {
    const p = processes.find((x) => x.id === c.processId)
    if (!p) return false
    const s = getCaseStatus(c, p)
    if (s !== 'overdue' && s !== 'urgent') return false
    if (onlyMine && user.name && c.responsible !== user.name) return false
    return true
  })

  const overdueCases = alertCases.filter((c) => {
    const p = processes.find((x) => x.id === c.processId)!
    return getCaseStatus(c, p) === 'overdue'
  }).sort((a, b) => a.deadline.localeCompare(b.deadline))

  const urgentCases = alertCases.filter((c) => {
    const p = processes.find((x) => x.id === c.processId)!
    return getCaseStatus(c, p) === 'urgent'
  }).sort((a, b) => a.deadline.localeCompare(b.deadline))

  function CaseItem({ c }: { c: typeof cases[0] }) {
    const p = processes.find((x) => x.id === c.processId)!
    const status = getCaseStatus(c, p)
    const dl = c.deadline ? parseISO(c.deadline) : null
    return (
      <div
        onClick={() => navigate(`/process/${p.id}/case/${c.id}`)}
        style={{
          background: '#fff',
          border: '1px solid #e7ddd0',
          borderRadius: 8,
          padding: '12px 16px',
          cursor: 'pointer',
          marginBottom: 8,
          borderLeft: `4px solid ${status === 'overdue' ? '#dc2626' : '#d97706'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#6b5a47', fontWeight: 600 }}>{c.number}</span>
          <StatusBadge status={status} />
          {dl && isValid(dl) && (
            <span style={{ fontSize: 13, color: status === 'overdue' ? '#991b1b' : '#92400e', fontWeight: 600 }}>
              {format(dl, 'd MMMM yyyy', { locale: ru })}
            </span>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2c2416', marginTop: 4 }}>{c.title}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: '#8c7b6a' }}>
          <span>{p.icon} {p.shortName}</span>
          {c.responsible && <span>👤 {c.responsible}</span>}
          <span>Этап: {p.stages[c.stageIndex]}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#2c2416' }}>⏰ Контрольные сроки</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: '#6b5a47' }}>
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          Только мои дела
        </label>
      </div>

      {alertCases.length === 0 && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 12, padding: '32px', textAlign: 'center',
          color: '#166534', fontSize: 16,
        }}>
          ✅ Нет просроченных и горящих дел{onlyMine ? ' в ваших делах' : ''}
        </div>
      )}

      {overdueCases.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            margin: '0 0 12px',
            fontSize: 16, fontWeight: 700, color: '#991b1b',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🚨 Просрочено <span style={{
              background: '#dc2626', color: '#fff',
              borderRadius: 10, padding: '1px 8px', fontSize: 13,
            }}>{overdueCases.length}</span>
          </h2>
          {overdueCases.map((c) => <CaseItem key={c.id} c={c} />)}
        </div>
      )}

      {urgentCases.length > 0 && (
        <div>
          <h2 style={{
            margin: '0 0 12px',
            fontSize: 16, fontWeight: 700, color: '#92400e',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠️ Срок ≤ 3 дня <span style={{
              background: '#d97706', color: '#fff',
              borderRadius: 10, padding: '1px 8px', fontSize: 13,
            }}>{urgentCases.length}</span>
          </h2>
          {urgentCases.map((c) => <CaseItem key={c.id} c={c} />)}
        </div>
      )}
    </div>
  )
}
