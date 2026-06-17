import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { getCaseStatus } from '../utils/status'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'
import { StageChain } from '../components/StageChain'
import { Modal } from '../components/Modal'
import type { Priority } from '../types'
import { format, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'

const HISTORY_ICONS: Record<string, string> = {
  create: '✨', stage: '➡️', document: '📎', comment: '💬', pause: '⏸',
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#2c2416', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

export function CaseDetail() {
  const { id: processId, caseId } = useParams<{ id: string; caseId: string }>()
  const navigate = useNavigate()
  const {
    processes, cases, user,
    setStage, togglePause, deleteCase,
    updateCase, addComment, addDocument, removeDocument,
  } = useStore()

  const [commentText, setCommentText] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const process = processes.find((p) => p.id === processId)
  const caseData = cases.find((c) => c.id === caseId)

  if (!process || !caseData) {
    return <div style={{ padding: 24, color: '#dc2626' }}>Дело не найдено</div>
  }

  const status = getCaseStatus(caseData, process)
  const dl = caseData.deadline ? parseISO(caseData.deadline) : null
  const authorName = user.name || 'Неизвестно'

  function handleStageClick(idx: number) {
    if (idx !== caseData!.stageIndex) setStage(caseId!, idx, authorName)
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    addComment(caseId!, commentText.trim(), authorName)
    setCommentText('')
  }

  function handleDelete() {
    deleteCase(caseId!)
    navigate(`/process/${processId}`)
  }

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e7ddd0',
    borderRadius: 12, padding: '20px', marginBottom: 16,
  }
  const sectionTitle: React.CSSProperties = {
    margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#2c2416',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(`/process/${processId}`)} style={{
          background: '#f5ede0', border: '1px solid #e2d5c3',
          borderRadius: 8, padding: '6px 12px', fontSize: 13,
          cursor: 'pointer', color: '#6b5a47', fontWeight: 600,
        }}>← {process.shortName}</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: process.color }}>{caseData.number}</span>
            <StatusBadge status={status} />
            <PriorityBadge priority={caseData.priority} />
            {caseData.paused && <span style={{ fontSize: 12, background: '#f5f5f4', color: '#6b7280', padding: '2px 8px', borderRadius: 4 }}>⏸ Пауза</span>}
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#2c2416' }}>{caseData.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowEdit(true)} style={{
            background: '#f5ede0', border: '1px solid #e2d5c3',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            cursor: 'pointer', color: '#6b5a47', fontWeight: 600,
          }}>✏️ Изменить</button>
          <button onClick={() => togglePause(caseId!, authorName)} style={{
            background: caseData.paused ? '#fef3c7' : '#f5f5f4',
            border: `1px solid ${caseData.paused ? '#fcd34d' : '#d6d3d1'}`,
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            cursor: 'pointer', color: caseData.paused ? '#92400e' : '#6b7280', fontWeight: 600,
          }}>{caseData.paused ? '▶️ Снять с паузы' : '⏸ Пауза'}</button>
          <button onClick={() => setConfirmDelete(true)} style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            cursor: 'pointer', color: '#991b1b', fontWeight: 600,
          }}>🗑️</button>
        </div>
      </div>

      {/* Stages */}
      <div style={{ ...card, borderLeft: `4px solid ${process.color}` }}>
        <p style={{ ...sectionTitle }}>Этапы</p>
        <StageChain
          stages={process.stages}
          currentIndex={caseData.stageIndex}
          color={process.color}
          onStageClick={handleStageClick}
        />
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#8c7b6a' }}>
          Текущий этап: <strong style={{ color: process.color }}>{process.stages[caseData.stageIndex]}</strong>
          {' '}({caseData.stageIndex + 1} из {process.stages.length})
        </p>
      </div>

      {/* Fields */}
      <div style={card}>
        <p style={sectionTitle}>Детали дела</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <FieldRow label={process.partyLabel} value={caseData.party} />
          <FieldRow label="Ответственный" value={caseData.responsible} />
          <FieldRow label="Дата начала" value={caseData.startDate ? format(parseISO(caseData.startDate), 'd MMM yyyy', { locale: ru }) : '—'} />
          <FieldRow label="Срок исполнения" value={
            dl && isValid(dl)
              ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: status === 'overdue' ? '#dc2626' : status === 'urgent' ? '#d97706' : '#2c2416' }}>
                  {format(dl, 'd MMMM yyyy', { locale: ru })}
                </span>
              : '—'
          } />
          {process.hasAmount && (
            <FieldRow label="Сумма" value={
              caseData.amount != null
                ? <span style={{ fontFamily: 'monospace' }}>{caseData.amount.toLocaleString('ru-RU')} ₸</span>
                : '—'
            } />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Documents */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>📎 Документы</p>
            <button onClick={() => setShowAddDoc(true)} style={{
              background: '#f5ede0', border: '1px solid #e2d5c3',
              borderRadius: 6, padding: '5px 12px', fontSize: 13,
              cursor: 'pointer', color: '#6b5a47', fontWeight: 600,
            }}>+ Добавить</button>
          </div>
          {caseData.documents.length === 0 && (
            <p style={{ color: '#8c7b6a', fontSize: 14, margin: 0 }}>Нет документов</p>
          )}
          {caseData.documents.map((doc) => (
            <div key={doc.id} style={{
              background: '#faf6f0', border: '1px solid #e7ddd0',
              borderRadius: 8, padding: '10px 12px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2c2416' }}>{doc.title}</div>
                  <div style={{ fontSize: 12, color: '#8c7b6a', marginTop: 2 }}>
                    {doc.version && <span style={{ marginRight: 8 }}>версия: {doc.version}</span>}
                    {doc.date && <span style={{ fontFamily: 'monospace' }}>{doc.date}</span>}
                  </div>
                  {doc.note && <div style={{ fontSize: 12, color: '#6b5a47', marginTop: 4 }}>{doc.note}</div>}
                </div>
                <button onClick={() => removeDocument(caseId!, doc.id, authorName)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#dc2626', fontSize: 16, padding: 2,
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* History */}
        <div style={card}>
          <p style={sectionTitle}>💬 История</p>
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Добавить комментарий..."
              style={{
                flex: 1, padding: '8px 12px',
                border: '1px solid #d1c5b4', borderRadius: 8,
                fontSize: 13, background: '#fffcf7',
              }}
            />
            <button type="submit" style={{
              background: process.color, color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 13,
              cursor: 'pointer', fontWeight: 600,
            }}>→</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {[...caseData.history].reverse().map((entry) => (
              <div key={entry.id} style={{
                fontSize: 13, padding: '8px 10px',
                background: entry.type === 'comment' ? '#fffcf7' : '#faf6f0',
                border: '1px solid #e7ddd0', borderRadius: 8,
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span>{HISTORY_ICONS[entry.type] ?? '•'}</span>
                  <span style={{ fontWeight: 600, color: '#2c2416', fontSize: 12 }}>{entry.author}</span>
                  <span style={{ color: '#a08060', fontSize: 11, fontFamily: 'monospace', marginLeft: 'auto' }}>
                    {format(parseISO(entry.datetime), 'd MMM HH:mm', { locale: ru })}
                  </span>
                </div>
                <div style={{ color: '#4a3728' }}>{entry.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditCaseModal
          caseData={caseData}
          process={process}
          onClose={() => setShowEdit(false)}
          onSave={(data) => { updateCase(caseId!, data); setShowEdit(false) }}
        />
      )}

      {/* Add Document Modal */}
      {showAddDoc && (
        <AddDocModal
          onClose={() => setShowAddDoc(false)}
          onSave={(doc) => { addDocument(caseId!, doc, authorName); setShowAddDoc(false) }}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <Modal title="Удалить дело?" onClose={() => setConfirmDelete(false)} width={400}>
          <p style={{ color: '#6b5a47', marginBottom: 20 }}>
            Дело <strong>{caseData.number}</strong> «{caseData.title}» будет удалено безвозвратно.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDelete} style={{
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Удалить</button>
            <button onClick={() => setConfirmDelete(false)} style={{
              background: '#f5ede0', color: '#6b5a47', border: '1px solid #e2d5c3',
              borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Отмена</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EditCaseModal({ caseData, process, onClose, onSave }: {
  caseData: ReturnType<typeof useStore.getState>['cases'][0]
  process: ReturnType<typeof useStore.getState>['processes'][0]
  onClose: () => void
  onSave: (data: { title: string; party: string; responsible: string; priority: Priority; startDate: string; deadline: string; amount?: number }) => void
}) {
  const [form, setForm] = useState({
    title: caseData.title,
    party: caseData.party,
    responsible: caseData.responsible,
    priority: caseData.priority,
    startDate: caseData.startDate,
    deadline: caseData.deadline,
    amount: caseData.amount != null ? String(caseData.amount) : '',
  })

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #d1c5b4', borderRadius: 8,
    fontSize: 14, background: '#fffcf7', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6b5a47', marginBottom: 5 }
  const row: React.CSSProperties = { marginBottom: 14 }

  return (
    <Modal title="Редактировать дело" onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        onSave({ ...form, priority: form.priority as Priority, amount: form.amount ? Number(form.amount) : undefined })
      }}>
        <div style={row}>
          <label style={labelStyle}>Название / суть дела</label>
          <input required style={fieldStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div style={row}>
          <label style={labelStyle}>{process.partyLabel}</label>
          <input style={fieldStyle} value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />
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
            <input type="number" style={fieldStyle} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{
            background: '#f5ede0', color: '#6b5a47', border: '1px solid #e2d5c3',
            borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Отмена</button>
          <button type="submit" style={{
            background: process.color, color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>Сохранить</button>
        </div>
      </form>
    </Modal>
  )
}

function AddDocModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (doc: { title: string; version: string; date: string; note: string }) => void
}) {
  const [form, setForm] = useState({ title: '', version: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' })
  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #d1c5b4', borderRadius: 8,
    fontSize: 14, background: '#fffcf7', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6b5a47', marginBottom: 5 }
  return (
    <Modal title="Добавить документ" onClose={onClose} width={480}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Название документа *</label>
          <input required style={fieldStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Договор №123" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Версия / редакция</label>
            <input style={fieldStyle} value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v1.0, ред.2..." />
          </div>
          <div>
            <label style={labelStyle}>Дата</label>
            <input type="date" style={fieldStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Примечание / ссылка на хранилище</label>
          <input style={fieldStyle} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ссылка или описание места хранения" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} style={{
            background: '#f5ede0', color: '#6b5a47', border: '1px solid #e2d5c3',
            borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Отмена</button>
          <button type="submit" style={{
            background: '#92650a', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>Добавить</button>
        </div>
      </form>
    </Modal>
  )
}
