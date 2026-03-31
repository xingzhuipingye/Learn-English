<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchLearnLesson } from '../api/lessons'
import { getCurrentUsername } from '../composables/auth'
import { recordLearnPhraseDone } from '../composables/progress'
import type { Lesson, LessonPhrase } from '@shared/types/lesson'

const props = defineProps<{ lessonId: string }>()
const router = useRouter()

const lesson = ref<Lesson | null>(null)
const loadError = ref<string | null>(null)

const sentenceIndex = ref(0)
const phraseIndex = ref(0)
const wordIndex = ref(0)

const typed = ref<{ ch: string; ok: boolean }[]>([])
const committedWords = ref<{ ch: string; ok: boolean }[][]>([])
const celebrating = ref(false)

const speechToken = ref(0)
/** 朗读次数固定为 3 次（已移除界面配置） */
const SPEECH_REPEAT = 3
const speechGapMs = ref(1200)
const speechRate = ref(0.72)

const hitFlash = ref<{ w: number; c: number; kind: 'ok' | 'bad' } | null>(null)
let hitFlashTimer: ReturnType<typeof setTimeout> | null = null
const stageBump = ref(false)
let stageBumpTimer: ReturnType<typeof setTimeout> | null = null
const wordShake = ref(false)
let wordShakeTimer: ReturnType<typeof setTimeout> | null = null

const currentSentence = computed(() => lesson.value?.sentences[sentenceIndex.value] ?? null)
const currentPhrase = computed((): LessonPhrase | null => {
  const s = currentSentence.value
  if (!s) return null
  return s.phrases[phraseIndex.value] ?? null
})
const phraseWords = computed(() => currentPhrase.value?.words ?? [])

function normalizeWord(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]/gi, '')
}

const typingWords = computed(() => phraseWords.value.map((word) => normalizeWord(word)))
const currentExpectedWord = computed(() => typingWords.value[wordIndex.value] ?? '')

function countPhrases(les: Lesson) {
  return les.sentences.reduce((sum, s) => sum + s.phrases.length, 0)
}

const totalPhrases = computed(() => (lesson.value ? countPhrases(lesson.value) : 0))
const completedPhraseCount = ref(0)

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function speakPhraseOnce(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = speechRate.value
  window.speechSynthesis.speak(u)
}

async function speakPhrase(text: string, repeat = 3, gapMs = 1200) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  speechToken.value += 1
  const token = speechToken.value
  window.speechSynthesis.cancel()
  for (let i = 0; i < repeat; i++) {
    if (token !== speechToken.value) return
    speakPhraseOnce(text)
    if (i < repeat - 1) await sleep(gapMs)
  }
}

function speakAgain() {
  const t = currentPhrase.value?.text
  if (t) speakPhrase(t, SPEECH_REPEAT, speechGapMs.value)
}

function resetWordBuffer() {
  typed.value = []
}

function triggerHitFlash(w: number, c: number, kind: 'ok' | 'bad') {
  if (hitFlashTimer) clearTimeout(hitFlashTimer)
  hitFlash.value = { w, c, kind }
  hitFlashTimer = setTimeout(() => {
    hitFlash.value = null
    hitFlashTimer = null
  }, 320)
}

function triggerStageBump() {
  if (stageBumpTimer) clearTimeout(stageBumpTimer)
  stageBump.value = true
  stageBumpTimer = setTimeout(() => {
    stageBump.value = false
    stageBumpTimer = null
  }, 180)
}

function triggerWordShake() {
  if (wordShakeTimer) clearTimeout(wordShakeTimer)
  wordShake.value = true
  wordShakeTimer = setTimeout(() => {
    wordShake.value = false
    wordShakeTimer = null
  }, 420)
}

function advanceWord() {
  const words = typingWords.value
  committedWords.value[wordIndex.value] = [...typed.value]
  if (wordIndex.value < words.length - 1) {
    wordIndex.value += 1
    resetWordBuffer()
    return
  }
  finishPhrase()
}

function finishPhrase() {
  celebrating.value = true
  resetWordBuffer()
  committedWords.value = []
  completedPhraseCount.value += 1
  const u = getCurrentUsername()
  const L = lesson.value
  if (u && L && totalPhrases.value > 0) {
    recordLearnPhraseDone(u, L.id, completedPhraseCount.value, totalPhrases.value)
  }
  window.setTimeout(() => {
    celebrating.value = false
    const s = lesson.value?.sentences[sentenceIndex.value]
    if (!s) return
    if (phraseIndex.value < s.phrases.length - 1) {
      phraseIndex.value += 1
      wordIndex.value = 0
    } else if (sentenceIndex.value < (lesson.value?.sentences.length ?? 0) - 1) {
      sentenceIndex.value += 1
      phraseIndex.value = 0
      wordIndex.value = 0
    } else {
      router.push({ name: 'home' })
    }
  }, 1600)
}

function checkWordComplete() {
  const expected = currentExpectedWord.value
  if (!expected || typed.value.length !== expected.length) return
  if (!typed.value.every((t) => t.ok)) return
  advanceWord()
}

/** 仅接受单键字母数字；展示用原始大小写，不参与强转 */
function getAcceptableKey(k: string) {
  if (k.length !== 1) return null
  if (!/[a-z0-9]/i.test(k)) return null
  return k
}

/** 与 normalizeWord 中单字符一致：字母转小写比对，数字原样 */
function normalizeKeyForMatch(k: string) {
  if (/[a-zA-Z]/.test(k)) return k.toLowerCase()
  return k
}

function onKeyDown(e: KeyboardEvent) {
  if (celebrating.value || !lesson.value) return
  if (e.metaKey || e.ctrlKey || e.altKey) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    typed.value = typed.value.slice(0, -1)
    if (hitFlashTimer) {
      clearTimeout(hitFlashTimer)
      hitFlash.value = null
    }
    return
  }

  const raw = getAcceptableKey(e.key)
  if (!raw) return

  const expected = currentExpectedWord.value
  if (!expected) return
  if (typed.value.length >= expected.length) return

  e.preventDefault()
  const idx = typed.value.length
  const ok = expected[idx] === normalizeKeyForMatch(raw)
  typed.value = [...typed.value, { ch: raw, ok }]
  triggerHitFlash(wordIndex.value, idx, ok ? 'ok' : 'bad')
  triggerStageBump()
  if (!ok) triggerWordShake()
  nextTick(() => checkWordComplete())
}

function getCharAt(wordIdx: number, charIdx: number) {
  if (wordIdx < wordIndex.value) return committedWords.value[wordIdx]?.[charIdx] ?? null
  if (wordIdx === wordIndex.value) return typed.value[charIdx] ?? null
  return null
}

function isFlashSlot(wIdx: number, cIdx: number, kind: 'ok' | 'bad') {
  const h = hitFlash.value
  return h !== null && h.w === wIdx && h.c === cIdx && h.kind === kind
}

watch(
  () => [sentenceIndex.value, phraseIndex.value] as const,
  () => {
    wordIndex.value = 0
    resetWordBuffer()
    committedWords.value = []
    const t = currentPhrase.value?.text
    if (t) speakPhrase(t, SPEECH_REPEAT, speechGapMs.value)
  },
)

onMounted(async () => {
  try {
    completedPhraseCount.value = 0
    lesson.value = await fetchLearnLesson(props.lessonId)
    const t = currentPhrase.value?.text
    if (t) speakPhrase(t, SPEECH_REPEAT, speechGapMs.value)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
  }
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  speechToken.value += 1
  window.removeEventListener('keydown', onKeyDown)
  window.speechSynthesis?.cancel()
  if (hitFlashTimer) clearTimeout(hitFlashTimer)
  if (stageBumpTimer) clearTimeout(stageBumpTimer)
  if (wordShakeTimer) clearTimeout(wordShakeTimer)
})

const progressLabel = computed(() => {
  if (!lesson.value) return ''
  const si = sentenceIndex.value + 1
  const st = lesson.value.sentences.length
  const pi = phraseIndex.value + 1
  const pt = currentSentence.value?.phrases.length ?? 0
  const wi = wordIndex.value + 1
  const wt = typingWords.value.length
  return `第 ${si}/${st} 句 · 词组 ${pi}/${pt} · 单词 ${wi}/${wt}`
})
</script>

<template>
  <div class="learn" tabindex="-1">
    <header class="top-bar">
      <div class="top-bar__left">
        <RouterLink to="/" class="nav-back">← 首页</RouterLink>
      </div>
      <div class="top-bar__center">
        <template v-if="lesson">
          <span v-if="lesson.chapter" class="lesson-chapter">{{ lesson.chapter }}</span>
          <span class="lesson-title">{{ lesson.title }}</span>
        </template>
      </div>
      <div v-if="lesson" class="top-bar__right" aria-label="读音设置">
        <label class="control-field">
          <span class="control-field__label">间隔</span>
          <select v-model.number="speechGapMs" class="control-field__select">
            <option :value="800">0.8s</option>
            <option :value="1000">1.0s</option>
            <option :value="1200">1.2s</option>
            <option :value="1500">1.5s</option>
            <option :value="2000">2.0s</option>
          </select>
        </label>
        <label class="control-field">
          <span class="control-field__label">读速</span>
          <select v-model.number="speechRate" class="control-field__select">
            <option :value="0.55">慢</option>
            <option :value="0.72">中</option>
            <option :value="0.88">快</option>
          </select>
        </label>
      </div>
    </header>

    <p v-if="loadError" class="err">{{ loadError }}</p>

    <template v-else-if="lesson">
      <p class="hint-mini">按顺序输入词组中每个单词；字母对错会标色。</p>
      <p v-if="lesson.textbook" class="textbook-hint">{{ lesson.textbook }}</p>
      <p class="progress">{{ progressLabel }}</p>

      <section
        class="stage"
        :class="{ 'stage--bump': stageBump }"
        aria-live="polite"
      >
        <div class="stage__phrase-block">
          <p class="phrase">{{ currentPhrase?.text }}</p>
          <button type="button" class="btn-speak" @click="speakAgain">
            <span class="btn-speak__icon" aria-hidden="true">🔊</span>
            再听一遍
          </button>
        </div>

        <div class="stage__slots" role="textbox" aria-label="输入显示区">
          <span
            v-for="(word, wIdx) in typingWords"
            :key="`${wIdx}-${word}`"
            class="word-slot"
            :class="{
              active: wIdx === wordIndex,
              'word-slot--shake': wIdx === wordIndex && wordShake,
            }"
          >
            <span
              v-for="(_, cIdx) in Array.from(word)"
              :key="cIdx"
              class="slot-ch"
              :class="{
                ok: getCharAt(wIdx, cIdx)?.ok === true,
                bad: getCharAt(wIdx, cIdx)?.ok === false,
                'slot-ch--empty': !getCharAt(wIdx, cIdx),
                'slot-ch--pop': isFlashSlot(wIdx, cIdx, 'ok'),
                'slot-ch--flash-bad': isFlashSlot(wIdx, cIdx, 'bad'),
              }"
            >
              {{ getCharAt(wIdx, cIdx)?.ch ?? '\u00a0' }}
            </span>
          </span>
        </div>
      </section>
    </template>

    <Teleport to="body">
      <div v-if="celebrating" class="celebrate" aria-hidden="true">
        <div class="firework firework--left" />
        <div class="firework firework--right" />
        <p class="yay">Congratulations!</p>
        <div
          v-for="n in 28"
          :key="n"
          class="particle"
          :style="{ '--d': `${(n * 31) % 360}deg`, '--n': n }"
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.learn {
  padding: 1rem 1rem 2.5rem;
  outline: none;
  min-height: 100%;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 8% 10%, rgba(34, 197, 94, 0.12), transparent 45%),
    radial-gradient(circle at 90% 20%, rgba(16, 185, 129, 0.1), transparent 35%),
    linear-gradient(180deg, #f7fcf9 0%, #f0f8f4 52%, #f8fbf9 100%);
}

.top-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: start;
  gap: 0.5rem 1rem;
  margin-bottom: 0.35rem;
  max-width: 52rem;
  margin-left: auto;
  margin-right: auto;
}

.top-bar__left {
  justify-self: start;
  padding-top: 0.15rem;
}

.top-bar__center {
  justify-self: center;
  text-align: center;
  min-width: 0;
}

.top-bar__right {
  justify-self: end;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 0.65rem;
}

.lesson-chapter {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  color: #15803d;
  letter-spacing: 0.04em;
  margin-bottom: 0.15rem;
}

.lesson-title {
  font-size: clamp(1rem, 2.8vw, 1.2rem);
  font-weight: 600;
  color: var(--text-h);
  letter-spacing: -0.02em;
}

@media (max-width: 560px) {
  .top-bar {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .top-bar__center {
    order: -1;
  }

  .top-bar__right {
    justify-content: flex-start;
  }
}

.err {
  color: #dc2626;
  text-align: center;
  max-width: 40rem;
  margin: 0.5rem auto 0;
}

.hint-mini {
  margin: 0 auto 0.35rem;
  max-width: 52rem;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--text);
  opacity: 0.55;
  text-align: center;
}

.textbook-hint {
  margin: 0.25rem auto 0.5rem;
  max-width: 52rem;
  font-size: 0.7rem;
  line-height: 1.4;
  color: var(--text);
  opacity: 0.5;
  text-align: center;
  font-style: italic;
}

.progress {
  font-size: 0.8rem;
  margin: 0 auto 1.1rem;
  opacity: 0.72;
  text-align: center;
  max-width: 52rem;
}

.stage {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1.5rem 1.2rem 1.8rem;
  border-radius: 24px;
  border: 1px solid #d1fae5;
  background: #ffffff;
  box-shadow:
    0 10px 35px rgba(16, 185, 129, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.92) inset;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}

.stage--bump {
  transform: scale(1.006);
  box-shadow:
    0 12px 40px rgba(16, 185, 129, 0.23),
    0 0 0 1px rgba(16, 185, 129, 0.16) inset;
}

.stage__phrase-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.phrase {
  margin: 0;
  font-size: clamp(1.15rem, 3.5vw, 1.45rem);
  font-weight: 600;
  color: var(--text-h);
  line-height: 1.55;
  text-align: center;
  max-width: 38rem;
  letter-spacing: 0.01em;
}

.btn-speak {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid #86efac;
  background: #dcfce7;
  color: #166534;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.btn-speak:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn-speak:active {
  transform: translateY(0);
}

.btn-speak__icon {
  font-size: 1rem;
  line-height: 1;
}

.stage__slots {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 1rem 1.25rem;
  min-height: 3rem;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: clamp(1.05rem, 2.8vw, 1.28rem);
}

.word-slot {
  display: inline-flex;
  gap: 0.12rem;
  padding: 0.35rem 0.5rem 0.45rem;
  border-radius: 12px;
  border-bottom: 3px solid transparent;
  background: #f0fdf4;
  transition: border-color 0.15s ease, background 0.15s ease;
}

@media (prefers-color-scheme: dark) {
  .word-slot {
    background: rgba(255, 255, 255, 0.04);
  }
}

.word-slot.active {
  border-bottom-color: #22c55e;
  background: #dcfce7;
}

.word-slot--shake {
  animation: slot-shake 0.38s ease;
}

.slot-ch {
  min-width: 0.72em;
  min-height: 1.35em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #86a89a;
  border-bottom: 2px solid currentColor;
  padding-bottom: 0.08em;
  transition:
    color 0.12s ease,
    border-color 0.12s ease,
    transform 0.12s ease;
}

.slot-ch--empty {
  color: #bbd6c4;
  border-bottom-color: #bbd6c4;
}

@media (prefers-color-scheme: dark) {
  .slot-ch--empty {
    color: #4b5563;
    border-bottom-color: #4b5563;
  }
}

.slot-ch.ok {
  color: #15803d;
  border-bottom-color: rgba(34, 197, 94, 0.6);
}

.slot-ch.bad {
  color: #dc2626;
  border-bottom-color: rgba(220, 38, 38, 0.55);
}

@media (max-width: 768px) {
  .learn {
    padding: 0.65rem 0.75rem 1.5rem;
  }

  .hint-mini {
    font-size: 0.68rem;
  }

  .progress {
    margin-bottom: 0.85rem;
  }

  .stage {
    padding: 1.1rem 0.85rem 1.25rem;
    border-radius: 18px;
  }

  .stage__phrase-block {
    margin-bottom: 1.2rem;
    gap: 0.8rem;
  }

  .stage__slots {
    gap: 0.75rem 0.8rem;
  }

  .word-slot {
    border-radius: 10px;
    padding: 0.3rem 0.4rem 0.35rem;
  }
}

.slot-ch--pop {
  animation: key-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slot-ch--flash-bad {
  animation: key-flash-bad 0.32s ease;
}

@keyframes key-pop {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  45% {
    transform: scale(1.22);
    filter: brightness(1.15);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

@keyframes key-flash-bad {
  0%,
  100% {
    background: transparent;
  }
  35% {
    background: rgba(220, 38, 38, 0.2);
  }
}

@keyframes slot-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  22% {
    transform: translateX(-4px);
  }
  44% {
    transform: translateX(4px);
  }
  66% {
    transform: translateX(-3px);
  }
}

.celebrate {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: transparent;
}

.firework {
  position: absolute;
  width: 170px;
  height: 110px;
  top: calc(50% - 128px);
  opacity: 0;
  animation: fireworks 1.4s ease-out infinite;
}

.firework::before,
.firework::after {
  content: '';
  position: absolute;
  inset: 0;
  background: conic-gradient(
    from 0deg,
    transparent 0deg 10deg,
    #5bbbd3 10deg 14deg,
    transparent 14deg 32deg,
    #f87171 32deg 36deg,
    transparent 36deg 58deg,
    #67e8f9 58deg 62deg,
    transparent 62deg 90deg,
    #fca5a5 90deg 94deg,
    transparent 94deg 120deg,
    #60a5fa 120deg 124deg,
    transparent 124deg 360deg
  );
  mask: radial-gradient(circle at 50% 100%, transparent 26%, #000 27% 100%);
}

.firework::after {
  transform: scale(0.75);
  opacity: 0.8;
}

.firework--left {
  left: calc(50% - 210px);
}

.firework--right {
  right: calc(50% - 210px);
  animation-delay: 0.2s;
}

.yay {
  position: relative;
  z-index: 3;
  margin: 0;
  font-size: clamp(2.1rem, 6.2vw, 4.6rem);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #f8fafc;
  -webkit-text-stroke: 1.5px #f87171;
  text-shadow:
    0 0 0 #fff,
    4px 4px 0 #67e8f9,
    8px 8px 0 rgba(15, 23, 42, 0.12);
  animation: yay 0.6s ease-out;
  font-family:
    'Comic Sans MS', 'Marker Felt', 'Bradley Hand', 'Segoe Print', cursive;
}

.particle {
  position: absolute;
  width: 14px;
  height: 14px;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%);
  background: hsl(calc(var(--n) * 28), 78%, 62%);
  left: 50%;
  top: 50%;
  animation: fly 1.15s ease-out forwards;
  transform: translate(-50%, -50%);
  animation-delay: calc(var(--n) * 0.012s);
}

@keyframes fireworks {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  20% {
    opacity: 0.95;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

@keyframes yay {
  from {
    transform: scale(0.72) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes fly {
  from {
    transform: translate(-50%, -50%) rotate(var(--d)) translateY(0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) rotate(var(--d)) translateY(-min(45vw, 220px));
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .firework--left {
    left: calc(50% - 150px);
  }

  .firework--right {
    right: calc(50% - 150px);
  }
}
</style>
