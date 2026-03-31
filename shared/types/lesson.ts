/**
 * 与 public/lessons 下 JSON 结构一致。
 */
export type LessonModule =
  | 'primary'
  | 'junior'
  | 'senior'
  | 'college'
  | 'toefl'
  | 'ielts'

export type LessonKind = 'learn' | 'listening'

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

/** 学习模式课文 */
export interface Lesson {
  id: string
  module: LessonModule
  title: string
  /** 教材章节标签，如「三上 Unit 1」 */
  chapter?: string
  /** 教材版本说明（展示用，范文为原创教材风格示例） */
  textbook?: string
  sentences: LessonSentence[]
}

/** 听力模式单题 */
export interface ListeningItem {
  id: string
  /** 朗读用完整句 */
  sentence: string
  /** 正确选项（小写比对，展示可首字母大写） */
  correct: string
  /** 四个选项（含正确项） */
  choices: string[]
}

/** 听力模式课文 */
export interface ListeningLesson {
  id: string
  module: LessonModule
  title: string
  chapter?: string
  textbook?: string
  items: ListeningItem[]
}

export interface LessonListItem {
  id: string
  module: LessonModule
  title: string
  kind: LessonKind
  /** 教材章节，用于列表分组与排序 */
  chapter?: string
  /** 同级内排序，数字越小越靠前 */
  order?: number
  /** 学习模式：句子数 */
  sentenceCount?: number
  /** 听力模式：题目数 */
  itemCount?: number
  /** 教材版本说明 */
  textbook?: string
}
