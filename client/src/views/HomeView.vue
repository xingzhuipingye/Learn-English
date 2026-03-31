<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchLessonList } from '../api/lessons'
import { useAuth } from '../composables/auth'
import { getProgressPercent } from '../composables/progress'
import type { LessonListItem } from '@shared/types/lesson'

const lessons = ref<LessonListItem[]>([])
const err = ref<string | null>(null)
const selectedModule = ref<LessonListItem['module']>('primary')
const selectedMode = ref<'learn' | 'listening'>('learn')

const { session, logout } = useAuth()

const moduleTabs: Array<{ key: LessonListItem['module']; label: string }> = [
  { key: 'primary', label: '小学' },
  { key: 'junior', label: '初中' },
  { key: 'senior', label: '高中' },
  { key: 'college', label: '大学' },
  { key: 'toefl', label: '托福' },
  { key: 'ielts', label: '雅思' },
]

const modeTabs: Array<{ key: 'learn' | 'listening'; label: string }> = [
  { key: 'learn', label: '学习模式' },
  { key: 'listening', label: '听力模式' },
]

const currentModuleLabel = computed(
  () => moduleTabs.find((x) => x.key === selectedModule.value)?.label ?? '',
)

const filteredLessons = computed(() => {
  const modeKind = selectedMode.value === 'learn' ? 'learn' : 'listening'
  const list = lessons.value.filter(
    (l) => l.module === selectedModule.value && l.kind === modeKind,
  )
  return [...list].sort((a, b) => {
    const oa = a.order ?? 9999
    const ob = b.order ?? 9999
    if (oa !== ob) return oa - ob
    return a.id.localeCompare(b.id)
  })
})

const canEnterLesson = computed(() => filteredLessons.value.length > 0)

function lessonProgress(l: LessonListItem) {
  return getProgressPercent(session.value?.username ?? null, l.id, l.kind)
}

function lessonMeta(l: LessonListItem) {
  if (l.kind === 'learn' && l.sentenceCount != null) return `${l.sentenceCount} 句`
  if (l.kind === 'listening' && l.itemCount != null) return `${l.itemCount} 题`
  return ''
}

onMounted(async () => {
  try {
    lessons.value = await fetchLessonList()
  } catch (e) {
    err.value = e instanceof Error ? e.message : '加载失败'
  }
})
</script>

<template>
  <div class="home">
    <div class="user-bar">
      <template v-if="session">
        <span class="user-name">{{ session.username }}</span>
        <button type="button" class="btn-logout" @click="logout">退出</button>
      </template>
      <RouterLink v-else to="/login" class="btn-login">登录 / 注册</RouterLink>
    </div>

    <header class="hero">
      <p class="eyebrow">ENGLISH TRAINING</p>
      <h1>Learn English</h1>
      <p class="sub">选择学段与模式，开始今日英语训练</p>
    </header>

    <p v-if="err" class="err">{{ err }}</p>

    <section v-else class="panel">
      <div class="tabs module-tabs">
        <button
          v-for="tab in moduleTabs"
          :key="tab.key"
          class="tab"
          :class="{ active: selectedModule === tab.key }"
          type="button"
          @click="selectedModule = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tabs mode-tabs">
        <button
          v-for="tab in modeTabs"
          :key="tab.key"
          class="tab mode"
          :class="{ active: selectedMode === tab.key }"
          type="button"
          @click="selectedMode = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="content-head">
        <h2>{{ currentModuleLabel }} · {{ selectedMode === 'learn' ? '学习模式' : '听力模式' }}</h2>
        <span class="tag">{{ canEnterLesson ? '可进入' : '即将上线' }}</span>
      </div>

      <ul v-if="canEnterLesson" class="list">
        <li v-for="l in filteredLessons" :key="l.id">
          <div class="item-main">
            <p v-if="l.chapter" class="chapter">{{ l.chapter }}</p>
            <p class="title">{{ l.title }}</p>
            <p v-if="l.textbook" class="textbook">{{ l.textbook }}</p>
            <span class="meta">{{ lessonMeta(l) }}</span>
            <div v-if="session && lessonProgress(l) != null" class="progress-wrap">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: lessonProgress(l)! + '%' }" />
              </div>
              <span class="progress-pct">{{ lessonProgress(l) }}%</span>
            </div>
          </div>
          <RouterLink
            v-if="selectedMode === 'learn'"
            :to="{ name: 'learn', params: { lessonId: l.id } }"
            class="enter"
          >
            开始学习
          </RouterLink>
          <RouterLink v-else :to="{ name: 'listen', params: { lessonId: l.id } }" class="enter">
            开始听力
          </RouterLink>
        </li>
      </ul>

      <div v-else class="empty">
        <p class="empty-title">{{ currentModuleLabel }} {{ selectedMode === 'learn' ? '学习模式' : '听力模式' }}</p>
        <p class="empty-sub">该学段暂无范文，可先切换学段或模式。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding: 1rem 1rem 2rem;
  max-width: 64rem;
  margin: 0 auto;
  min-height: 100%;
  box-sizing: border-box;
}

.user-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.user-name {
  font-size: 0.86rem;
  font-weight: 600;
  color: #14532d;
}

.btn-logout {
  font: inherit;
  font-size: 0.8rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid #bbf7d0;
  background: #fff;
  color: #334155;
  cursor: pointer;
}

.btn-login {
  font-size: 0.86rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  padding: 0.38rem 0.85rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.22);
}

.hero {
  text-align: center;
  margin: 0 auto 1rem;
  padding: 1.2rem 0.6rem 0.9rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  color: #16a34a;
  font-weight: 700;
}

.hero h1 {
  margin: 0.55rem 0 0.55rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: #111827;
}

.hero .sub {
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
}

.err {
  color: #dc2626;
  text-align: center;
}

.panel {
  border: 1px solid #d1fae5;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 10px 35px rgba(16, 185, 129, 0.12);
  padding: 1rem;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.module-tabs {
  margin-bottom: 0.8rem;
}

.mode-tabs {
  margin-bottom: 1rem;
}

.tab {
  border: 1px solid #86efac;
  background: linear-gradient(180deg, #ffffff, #f7fff9);
  color: #14532d;
  border-radius: 999px;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  padding: 0.46rem 0.95rem;
  cursor: pointer;
  box-shadow:
    0 2px 10px rgba(16, 185, 129, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.7) inset;
  transition: all 0.18s ease;
}

.tab:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow:
    0 7px 20px rgba(16, 185, 129, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.7) inset;
}

.tab.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.28);
}

.tab.mode {
  border-radius: 12px;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.7rem;
}

.content-head h2 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.tag {
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid #dcfce7;
  border-radius: 14px;
  background: #f8fffb;
}

.item-main {
  min-width: 0;
}

.chapter {
  margin: 0 0 0.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #15803d;
  text-transform: none;
}

.title {
  margin: 0 0 0.2rem;
  color: #0f172a;
  font-weight: 600;
}

.textbook {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.35;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.45rem;
  max-width: 14rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #10b981);
  transition: width 0.25s ease;
}

.progress-pct {
  font-size: 0.72rem;
  font-weight: 700;
  color: #166534;
  min-width: 2.25rem;
}

.enter {
  text-decoration: none;
  color: #fff;
  background: linear-gradient(135deg, #22c55e, #16a34a 48%, #10b981);
  border-radius: 999px;
  padding: 0.42rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(22, 163, 74, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.enter:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 12px 22px rgba(22, 163, 74, 0.32);
}

.meta {
  font-size: 0.78rem;
  color: #64748b;
}

.empty {
  border: 1px dashed #bbf7d0;
  border-radius: 14px;
  padding: 1.3rem 1rem;
  text-align: center;
  background: #f0fdf4;
}

.empty-title {
  margin: 0;
  color: #166534;
  font-weight: 600;
}

.empty-sub {
  margin: 0.35rem 0 0;
  font-size: 0.86rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .home {
    padding: 0.65rem 0.7rem 1.2rem;
  }

  .panel {
    border-radius: 18px;
    padding: 0.85rem;
  }

  .tab {
    font-size: 0.8rem;
    padding: 0.35rem 0.72rem;
  }

  .content-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.4rem;
  }

  .list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.55rem;
  }
}
</style>
