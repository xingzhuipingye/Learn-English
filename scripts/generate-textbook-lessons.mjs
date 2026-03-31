/**
 * 按「章节」批量生成 client/public/lessons 下的 JSON 与 index.json。
 * 运行：在项目根目录执行 node scripts/generate-textbook-lessons.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { primaryUnits } from './curriculum/primary.mjs'
import { juniorUnits } from './curriculum/junior.mjs'
import { seniorUnits } from './curriculum/senior.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const lessonsDir = path.join(root, 'client/public/lessons')
const learnDir = path.join(lessonsDir, 'learn')
const listenDir = path.join(lessonsDir, 'listen')

function pad(n) {
  return String(n).padStart(2, '0')
}

function writeLearn(module, id, u) {
  const sentences = u.learn.map((line, si) => ({
    id: `s${si + 1}`,
    phrases: [
      {
        id: `s${si + 1}-p1`,
        text: line[0],
        words: line[1],
      },
    ],
  }))
  const json = {
    id,
    module,
    title: u.title,
    chapter: u.chapter,
    textbook: u.textbook,
    sentences,
  }
  fs.writeFileSync(path.join(learnDir, `${id}.json`), JSON.stringify(json, null, 2) + '\n', 'utf8')
}

function writeListen(module, id, u) {
  const items = u.listen.map((it, i) => ({
    id: `i${i + 1}`,
    sentence: it.sentence,
    correct: it.correct,
    choices: it.choices,
  }))
  const json = {
    id,
    module,
    title: `${u.title} · 听力`,
    chapter: u.chapter,
    textbook: u.textbook,
    items,
  }
  fs.writeFileSync(path.join(listenDir, `${id}.json`), JSON.stringify(json, null, 2) + '\n', 'utf8')
}

function processUnits(module, prefix, units) {
  const out = []
  units.forEach((u, idx) => {
    const n = pad(idx + 1)
    const learnId = `${prefix}-${n}`
    const listenId = `${prefix}-l${n}`
    writeLearn(module, learnId, u)
    writeListen(module, listenId, u)
    const order = u.order ?? idx + 1
    out.push({
      id: learnId,
      module,
      title: u.title,
      kind: 'learn',
      chapter: u.chapter,
      order,
      sentenceCount: u.learn.length,
      textbook: u.textbook,
    })
    out.push({
      id: listenId,
      module,
      title: `${u.title} · 听力`,
      kind: 'listening',
      chapter: u.chapter,
      order,
      itemCount: u.listen.length,
      textbook: u.textbook,
    })
  })
  return out
}

fs.mkdirSync(learnDir, { recursive: true })
fs.mkdirSync(listenDir, { recursive: true })

const index = [
  ...processUnits('primary', 'primary', primaryUnits),
  ...processUnits('junior', 'junior', juniorUnits),
  ...processUnits('senior', 'senior', seniorUnits),
]

fs.writeFileSync(path.join(lessonsDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')

console.log(
  'OK: index entries',
  index.length,
  '— learn+listen files',
  primaryUnits.length * 2 + juniorUnits.length * 2 + seniorUnits.length * 2,
)
