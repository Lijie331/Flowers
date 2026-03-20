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
      path: '/community',
      name: 'community',
      component: () => import('@/views/community/CommunityView.vue'),
    },
    {
      path: '/care',
      name: 'care',
      component: () => import('@/views/care/CareView.vue'),
    },
  ],
})

export default router
