<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchLessonList } from '../api/lessons'
import type { LessonListItem } from '@shared/types/lesson'

const lessons = ref<LessonListItem[]>([])
const err = ref<string | null>(null)
const selectedModule = ref<LessonListItem['module']>('primary')
const selectedMode = ref<'learn' | 'listening'>('learn')

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

const filteredLessons = computed(() =>
  lessons.value.filter((l) => l.module === selectedModule.value),
)

const canEnterLesson = computed(
  () => selectedModule.value === 'primary' && selectedMode.value === 'learn',
)

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
            <p class="title">{{ l.title }}</p>
            <span class="meta">{{ l.sentenceCount }} 句</span>
          </div>
          <RouterLink :to="{ name: 'primary-learn', params: { lessonId: l.id } }" class="enter">
            开始学习
          </RouterLink>
        </li>
      </ul>

      <div v-else class="empty">
        <p class="empty-title">{{ currentModuleLabel }} {{ selectedMode === 'learn' ? '学习模式' : '听力模式' }}</p>
        <p class="empty-sub">该模块正在制作中，先体验「小学 · 学习模式」吧。</p>
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

.title {
  margin: 0 0 0.2rem;
  color: #0f172a;
  font-weight: 600;
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
