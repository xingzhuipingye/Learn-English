<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'

const router = useRouter()
const route = useRoute()
const { login, register } = useAuth()

const username = ref('')
const password = ref('')
const err = ref<string | null>(null)
const loading = ref(false)

async function onLogin() {
  err.value = null
  loading.value = true
  try {
    const r = await login(username.value, password.value)
    if (!r.ok) {
      err.value = r.message
      return
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect || '/')
  } finally {
    loading.value = false
  }
}

async function onRegister() {
  err.value = null
  loading.value = true
  try {
    const r = await register(username.value, password.value)
    if (!r.ok) {
      err.value = r.message
      return
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect || '/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <header class="hero">
      <p class="eyebrow">LEARN ENGLISH</p>
      <h1>登录 / 注册</h1>
      <p class="sub">进度保存在本机浏览器，与账号绑定</p>
    </header>

    <section class="panel">
      <label class="field">
        <span>用户名</span>
        <input v-model.trim="username" type="text" autocomplete="username" placeholder="至少 2 个字符" />
      </label>
      <label class="field">
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" placeholder="至少 4 位" />
      </label>
      <p v-if="err" class="err">{{ err }}</p>
      <div class="actions">
        <button type="button" class="btn primary" :disabled="loading" @click="onLogin">登录</button>
        <button type="button" class="btn secondary" :disabled="loading" @click="onRegister">注册并登录</button>
      </div>
      <RouterLink to="/" class="back-home">← 返回首页</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.login {
  padding: 1.5rem 1rem 2rem;
  max-width: 24rem;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 1.25rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  color: #16a34a;
  font-weight: 700;
}

.hero h1 {
  margin: 0.5rem 0 0.35rem;
  font-size: 1.5rem;
  color: #111827;
}

.sub {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
}

.panel {
  border: 1px solid #d1fae5;
  border-radius: 20px;
  background: #fff;
  padding: 1.25rem 1.1rem;
  box-shadow: 0 10px 35px rgba(16, 185, 129, 0.12);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
  font-size: 0.88rem;
  color: #334155;
}

.field input {
  font: inherit;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #bbf7d0;
}

.err {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.btn {
  font: inherit;
  font-weight: 700;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  box-shadow: 0 8px 18px rgba(22, 163, 74, 0.28);
}

.btn.secondary {
  background: #f0fdf4;
  color: #14532d;
  border: 1px solid #86efac;
}

.back-home {
  display: block;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.88rem;
  color: #16a34a;
}
</style>
