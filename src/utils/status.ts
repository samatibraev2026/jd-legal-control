import type { Case, CaseStatus, Process } from '../types'
import { differenceInDays, parseISO, isValid } from 'date-fns'

export function getCaseStatus(c: Case, process: Process): CaseStatus {
  if (c.paused) return 'paused'
  if (c.stageIndex >= process.stages.length - 1) return 'completed'
  if (!c.deadline) return 'active'
  const deadline = parseISO(c.deadline)
  if (!isValid(deadline)) return 'active'
  const days = differenceInDays(deadline, new Date())
  if (days < 0) return 'overdue'
  if (days <= 3) return 'urgent'
  return 'active'
}

export function isAlertStatus(status: CaseStatus): boolean {
  return status === 'overdue' || status === 'urgent'
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  overdue: 'Просрочено',
  urgent: 'Срок близко',
  active: 'В работе',
  completed: 'Завершено',
  paused: 'Приостановлено',
}

export const STATUS_COLORS: Record<CaseStatus, string> = {
  overdue: '#fee2e2',
  urgent: '#fef3c7',
  active: '#f0fdf4',
  completed: '#f0f9ff',
  paused: '#f5f5f4',
}

export const STATUS_TEXT_COLORS: Record<CaseStatus, string> = {
  overdue: '#991b1b',
  urgent: '#92400e',
  active: '#166534',
  completed: '#0369a1',
  paused: '#57534e',
}

export const STATUS_BORDER_COLORS: Record<CaseStatus, string> = {
  overdue: '#fca5a5',
  urgent: '#fcd34d',
  active: '#86efac',
  completed: '#7dd3fc',
  paused: '#d6d3d1',
}
