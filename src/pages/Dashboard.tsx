import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { getCaseStatus, STATUS_COLORS, STATUS_TEXT_COLORS } from '../utils/status'
import type { CaseStatus } from '../types'
import { format, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e7ddd0', borderRadius: 10,
      padding: '16px 20px', textAlign: 'center',
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#8c7b6a', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { cases, processes } = useStore()

  const stats: Record<CaseStatus, number> = { overdue: 0, urgent: 0, active: 0, completed: 0, paused: 0 }
  for (const c of cases) {
    const p = processes.find((x) => x.id === c.processId)
    if (!p) continue
    stats[getCaseStatus(c, p)]++
  }

  const upcoming = cases
    .filter((c) => {
      if (!c.deadline) return false
      const p = processes.find((x) => x.id === c.processId)
      if (!p) return false
      const s = getCaseStatus(c, p)
      return s !== 'completed' && s !== 'paused'
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 8)

  return (
    <div>
      <h1 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 800, color: '#2c2416' }}>
        Дашборд
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Всего дел" value={cases.length} color="#8c7b6a" />
        <StatCard label="Просрочено" value={stats.overdue} color="#dc2626" />
        <StatCard label="Срок близко" value={stats.urgent} color="#d97706" />
        <StatCard label="В работе" value={stats.active} color="#2d6a4f" />
        <StatCard label="Завершено" value={stats.completed} color="#1e40af" />
        <StatCard label="На паузе" value={stats.paused} color="#6b7280" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#2c2416' }}>Процессы</h2>
          <div style={{ background: '#fff', border: '1px solid #e7ddd0', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5ede0', borderBottom: '1px solid #e7ddd0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b5a47' }}>Процесс</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: '#6b5a47' }}>Дел</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: '#6b5a47' }}>В работе</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>Просроч.</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => {
                  const pCases = cases.filter((c) => c.processId === p.id)
                  const inWork = pCases.filter((c) => getCaseStatus(c, p) === 'active').length
                  const overdue = pCases.filter((c) => getCaseStatus(c, p) === 'overdue').length
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/process/${p.id}`)}
                      style={{ borderBottom: '1px solid #f0e8db', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ marginRight: 6 }}>{p.icon}</span>
                        <span style={{ fontWeight: 500 }}>{p.shortName}</span>
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{pCases.length}</td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#2d6a4f' }}>{inWork}</td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', fontFamily: 'monospace', color: overdue > 0 ? '#dc2626' : '#6b7280', fontWeight: overdue > 0 ? 700 : 400 }}>{overdue}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2c2416' }}>Ближайшие сроки</h2>
            <button onClick={() => navigate('/deadlines')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#92650a', fontSize: 13, fontWeight: 600,
            }}>Все →</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e7ddd0', borderRadius: 10, overflow: 'hidden' }}>
            {upcoming.length === 0 && (
              <div style={{ padding: 20, color: '#8c7b6a', fontSize: 14, textAlign: 'center' }}>
                Нет дел с установленным сроком
              </div>
            )}
            {upcoming.map((c) => {
              const p = processes.find((x) => x.id === c.processId)
              if (!p) return null
              const status = getCaseStatus(c, p)
              const dl = parseISO(c.deadline)
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/process/${p.id}/case/${c.id}`)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f0e8db',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${status === 'overdue' ? '#dc2626' : status === 'urgent' ? '#d97706' : '#d1c5b4'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8c7b6a', flexShrink: 0 }}>{c.number}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: STATUS_TEXT_COLORS[status],
                      background: STATUS_COLORS[status],
                      padding: '1px 6px', borderRadius: 4, flexShrink: 0,
                    }}>{isValid(dl) ? format(dl, 'd MMM yyyy', { locale: ru }) : '—'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#2c2416', marginTop: 2, fontWeight: 500 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#8c7b6a' }}>{p.icon} {p.shortName}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
