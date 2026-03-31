<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchListeningLesson } from '../api/lessons'
import { getCurrentUsername } from '../composables/auth'
import { recordListenItemDone } from '../composables/progress'
import type { ListeningLesson } from '@shared/types/lesson'

const props = defineProps<{ lessonId: string }>()
const router = useRouter()

const lesson = ref<ListeningLesson | null>(null)
const loadError = ref<string | null>(null)
const itemIndex = ref(0)
const feedback = ref<'idle' | 'ok' | 'bad'>('idle')
const lastPick = ref<string | null>(null)
const speechRate = ref(0.72)

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const currentItem = computed(() => lesson.value?.items[itemIndex.value] ?? null)

const maskedSentence = computed(() => {
  const item = currentItem.value
  if (!item) return ''
  const re = new RegExp(`\\b${escapeRe(item.correct)}\\b`, 'i')
  return item.sentence.replace(re, '______')
})
const progressLabel = computed(() => {
  if (!lesson.value) return ''
  return `第 ${itemIndex.value + 1} / ${lesson.value.items.length} 题`
})

function normalizeWord(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/gi, '')
}

function playSentence() {
  const t = currentItem.value?.sentence
  if (!t || typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(t)
  u.lang = 'en-US'
  u.rate = speechRate.value
  window.speechSynthesis.speak(u)
}

function pick(choice: string) {
  const item = currentItem.value
  if (!item || feedback.value !== 'idle') return
  const ok = normalizeWord(choice) === normalizeWord(item.correct)
  feedback.value = ok ? 'ok' : 'bad'
  lastPick.value = choice
  if (ok) {
    const u = getCurrentUsername()
    if (u && lesson.value) {
      recordListenItemDone(u, lesson.value.id, itemIndex.value + 1, lesson.value.items.length)
    }
    window.setTimeout(() => {
      feedback.value = 'idle'
      lastPick.value = null
      if (!lesson.value) return
      if (itemIndex.value < lesson.value.items.length - 1) {
        itemIndex.value += 1
      } else {
        router.push({ name: 'home' })
      }
    }, 900)
  } else {
    window.setTimeout(() => {
      feedback.value = 'idle'
      lastPick.value = null
    }, 600)
  }
}

onMounted(async () => {
  try {
    lesson.value = await fetchListeningLesson(props.lessonId)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
  }
})

onUnmounted(() => {
  window.speechSynthesis?.cancel()
})
</script>

<template>
  <div class="listen" tabindex="-1">
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
      <div v-if="lesson" class="top-bar__right">
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
      <p v-if="lesson.textbook" class="textbook-hint">{{ lesson.textbook }}</p>
      <p class="progress">{{ progressLabel }}</p>

      <section class="stage">
        <p class="hint-mini">先点「播放原句」，再选出句中挖空词对应的正确选项。</p>
        <button type="button" class="btn-play" @click="playSentence">▶ 播放原句</button>

        <p class="sentence-blank" aria-live="polite">
          {{ maskedSentence }}
        </p>

        <div class="choices" role="group" aria-label="选项">
          <button
            v-for="c in currentItem?.choices ?? []"
            :key="c"
            type="button"
            class="choice"
            :class="{
              flashOk:
                feedback === 'ok' && normalizeWord(c) === normalizeWord(currentItem?.correct ?? ''),
              flashBad: feedback === 'bad' && lastPick === c,
            }"
            :disabled="feedback !== 'idle'"
            @click="pick(c)"
          >
            {{ c }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.listen {
  padding: 1rem 1rem 2.5rem;
  outline: none;
  min-height: 100%;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 8% 10%, rgba(34, 197, 94, 0.12), transparent 45%),
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
}

.err {
  color: #dc2626;
  text-align: center;
}

.textbook-hint {
  font-size: 0.72rem;
  color: #64748b;
  text-align: center;
  margin: 0 auto 0.35rem;
  max-width: 40rem;
}

.progress {
  font-size: 0.8rem;
  margin: 0 auto 1rem;
  opacity: 0.85;
  text-align: center;
}

.stage {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1.5rem 1.2rem;
  border-radius: 24px;
  border: 1px solid #d1fae5;
  background: #fff;
  box-shadow: 0 10px 35px rgba(16, 185, 129, 0.12);
}

.hint-mini {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0 0 1rem;
}

.btn-play {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-weight: 600;
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  border: 1px solid #86efac;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  cursor: pointer;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 18px rgba(22, 163, 74, 0.28);
}

.sentence-blank {
  font-size: clamp(1.05rem, 3vw, 1.25rem);
  font-weight: 600;
  color: #0f172a;
  line-height: 1.55;
  margin: 0 0 1.25rem;
  text-align: center;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.choice {
  font: inherit;
  font-weight: 600;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
  background: #f8fffb;
  color: #14532d;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    background 0.12s ease;
}

.choice:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #ecfdf5;
}

.choice.flashOk {
  background: #dcfce7;
  border-color: #22c55e;
}

.choice.flashBad {
  animation: shake 0.35s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

@media (max-width: 560px) {
  .choices {
    grid-template-columns: 1fr;
  }

  .top-bar {
    grid-template-columns: 1fr;
  }

  .top-bar__center {
    order: -1;
  }
}
</style>
