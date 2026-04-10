<template>
  <div class="favorites-container">
    <!-- 页面标题 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">❤️ 我的收藏</span>
        </div>
      </template>
      <el-tabs v-model="activeTab" class="favorite-tabs">
        <el-tab-pane label="百科收藏" name="encyclopedia">
          <template #label>
            <span class="tab-label">
              <el-icon><Cherry /></el-icon>
              百科收藏
              <el-tag type="success" size="small" round>{{ encyclopediaFavorites.length }}</el-tag>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="社区收藏" name="community">
          <template #label>
            <span class="tab-label">
              <el-icon><ChatDotRound /></el-icon>
              社区收藏
              <el-tag type="warning" size="small" round>{{ communityFavorites.length }}</el-tag>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="图库收藏" name="gallery">
          <template #label>
            <span class="tab-label">
              <el-icon><Picture /></el-icon>
              图库收藏
              <el-tag type="info" size="small" round>{{ galleryFavorites.length }}</el-tag>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 百科收藏列表 -->
    <div v-loading="encyclopediaLoading" class="favorites-grid" v-show="activeTab === 'encyclopedia'">
      <el-empty v-if="!encyclopediaLoading && encyclopediaFavorites.length === 0" description="还没有收藏任何花卉">
        <el-button type="primary" @click="$router.push('/encyclopedia')">去百科看看</el-button>
      </el-empty>
      
      <el-row :gutter="20" v-else>
        <el-col 
          v-for="item in encyclopediaFavorites" 
          :key="item.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <el-card class="favorite-card encyclopedia-card" shadow="hover">
            <div class="flower-image-wrapper" v-if="item.image_url">
              <el-image 
                :src="item.image_url" 
                fit="cover" 
                class="flower-image"
                loading="lazy"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div v-else class="flower-image-wrapper">
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
            <div class="card-header">
              <span class="flower-name">{{ item.chinese_name }}</span>
              <el-icon class="unfavorite-icon" @click.stop="removeEncyclopediaFavorite(item.id)"><Close /></el-icon>
            </div>
            <p class="latin-name"><em>{{ item.latin_name || '未知学名' }}</em></p>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="goToFlowerDetail(item)">查看详情</el-button>
              <el-button type="success" size="small" @click="addToGardenFromEncyclopedia(item)">加入花园</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图库收藏列表 -->
    <div v-loading="galleryLoading" class="favorites-grid" v-show="activeTab === 'gallery'">
      <el-empty v-if="!galleryLoading && galleryFavorites.length === 0" description="还没有收藏任何图库图片">
        <el-button type="primary" @click="$router.push('/gallery')">去图库看看</el-button>
      </el-empty>
      
      <el-row :gutter="20" v-else>
        <el-col 
          v-for="item in galleryFavorites" 
          :key="item.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <el-card class="favorite-card gallery-card" shadow="hover">
            <div class="gallery-image-wrapper" v-if="item.image_url">
              <el-image 
                :src="item.image_url" 
                fit="cover" 
                class="flower-image"
                loading="lazy"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div v-else class="gallery-image-wrapper">
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
            <div class="card-header">
              <span class="flower-name">{{ item.flower_name }}</span>
              <el-icon class="unfavorite-icon" @click.stop="removeGalleryFavorite(item.id)"><Close /></el-icon>
            </div>
            <p class="latin-name"><em>{{ item.latin_name || '未知学名' }}</em></p>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="goToFlowerInGallery(item)">查看图库</el-button>
              <el-button type="success" size="small" @click="addToGardenFromGallery(item)">加入花园</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 社区收藏列表 -->
    <div v-loading="communityLoading" class="favorites-grid" v-show="activeTab === 'community'">
      <el-empty v-if="!communityLoading && communityFavorites.length === 0" description="还没有收藏任何社区帖子">
        <el-button type="primary" @click="$router.push('/community')">去社区看看</el-button>
      </el-empty>
      
      <el-row :gutter="20" v-else>
        <el-col 
          v-for="item in communityFavorites" 
          :key="item.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <el-card class="favorite-card community-card" shadow="hover">
            <div class="post-header" v-if="item.username">
              <el-avatar :size="32" :src="item.user_avatar">{{ item.username?.charAt(0)?.toUpperCase() }}</el-avatar>
              <div class="post-user-info">
                <span class="post-username">{{ item.username }}</span>
                <span class="post-time">{{ formatTime(item.created_at) }}</span>
              </div>
              <el-icon class="unfavorite-icon" @click.stop="removeCommunityFavorite(item.id)"><Close /></el-icon>
            </div>
            <div class="post-content" v-if="item.content">
              <p>{{ item.content.substring(0, 100) }}{{ item.content.length > 100 ? '...' : '' }}</p>
            </div>
            <div class="post-images" v-if="item.images && item.images.length">
              <el-image 
                v-for="(img, idx) in item.images.slice(0, 2)" 
                :key="idx" 
                :src="getFullImageUrl(img)" 
                fit="cover" 
                class="post-image"
              />
              <span v-if="item.images.length > 2" class="image-count">+{{ item.images.length - 2 }}</span>
            </div>
            <div class="post-tags" v-if="item.topics && item.topics.length">
              <el-tag v-for="topic in item.topics.slice(0, 3)" :key="topic" size="small" type="warning">{{ topic }}</el-tag>
            </div>
            <div class="post-stats">
              <span class="stat-item"><el-icon><Star /></el-icon> {{ item.likes_count || 0 }}</span>
              <span class="stat-item"><el-icon><ChatDotRound /></el-icon> {{ item.comments_count || 0 }}</span>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="goToPost(item)">查看帖子</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Cherry, ChatDotRound, Picture, Star } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const API_BASE = 'http://127.0.0.1:5000/api'

const activeTab = ref('encyclopedia')
const encyclopediaLoading = ref(false)
const communityLoading = ref(false)
const galleryLoading = ref(false)
const encyclopediaFavorites = ref([])
const communityFavorites = ref([])
const galleryFavorites = ref([])

// 获取百科收藏列表
const fetchEncyclopediaFavorites = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  encyclopediaLoading.value = true
  try {
    const response = await fetch(`${API_BASE}/encyclopedia/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      encyclopediaFavorites.value = data.data.favorites
    }
  } catch (error) {
    console.error('获取百科收藏失败:', error)
    ElMessage.error('获取百科收藏失败')
  } finally {
    encyclopediaLoading.value = false
  }
}

// 获取社区收藏列表
const fetchCommunityFavorites = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  communityLoading.value = true
  try {
    const response = await fetch(`${API_BASE}/community/favorites/posts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      communityFavorites.value = data.data.favorites
    }
  } catch (error) {
    console.error('获取社区收藏失败:', error)
    ElMessage.error('获取社区收藏失败')
  } finally {
    communityLoading.value = false
  }
}

// 获取图库收藏列表
const fetchGalleryFavorites = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  galleryLoading.value = true
  try {
    const response = await fetch(`${API_BASE}/gallery/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      // 映射字段名：后端返回 chinese_name/sample_image，前端使用 flower_name/image_url
      galleryFavorites.value = data.data.favorites.map(item => ({
        ...item,
        flower_name: item.chinese_name || item.folder_name,
        image_url: item.sample_image ? `http://127.0.0.1:5000${item.sample_image}` : ''
      }))
    }
  } catch (error) {
    console.error('获取图库收藏失败:', error)
    ElMessage.error('获取图库收藏失败')
  } finally {
    galleryLoading.value = false
  }
}

// 取消百科收藏
const removeEncyclopediaFavorite = async (id) => {
  try {
    await ElMessageBox.confirm('确定取消收藏该花卉吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/encyclopedia/favorites/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已取消收藏')
      fetchEncyclopediaFavorites()
    }
  } catch {}
}

// 取消社区收藏
const removeCommunityFavorite = async (id) => {
  try {
    await ElMessageBox.confirm('确定取消收藏该帖子吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/community/posts/${id}/favorite`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已取消收藏')
      fetchCommunityFavorites()
    } else {
      ElMessage.error(data.error || '取消收藏失败')
    }
  } catch {}
}

// 取消图库收藏
const removeGalleryFavorite = async (id) => {
  try {
    await ElMessageBox.confirm('确定取消收藏该图片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/gallery/favorites/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已取消收藏')
      fetchGalleryFavorites()
    }
  } catch {}
}

// 查看花卉详情（百科）
const goToFlowerDetail = (item) => {
  router.push(`/encyclopedia?flower_id=${item.flower_id}`)
}

// 从百科收藏加入花园
const addToGardenFromEncyclopedia = async (item) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/community/garden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        flower_id: item.flower_id,
        flower_name: item.chinese_name,
        latin_name: item.latin_name,
        chinese_name: item.chinese_name
      })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已添加到花园')
      router.push('/garden')
    } else {
      ElMessage.warning(data.error || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

// 查看图库
const goToGallery = (item) => {
  router.push(`/gallery?flower=${encodeURIComponent(item.flower_name)}`)
}

// 查看图库（从图库收藏）
const goToFlowerInGallery = (item) => {
  router.push(`/gallery?flower=${encodeURIComponent(item.flower_name)}`)
}

// 从图库收藏加入花园
const addToGardenFromGallery = async (item) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/community/garden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        flower_id: item.flower_id,
        flower_name: item.flower_name,
        latin_name: item.latin_name,
        chinese_name: item.chinese_name || item.flower_name
      })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已添加到花园')
      router.push('/garden')
    } else {
      ElMessage.warning(data.error || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

// 加入花园
const addToGarden = async (item) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/community/garden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        flower_id: item.flower_id,
        flower_name: item.flower_name,
        latin_name: item.latin_name,
        chinese_name: item.chinese_name
      })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已添加到花园')
      router.push('/garden')
    } else {
      ElMessage.warning(data.error || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

// 加载收藏数据
const loadAllFavorites = () => {
  fetchEncyclopediaFavorites()
  fetchCommunityFavorites()
  fetchGalleryFavorites()
}

onMounted(() => {
  loadAllFavorites()
})

// 监听路由变化和标签页切换，刷新数据
watch(() => route.path, () => {
  if (route.path === '/favorites') {
    loadAllFavorites()
  }
})

watch(activeTab, () => {
  if (activeTab.value === 'encyclopedia' && encyclopediaFavorites.value.length === 0) {
    fetchEncyclopediaFavorites()
  } else if (activeTab.value === 'community' && communityFavorites.value.length === 0) {
    fetchCommunityFavorites()
  } else if (activeTab.value === 'gallery' && galleryFavorites.value.length === 0) {
    fetchGalleryFavorites()
  }
})

// 辅助函数
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

const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://127.0.0.1:5000${url}`
}

const goToPost = (item) => {
  router.push('/community')
}
</script>

<style scoped>
.favorites-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
  background: #f5f7fa;
}

.header-card {
  margin-bottom: 20px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 600;
}

.favorite-tabs {
  margin-top: 10px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorites-grid {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

.favorite-card {
  margin-bottom: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.encyclopedia-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.encyclopedia-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.gallery-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.gallery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.gallery-image-wrapper {
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
  margin: -20px -20px 10px -20px;
}

.flower-image-wrapper {
  width: 100%;
  height: 150px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
  margin: -20px -20px 10px -20px;
}

.flower-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #81c784;
  font-size: 48px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.flower-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unfavorite-icon {
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  flex-shrink: 0;
  margin-left: 8px;
}

.unfavorite-icon:hover {
  color: #f56c6c;
}

.latin-name {
  margin: 8px 0 16px;
  font-size: 13px;
  color: #909399;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.card-actions .el-button {
  flex: 1;
}

/* 社区帖子卡片样式 */
.community-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.community-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.post-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.post-username {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-time {
  font-size: 12px;
  color: #909399;
}

.post-content {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.post-content p {
  margin: 0;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  margin-bottom: 10px;
  position: relative;
}

.post-image {
  width: 100%;
  height: 80px;
  border-radius: 4px;
}

.image-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.post-stats {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}
</style>
