import { computed, ref } from 'vue'

const SESSION_KEY = 'learn-english-session-v1'
const USERS_KEY = 'learn-english-users-v1'

export interface SessionUser {
  username: string
}

const session = ref<SessionUser | null>(null)

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    session.value = raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    session.value = null
  }
}

loadSession()

export function useAuth() {
  const isLoggedIn = computed(() => !!session.value)

  async function sha256Hex(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async function register(username: string, password: string): Promise<{ ok: boolean; message: string }> {
    const u = username.trim()
    if (u.length < 2) return { ok: false, message: '用户名至少 2 个字符' }
    if (password.length < 4) return { ok: false, message: '密码至少 4 位' }
    const users = readUsers()
    if (users[u]) return { ok: false, message: '用户名已存在' }
    users[u] = { hash: await sha256Hex(password) }
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    session.value = { username: u }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
    return { ok: true, message: '注册成功' }
  }

  async function login(username: string, password: string): Promise<{ ok: boolean; message: string }> {
    const u = username.trim()
    const users = readUsers()
    const row = users[u]
    if (!row) return { ok: false, message: '用户不存在' }
    const hash = await sha256Hex(password)
    if (hash !== row.hash) return { ok: false, message: '密码错误' }
    session.value = { username: u }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
    return { ok: true, message: '登录成功' }
  }

  function logout() {
    session.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  return {
    session,
    isLoggedIn,
    register,
    login,
    logout,
  }
}

function readUsers(): Record<string, { hash: string }> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** 路由守卫用：同步读取是否已登录 */
export function getCurrentUsername(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SessionUser
    return s?.username ?? null
  } catch {
    return null
  }
}
