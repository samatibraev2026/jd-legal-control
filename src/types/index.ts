export type Priority = 'high' | 'medium' | 'low'

export type HistoryType = 'create' | 'stage' | 'document' | 'comment' | 'pause'

export type CaseStatus = 'overdue' | 'urgent' | 'active' | 'completed' | 'paused'

export interface HistoryEntry {
  id: string
  type: HistoryType
  text: string
  datetime: string
  author: string
}

export interface DocumentRecord {
  id: string
  title: string
  version: string
  date: string
  note: string
}

export interface Case {
  id: string
  processId: string
  number: string
  title: string
  party: string
  responsible: string
  priority: Priority
  startDate: string
  deadline: string
  amount?: number
  stageIndex: number
  paused: boolean
  documents: DocumentRecord[]
  history: HistoryEntry[]
}

export interface Process {
  id: string
  name: string
  shortName: string
  prefix: string
  color: string
  icon: string
  hasAmount: boolean
  partyLabel: string
  stages: string[]
  caseCounter: number
  isDefault: boolean
}

export interface UserProfile {
  name: string
}
