import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/homeview/HomeView.vue'),
    },
    {
      path: '/encyclopedia',
      name: 'encyclopedia',
      component: () => import('@/views/encyclopedia/EncyclopediaView.vue'),
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/gallery/GalleryView.vue'),
    },
    {
      path: '/identify',
      name: 'identify',
      component: () => import('@/views/identify/IdentifyView.vue'),
    },
    {
      path: '/identify/history',
      name: 'identify-history',
      component: () => import('@/views/identify/HistoryView.vue'),
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('@/views/community/CommunityView.vue'),
    },
    {
      path: '/care',
      name: 'care',
      component: () => import('@/views/care/CareView.vue'),
    },
    {
      path: '/garden',
      name: 'garden',
      component: () => import('@/views/garden/GardenView.vue'),
    },
    {
      path: '/garden/:id',
      name: 'garden-detail',
      component: () => import('@/views/garden/GardenDetailView.vue'),
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/favorites/FavoritesView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/profile/ProfileView.vue'),
    },
    {
      path: '/profile/:id',
      name: 'user-profile',
      component: () => import('@/views/profile/UserProfileView.vue'),
    },
    {
      path: '/settings/privacy',
      name: 'privacy',
      component: () => import('@/views/settings/PrivacySettings.vue'),
    },
    {
      path: '/settings/level',
      name: 'level',
      component: () => import('@/views/settings/LevelView.vue'),
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('@/views/audit/AuditView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/profile/NotificationsView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/Admin.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

export default router
