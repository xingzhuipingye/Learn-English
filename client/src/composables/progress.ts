import type { LessonKind } from '@shared/types/lesson'

const PROGRESS_KEY = 'learn-english-progress-v2'

export interface LearnProgressRecord {
  /** 已完成词组数（学习模式） */
  completedPhrases: number
  totalPhrases: number
  /** 是否整课完成 */
  completed: boolean
  updatedAt: string
}

export interface ListenProgressRecord {
  /** 已完成题目数 */
  completedItems: number
  totalItems: number
  completed: boolean
  updatedAt: string
}

type UserProgress = {
  learn: Record<string, LearnProgressRecord>
  listen: Record<string, ListenProgressRecord>
}

type Store = Record<string, UserProgress>

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStore(s: Store) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(s))
}

export function saveLearnProgress(
  username: string,
  lessonId: string,
  patch: Partial<LearnProgressRecord> & Pick<LearnProgressRecord, 'completedPhrases' | 'totalPhrases'>,
) {
  const s = loadStore()
  if (!s[username]) s[username] = { learn: {}, listen: {} }
  const prev = s[username].learn[lessonId] ?? {
    completedPhrases: 0,
    totalPhrases: patch.totalPhrases,
    completed: false,
    updatedAt: new Date().toISOString(),
  }
  s[username].learn[lessonId] = {
    ...prev,
    ...patch,
    completed:
      patch.completed ??
      (patch.completedPhrases >= patch.totalPhrases && patch.totalPhrases > 0),
    updatedAt: new Date().toISOString(),
  }
  saveStore(s)
}

export function saveListenProgress(
  username: string,
  lessonId: string,
  patch: Partial<ListenProgressRecord> & Pick<ListenProgressRecord, 'completedItems' | 'totalItems'>,
) {
  const s = loadStore()
  if (!s[username]) s[username] = { learn: {}, listen: {} }
  const prev = s[username].listen[lessonId] ?? {
    completedItems: 0,
    totalItems: patch.totalItems,
    completed: false,
    updatedAt: new Date().toISOString(),
  }
  s[username].listen[lessonId] = {
    ...prev,
    ...patch,
    completed:
      patch.completed ??
      (patch.completedItems >= patch.totalItems && patch.totalItems > 0),
    updatedAt: new Date().toISOString(),
  }
  saveStore(s)
}

export function getProgressPercent(
  username: string | null,
  lessonId: string,
  kind: LessonKind,
): number | null {
  if (!username) return null
  const s = loadStore()[username]
  if (!s) return null
  if (kind === 'learn') {
    const r = s.learn[lessonId]
    if (!r || !r.totalPhrases) return null
    return Math.min(100, Math.round((r.completedPhrases / r.totalPhrases) * 100))
  }
  const r = s.listen[lessonId]
  if (!r || !r.totalItems) return null
  return Math.min(100, Math.round((r.completedItems / r.totalItems) * 100))
}

export function getLearnRecord(username: string | null, lessonId: string): LearnProgressRecord | null {
  if (!username) return null
  return loadStore()[username]?.learn[lessonId] ?? null
}

/** 记录本次会话中已完成的词组数（与历史进度取较大值，避免重复学习时进度回退） */
export function recordLearnPhraseDone(
  username: string,
  lessonId: string,
  sessionCompletedPhrases: number,
  totalPhrases: number,
) {
  const prev = getLearnRecord(username, lessonId)
  const cp = Math.min(totalPhrases, Math.max(prev?.completedPhrases ?? 0, sessionCompletedPhrases))
  const completed = (prev?.completed ?? false) || cp >= totalPhrases
  saveLearnProgress(username, lessonId, {
    completedPhrases: cp,
    totalPhrases,
    completed,
  })
}

export function getListenRecord(username: string | null, lessonId: string): ListenProgressRecord | null {
  if (!username) return null
  return loadStore()[username]?.listen[lessonId] ?? null
}

export function recordListenItemDone(
  username: string,
  lessonId: string,
  sessionCompletedItems: number,
  totalItems: number,
) {
  const prev = getListenRecord(username, lessonId)
  const ci = Math.min(totalItems, Math.max(prev?.completedItems ?? 0, sessionCompletedItems))
  const completed = (prev?.completed ?? false) || ci >= totalItems
  saveListenProgress(username, lessonId, {
    completedItems: ci,
    totalItems,
    completed,
  })
}

/** 开发调试：清空进度 */
export function clearAllProgress() {
  localStorage.removeItem(PROGRESS_KEY)
}
