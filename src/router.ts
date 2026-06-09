import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useGameStore } from './pinia/store'
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import VoteView from './views/VoteView.vue'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/vote'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: false }
  },
  {
    path: '/vote',
    name: 'Vote',
    component: VoteView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Route guard - redirect to login if not authenticated
router.beforeEach((to, _from, next) => {
  const gameStore = useGameStore()
  const isLoggedIn = !!gameStore.currentVoter
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !isLoggedIn) {
    // Redirect to login if trying to access protected routes
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    // Redirect to vote if already logged in and trying to access login
    next('/vote')
  } else {
    next()
  }
})

export default router
