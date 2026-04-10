<template>
  <div class="user-profile-container" v-loading="loading">
    <!-- 用户信息卡片 -->
    <el-card class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80" :src="getFullUrl(profile?.avatar_url)">
          {{ profile?.nickname?.charAt(0) || 'U' }}
        </el-avatar>
        <div class="info">
          <h2>{{ profile?.nickname || profile?.username || '未知用户' }}</h2>
          <div class="level-badge">
            <span>{{ profile?.title || '新手花友' }}</span>
            <el-tag size="small" type="success">Lv.{{ profile?.level || 1 }}</el-tag>
          </div>
          <p class="bio" v-if="profile?.bio">{{ profile.bio }}</p>
          <p class="bio empty" v-else>这个人很懒，什么都没写~</p>
        </div>
        <div class="actions">
          <el-tag v-if="profile?.certification" type="warning" effect="dark">
            {{ profile.certification === 'horticulturist' ? '园艺师认证' : '植物学家认证' }}
          </el-tag>
          <template v-if="!isOwnProfile">
            <el-button :type="profile?.is_following ? 'info' : 'primary'" @click="toggleFollow">
              {{ profile?.is_following ? '已关注' : '关注' }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="$router.push('/profile')">编辑资料</el-button>
          </template>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ profile?.posts_count || 0 }}</span>
          <span class="stat-label">发帖</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ profile?.followers_count || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ profile?.following_count || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
      </div>
    </el-card>

    <!-- 用户帖子列表 -->
    <el-card class="posts-card">
      <template #header>
        <span>他的动态</span>
      </template>

      <div v-if="posts.length === 0" class="empty-posts">
        <el-empty description="暂无动态" />
      </div>

      <div v-else class="posts-list">
        <el-card v-for="post in posts" :key="post.id" class="post-item" shadow="hover">
          <div class="post-content">{{ post.content }}</div>
          <div class="post-images" v-if="post.images && post.images.length">
            <el-image
              v-for="(img, idx) in post.images.slice(0, 9)"
              :key="idx"
              :src="getFullUrl(img)"
              fit="cover"
              class="post-image"
              :preview-src-list="post.images.map(getFullUrl)"
            />
          </div>
          <div class="post-meta">
            <span class="post-time">{{ formatTime(post.created_at) }}</span>
            <span class="post-stats">
              <el-icon><Star /></el-icon> {{ post.likes_count || 0 }}
              <el-icon><ChatDotRound /></el-icon> {{ post.comments_count || 0 }}
            </span>
          </div>
        </el-card>
      </div>

      <div v-if="hasMore" class="load-more">
        <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const API_BASE = 'http://127.0.0.1:5000/api'
const IMAGE_BASE = 'http://127.0.0.1:5000'

const loading = ref(false)
const loadingMore = ref(false)
const profile = ref(null)
const posts = ref([])
const currentPage = ref(1)
const hasMore = ref(false)

const isOwnProfile = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.id === route.params.id
  }
  return false
})

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return IMAGE_BASE + url
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString()
}

const fetchProfile = async () => {
  const token = localStorage.getItem('token')

  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/user/profile/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      profile.value = data.data.profile
    } else {
      ElMessage.error(data.error || '获取用户信息失败')
    }
  } catch (e) {
    ElMessage.error('获取失败')
  } finally {
    loading.value = false
  }
}

const fetchPosts = async () => {
  const token = localStorage.getItem('token')
  try {
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    headers['X-User-Id'] = localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')).id
      : ''

    const res = await fetch(
      `${API_BASE}/community/posts?user_id=${route.params.id}&page=1&page_size=10`,
      { headers },
    )
    const data = await res.json()
    if (data.success) {
      posts.value = data.data.posts || []
      hasMore.value = data.data.page < data.data.total_pages
    }
  } catch (e) {
    console.error(e)
  }
}

const loadMore = async () => {
  loadingMore.value = true
  currentPage.value++
  try {
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    headers['X-User-Id'] = localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')).id
      : ''

    const res = await fetch(
      `${API_BASE}/community/posts?user_id=${route.params.id}&page=${currentPage.value}&page_size=10`,
      { headers },
    )
    const data = await res.json()
    if (data.success) {
      posts.value = [...posts.value, ...(data.data.posts || [])]
      hasMore.value = data.data.page < data.data.total_pages
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingMore.value = false
  }
}

const toggleFollow = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await fetch(`${API_BASE}/user/follow/${route.params.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      profile.value.is_following = data.following
      if (data.following) {
        profile.value.followers_count = (profile.value.followers_count || 0) + 1
      } else {
        profile.value.followers_count = Math.max(0, (profile.value.followers_count || 0) - 1)
      }
      ElMessage.success(data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchProfile()
  fetchPosts()
})
</script>

<style scoped>
.user-profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.info {
  flex: 1;
}
.info h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.bio {
  color: #666;
  margin: 10px 0;
}
.bio.empty {
  color: #999;
  font-style: italic;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}

.posts-card {
  margin-top: 20px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  cursor: pointer;
}

.post-content {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.post-image {
  width: 100%;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.post-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.load-more {
  text-align: center;
  padding: 20px;
}
</style>
