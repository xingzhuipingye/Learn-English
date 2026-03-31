import type { Lesson, LessonListItem } from '@shared/types/lesson'

/** GitHub Pages 子路径部署时 base 为 /Learn-English/，必须用 BASE_URL 拼接 */
function lessonUrl(path: string) {
  const base = import.meta.env.BASE_URL
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${base}${p}`
}

export async function fetchLessonList(): Promise<LessonListItem[]> {
  const res = await fetch(lessonUrl('lessons/index.json'))
  if (!res.ok) throw new Error('加载课文列表失败')
  return res.json()
}

export async function fetchLesson(id: string): Promise<Lesson> {
  const res = await fetch(lessonUrl(`lessons/${encodeURIComponent(id)}.json`))
  if (!res.ok) throw new Error('加载课文失败')
  return res.json()
}
