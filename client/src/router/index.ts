import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PrimaryLearnView from '../views/PrimaryLearnView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/primary/learn/:lessonId',
      name: 'primary-learn',
      component: PrimaryLearnView,
      props: true,
    },
  ],
})

export default router
