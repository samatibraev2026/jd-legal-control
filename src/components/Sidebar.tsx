import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { getCaseStatus } from '../utils/status'

function useAlertCounts() {
  const { cases, processes } = useStore()
  const countByProcess: Record<string, { overdue: number; urgent: number }> = {}
  let totalOverdue = 0
  let totalUrgent = 0

  for (const c of cases) {
    const process = processes.find((p) => p.id === c.processId)
    if (!process) continue
    const status = getCaseStatus(c, process)
    if (!countByProcess[c.processId]) countByProcess[c.processId] = { overdue: 0, urgent: 0 }
    if (status === 'overdue') { countByProcess[c.processId].overdue++; totalOverdue++ }
    if (status === 'urgent') { countByProcess[c.processId].urgent++; totalUrgent++ }
  }
  return { countByProcess, totalOverdue, totalUrgent }
}

function AlertBadge({ overdue, urgent }: { overdue: number; urgent: number }) {
  if (overdue === 0 && urgent === 0) return null
  const count = overdue + urgent
  return (
    <span style={{
      background: overdue > 0 ? '#dc2626' : '#d97706',
      color: '#fff',
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 10,
      padding: '1px 6px',
      minWidth: 18,
      textAlign: 'center',
      lineHeight: '18px',
    }}>{count}</span>
  )
}

export function Sidebar() {
  const { processes } = useStore()
  const { countByProcess, totalOverdue, totalUrgent } = useAlertCounts()
  const navigate = useNavigate()

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#2c2416' : '#6b5a47',
    background: isActive ? '#f0e8db' : 'transparent',
    transition: 'all 0.1s',
  })

  return (
    <nav style={{
      width: 240,
      minWidth: 240,
      background: '#f5ede0',
      borderRight: '1px solid #e2d5c3',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflowY: 'auto',
      position: 'sticky',
      top: 0,
    }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #e2d5c3' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#2c2416', lineHeight: 1.3 }}>
          ⚖️ Контроль процессов
        </div>
        <div style={{ fontSize: 11, color: '#8c7b6a', marginTop: 2 }}>юридический департамент</div>
      </div>

      <div style={{ padding: '8px 8px' }}>
        <NavLink to="/" end style={navLinkStyle}>
          <span>🏠</span> Дашборд
        </NavLink>

        <NavLink to="/deadlines" style={navLinkStyle}>
          <span>⏰</span>
          <span style={{ flex: 1 }}>Контрольные сроки</span>
          <AlertBadge overdue={totalOverdue} urgent={totalUrgent} />
        </NavLink>

        <div style={{ margin: '12px 4px 4px', fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Процессы
        </div>

        {processes.map((p) => {
          const counts = countByProcess[p.id] ?? { overdue: 0, urgent: 0 }
          return (
            <NavLink key={p.id} to={`/process/${p.id}`} style={navLinkStyle}>
              <span style={{ fontSize: 14 }}>{p.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.2 }}>{p.shortName}</span>
              <AlertBadge overdue={counts.overdue} urgent={counts.urgent} />
            </NavLink>
          )
        })}

        <div style={{ margin: '12px 4px 4px', fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Система
        </div>
        <NavLink to="/settings" style={navLinkStyle}>
          <span>⚙️</span> Настройки
        </NavLink>
        <button
          onClick={() => navigate('/process/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            fontSize: 14, fontWeight: 500,
            color: '#6b5a47', background: 'transparent',
            border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
          }}
        >
          <span>➕</span> Новый процесс
        </button>
      </div>
    </nav>
  )
}
