/**
 * 与 server/data/lessons/*.json 结构一致，前后端可各自引用或复制。
 */
export type LessonModule =
  | 'primary'
  | 'junior'
  | 'senior'
  | 'college'
  | 'toefl'
  | 'ielts'

export interface LessonPhrase {
  id: string
  /** 整段词组文案，用于展示与 TTS */
  text: string
  /** 按顺序拆分的单词，用户逐词、逐字母输入 */
  words: string[]
}

export interface LessonSentence {
  id: string
  phrases: LessonPhrase[]
}

export interface Lesson {
  id: string
  module: LessonModule
  title: string
  sentences: LessonSentence[]
}

export interface LessonListItem {
  id: string
  module: LessonModule
  title: string
  sentenceCount: number
}
