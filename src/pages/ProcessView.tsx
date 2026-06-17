import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { getCaseStatus, STATUS_TEXT_COLORS, STATUS_COLORS } from '../utils/status'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'
import { Modal } from '../components/Modal'
import { StageChain } from '../components/StageChain'
import type { Priority } from '../types'
import { format, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'

function CreateCaseModal({ processId, onClose }: { processId: string; onClose: () => void }) {
  const { processes, addCase, user } = useStore()
  const process = processes.find((p) => p.id === processId)!
  const [form, setForm] = useState({
    title: '', party: '', responsible: user.name || '',
    priority: 'medium' as Priority, startDate: format(new Date(), 'yyyy-MM-dd'),
    deadline: '', amount: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addCase({
      processId,
      title: form.title,
      party: form.party,
      responsible: form.responsible,
      priority: form.priority,
      startDate: form.startDate,
      deadline: form.deadline,
      amount: form.amount ? Number(form.amount) : undefined,
    }, user.name || 'Неизвестно')
    onClose()
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #d1c5b4', borderRadius: 8,
    fontSize: 14, background: '#fffcf7',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#6b5a47', marginBottom: 5,
  }
  const row: React.CSSProperties = { marginBottom: 14 }

  return (
    <Modal title={`Новое дело — ${process.shortName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={row}>
          <label style={labelStyle}>Название / суть дела *</label>
          <input required style={fieldStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Краткое описание дела" />
        </div>
        <div style={row}>
          <label style={labelStyle}>{process.partyLabel}</label>
          <input style={fieldStyle} value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder={process.partyLabel} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Ответственный</label>
            <input style={fieldStyle} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Приоритет</label>
            <select style={fieldStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Дата начала</label>
            <input type="date" style={fieldStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Срок исполнения</label>
            <input type="date" style={fieldStyle} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        {process.hasAmount && (
          <div style={row}>
            <label style={labelStyle}>Сумма (тенге)</label>
            <input type="number" style={fieldStyle} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{
            background: '#f5ede0', color: '#6b5a47', border: '1px solid #e2d5c3',
            borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Отмена</button>
          <button type="submit" style={{
            background: process.color, color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>Создать дело</button>
        </div>
      </form>
    </Modal>
  )
}

export function ProcessView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { processes, cases, user } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [onlyMine, setOnlyMine] = useState(false)
  const [search, setSearch] = useState('')

  if (id === 'new') {
    navigate('/settings')
    return null
  }

  const process = processes.find((p) => p.id === id)
  if (!process) return <div style={{ padding: 24, color: '#dc2626' }}>Процесс не найден</div>

  let filtered = cases.filter((c) => c.processId === id)
  if (onlyMine && user.name) filtered = filtered.filter((c) => c.responsible === user.name)
  if (search) filtered = filtered.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.number.toLowerCase().includes(search.toLowerCase()) ||
    c.party.toLowerCase().includes(search.toLowerCase())
  )

  filtered = [...filtered].sort((a, b) => {
    const sa = getCaseStatus(a, process)
    const sb = getCaseStatus(b, process)
    const order = { overdue: 0, urgent: 1, active: 2, paused: 3, completed: 4 }
    return (order[sa] ?? 5) - (order[sb] ?? 5)
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28 }}>{process.icon}</span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#2c2416', flex: 1 }}>{process.name}</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: process.color, color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 20px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Новое дело
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Поиск по номеру, названию, стороне..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px',
            border: '1px solid #d1c5b4', borderRadius: 8,
            fontSize: 14, background: '#fffcf7',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: '#6b5a47' }}>
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          Только мои дела
        </label>
      </div>

      {filtered.length === 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e7ddd0', borderRadius: 12,
          padding: 40, textAlign: 'center', color: '#8c7b6a', fontSize: 15,
        }}>
          {cases.filter((c) => c.processId === id).length === 0
            ? 'Нет дел. Создайте первое дело.'
            : 'Нет дел, соответствующих фильтру.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((c) => {
          const status = getCaseStatus(c, process)
          const isAlert = status === 'overdue' || status === 'urgent'
          const dl = c.deadline ? parseISO(c.deadline) : null
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/process/${id}/case/${c.id}`)}
              style={{
                background: '#fff',
                border: `1px solid ${isAlert ? STATUS_COLORS[status] : '#e7ddd0'}`,
                borderRadius: 10,
                padding: '12px 16px',
                cursor: 'pointer',
                borderLeft: `4px solid ${isAlert ? STATUS_TEXT_COLORS[status] : process.color}`,
                transition: 'box-shadow 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6b5a47' }}>{c.number}</span>
                <StatusBadge status={status} />
                <PriorityBadge priority={c.priority} />
                {c.paused && <span style={{ fontSize: 12, color: '#6b7280', background: '#f5f5f4', padding: '1px 6px', borderRadius: 4 }}>⏸ Пауза</span>}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8c7b6a' }}>
                  {c.responsible && `👤 ${c.responsible}`}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#2c2416', marginBottom: 6 }}>{c.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <StageChain stages={process.stages} currentIndex={c.stageIndex} color={process.color} compact />
                {dl && isValid(dl) && (
                  <span style={{
                    fontSize: 12, fontFamily: 'monospace',
                    color: STATUS_TEXT_COLORS[status], fontWeight: isAlert ? 700 : 400,
                  }}>
                    📅 {format(dl, 'd MMM yyyy', { locale: ru })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showCreate && <CreateCaseModal processId={id!} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
