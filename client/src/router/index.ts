import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUsername } from '../composables/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import PrimaryLearnView from '../views/PrimaryLearnView.vue'
import ListeningView from '../views/ListeningView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    {
      path: '/learn/:lessonId',
      name: 'learn',
      component: PrimaryLearnView,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/listen/:lessonId',
      name: 'listen',
      component: ListeningView,
      props: true,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const user = getCurrentUsername()
  if (to.meta.requiresAuth && !user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && user) {
    return { name: 'home' }
  }
  return true
})

export default router
