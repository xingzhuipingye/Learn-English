import express from 'express'
import cors from 'cors'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data', 'lessons')

const app = express()
app.use(cors())
app.use(express.json())

/** @type {Map<string, object>} */
const cache = new Map()

async function loadLesson(id) {
  if (cache.has(id)) return cache.get(id)
  const path = join(DATA_DIR, `${id}.json`)
  const raw = await readFile(path, 'utf8')
  const lesson = JSON.parse(raw)
  cache.set(id, lesson)
  return lesson
}

/**
 * GET /api/lessons
 * 返回课文列表（元数据，不含全文可选）
 */
app.get('/api/lessons', async (_req, res) => {
  try {
    const ids = ['primary-01']
    const list = []
    for (const id of ids) {
      const lesson = await loadLesson(id)
      list.push({
        id: lesson.id,
        module: lesson.module,
        title: lesson.title,
        sentenceCount: lesson.sentences?.length ?? 0,
      })
    }
    res.json(list)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'failed to list lessons' })
  }
})

/**
 * GET /api/lessons/:id
 * 返回完整课文：句子 → 词组 → 单词序列（供学习模式使用）
 */
app.get('/api/lessons/:id', async (req, res) => {
  try {
    const lesson = await loadLesson(req.params.id)
    res.json(lesson)
  } catch (e) {
    if (e.code === 'ENOENT') {
      res.status(404).json({ error: 'lesson not found' })
      return
    }
    console.error(e)
    res.status(500).json({ error: 'failed to load lesson' })
  }
})

const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, () => {
  console.log(`learn-english API http://localhost:${PORT}`)
})
