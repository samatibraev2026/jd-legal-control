import { create } from 'zustand'
import type { Case, Process, UserProfile, DocumentRecord, HistoryEntry } from '../types'
import { DEFAULT_PROCESSES } from '../data/defaultProcesses'
import { generateId, generateCaseNumber } from '../utils/id'

const PROCESSES_KEY = 'jd_processes'
const CASES_KEY = 'jd_cases'
const USER_KEY = 'jd_user'

function loadProcesses(): Process[] {
  try {
    const raw = localStorage.getItem(PROCESSES_KEY)
    const saved: Process[] = raw ? JSON.parse(raw) : []
    // Merge: add any missing default processes
    const savedIds = new Set(saved.map((p) => p.id))
    const toAdd: Process[] = DEFAULT_PROCESSES
      .filter((dp) => !savedIds.has(dp.id))
      .map((dp) => ({ ...dp, caseCounter: 0 }))
    const merged = [...saved, ...toAdd]
    if (toAdd.length > 0) {
      localStorage.setItem(PROCESSES_KEY, JSON.stringify(merged))
    }
    return merged
  } catch {
    return DEFAULT_PROCESSES.map((dp) => ({ ...dp, caseCounter: 0 }))
  }
}

function loadCases(): Case[] {
  try {
    const raw = localStorage.getItem(CASES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadUser(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : { name: '' }
  } catch {
    return { name: '' }
  }
}

function saveProcesses(processes: Process[]) {
  localStorage.setItem(PROCESSES_KEY, JSON.stringify(processes))
}

function saveCases(cases: Case[]) {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases))
}

function saveUser(user: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

interface AppStore {
  processes: Process[]
  cases: Case[]
  user: UserProfile

  // Process actions
  addProcess: (data: Omit<Process, 'id' | 'caseCounter' | 'isDefault'>) => void
  updateProcess: (id: string, data: Partial<Omit<Process, 'id' | 'caseCounter'>>) => void
  deleteProcess: (id: string) => { ok: boolean; error?: string }

  // Case actions
  addCase: (data: Omit<Case, 'id' | 'number' | 'history' | 'documents' | 'stageIndex' | 'paused'>, authorName: string) => Case
  updateCase: (id: string, data: Partial<Pick<Case, 'title' | 'party' | 'responsible' | 'priority' | 'startDate' | 'deadline' | 'amount'>>) => void
  setStage: (caseId: string, stageIndex: number, authorName: string) => void
  togglePause: (caseId: string, authorName: string) => void
  deleteCase: (id: string) => void
  addComment: (caseId: string, text: string, authorName: string) => void
  addDocument: (caseId: string, doc: Omit<DocumentRecord, 'id'>, authorName: string) => void
  removeDocument: (caseId: string, docId: string, authorName: string) => void

  // User actions
  setUserName: (name: string) => void

  // Danger
  clearAll: () => void
}

export const useStore = create<AppStore>((set, get) => ({
  processes: loadProcesses(),
  cases: loadCases(),
  user: loadUser(),

  addProcess: (data) => {
    const newProcess: Process = {
      ...data,
      id: generateId(),
      caseCounter: 0,
      isDefault: false,
    }
    const updated = [...get().processes, newProcess]
    set({ processes: updated })
    saveProcesses(updated)
  },

  updateProcess: (id, data) => {
    const updated = get().processes.map((p) =>
      p.id === id ? { ...p, ...data } : p
    )
    // Handle deleted stages: move cases on missing stages to last available
    const process = updated.find((p) => p.id === id)
    if (process && data.stages) {
      const maxIdx = process.stages.length - 1
      const updatedCases = get().cases.map((c) => {
        if (c.processId !== id) return c
        if (c.stageIndex > maxIdx) return { ...c, stageIndex: maxIdx }
        return c
      })
      set({ processes: updated, cases: updatedCases })
      saveProcesses(updated)
      saveCases(updatedCases)
    } else {
      set({ processes: updated })
      saveProcesses(updated)
    }
  },

  deleteProcess: (id) => {
    const hasCases = get().cases.some((c) => c.processId === id)
    if (hasCases) {
      return { ok: false, error: 'Нельзя удалить процесс: по нему есть дела.' }
    }
    const updated = get().processes.filter((p) => p.id !== id)
    set({ processes: updated })
    saveProcesses(updated)
    return { ok: true }
  },

  addCase: (data, authorName) => {
    const processes = get().processes
    const process = processes.find((p) => p.id === data.processId)!
    const counter = process.caseCounter + 1
    const number = generateCaseNumber(process.prefix, counter)
    const now = new Date().toISOString()
    const historyEntry: HistoryEntry = {
      id: generateId(),
      type: 'create',
      text: `Дело создано`,
      datetime: now,
      author: authorName || 'Неизвестно',
    }
    const newCase: Case = {
      ...data,
      id: generateId(),
      number,
      stageIndex: 0,
      paused: false,
      documents: [],
      history: [historyEntry],
    }
    const updatedProcesses = processes.map((p) =>
      p.id === data.processId ? { ...p, caseCounter: counter } : p
    )
    const updatedCases = [...get().cases, newCase]
    set({ processes: updatedProcesses, cases: updatedCases })
    saveProcesses(updatedProcesses)
    saveCases(updatedCases)
    return newCase
  },

  updateCase: (id, data) => {
    const updated = get().cases.map((c) => (c.id === id ? { ...c, ...data } : c))
    set({ cases: updated })
    saveCases(updated)
  },

  setStage: (caseId, stageIndex, authorName) => {
    const c = get().cases.find((x) => x.id === caseId)
    if (!c) return
    const process = get().processes.find((p) => p.id === c.processId)
    if (!process) return
    const fromStage = process.stages[c.stageIndex]
    const toStage = process.stages[stageIndex]
    const entry: HistoryEntry = {
      id: generateId(),
      type: 'stage',
      text: `Этап изменён: «${fromStage}» → «${toStage}»`,
      datetime: new Date().toISOString(),
      author: authorName || 'Неизвестно',
    }
    const updated = get().cases.map((x) =>
      x.id === caseId
        ? { ...x, stageIndex, history: [...x.history, entry] }
        : x
    )
    set({ cases: updated })
    saveCases(updated)
  },

  togglePause: (caseId, authorName) => {
    const c = get().cases.find((x) => x.id === caseId)
    if (!c) return
    const paused = !c.paused
    const entry: HistoryEntry = {
      id: generateId(),
      type: 'pause',
      text: paused ? 'Дело поставлено на паузу' : 'Дело снято с паузы',
      datetime: new Date().toISOString(),
      author: authorName || 'Неизвестно',
    }
    const updated = get().cases.map((x) =>
      x.id === caseId ? { ...x, paused, history: [...x.history, entry] } : x
    )
    set({ cases: updated })
    saveCases(updated)
  },

  deleteCase: (id) => {
    const updated = get().cases.filter((c) => c.id !== id)
    set({ cases: updated })
    saveCases(updated)
  },

  addComment: (caseId, text, authorName) => {
    const entry: HistoryEntry = {
      id: generateId(),
      type: 'comment',
      text,
      datetime: new Date().toISOString(),
      author: authorName || 'Неизвестно',
    }
    const updated = get().cases.map((c) =>
      c.id === caseId ? { ...c, history: [...c.history, entry] } : c
    )
    set({ cases: updated })
    saveCases(updated)
  },

  addDocument: (caseId, doc, authorName) => {
    const newDoc: DocumentRecord = { ...doc, id: generateId() }
    const entry: HistoryEntry = {
      id: generateId(),
      type: 'document',
      text: `Добавлен документ: «${doc.title}» (${doc.version || 'без версии'})`,
      datetime: new Date().toISOString(),
      author: authorName || 'Неизвестно',
    }
    const updated = get().cases.map((c) =>
      c.id === caseId
        ? { ...c, documents: [...c.documents, newDoc], history: [...c.history, entry] }
        : c
    )
    set({ cases: updated })
    saveCases(updated)
  },

  removeDocument: (caseId, docId, authorName) => {
    const c = get().cases.find((x) => x.id === caseId)
    if (!c) return
    const doc = c.documents.find((d) => d.id === docId)
    const entry: HistoryEntry = {
      id: generateId(),
      type: 'document',
      text: `Удалён документ: «${doc?.title ?? docId}»`,
      datetime: new Date().toISOString(),
      author: authorName || 'Неизвестно',
    }
    const updated = get().cases.map((x) =>
      x.id === caseId
        ? {
            ...x,
            documents: x.documents.filter((d) => d.id !== docId),
            history: [...x.history, entry],
          }
        : x
    )
    set({ cases: updated })
    saveCases(updated)
  },

  setUserName: (name) => {
    const user = { name }
    set({ user })
    saveUser(user)
  },

  clearAll: () => {
    localStorage.removeItem(PROCESSES_KEY)
    localStorage.removeItem(CASES_KEY)
    const processes = DEFAULT_PROCESSES.map((dp) => ({ ...dp, caseCounter: 0 }))
    const cases: Case[] = []
    set({ processes, cases })
    saveProcesses(processes)
    saveCases(cases)
  },
}))
