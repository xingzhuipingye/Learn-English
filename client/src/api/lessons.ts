import type { Lesson, LessonListItem } from '@shared/types/lesson'

export async function fetchLessonList(): Promise<LessonListItem[]> {
  const res = await fetch('/lessons/index.json')
  if (!res.ok) throw new Error('加载课文列表失败')
  return res.json()
}

export async function fetchLesson(id: string): Promise<Lesson> {
  const res = await fetch(`/lessons/${encodeURIComponent(id)}.json`)
  if (!res.ok) throw new Error('加载课文失败')
  return res.json()
}
