<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search as SearchIcon, Picture as PictureIcon, ZoomIn as ZoomInIcon, WarnTriangleFilled } from '@element-plus/icons-vue'

// API配置
const API_BASE = 'http://127.0.0.1:5000/api'
const API_BASE_URL = 'http://127.0.0.1:5000'

// 获取完整图片URL
const getFullImageUrl = (relativePath) => {
  if (!relativePath) return ''
  if (relativePath.startsWith('http')) return relativePath
  return API_BASE_URL + relativePath
}

// 状态
const loading = ref(false)
const searchLoading = ref(false)
const flowerList = ref([])
const searchResults = ref([])
const currentFlower = ref(null)
const flowerImages = ref([])
const searchKeyword = ref('')
const isSearching = ref(false)
const imageLoading = ref(false)
const galleryFavorited = ref(false)

// 计算属性
const displayedFlowers = computed(() => {
  return isSearching.value ? searchResults.value : flowerList.value
})

// 获取花卉列表
const fetchFlowerList = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/gallery/flowers`)
    const data = await response.json()
    if (data.success) {
      flowerList.value = data.data.flowers
    } else {
      ElMessage.error(data.error || '获取花卉列表失败')
    }
  } catch (error) {
    console.error('获取花卉列表失败:', error)
    ElMessage.error('无法连接到服务器，请确保后端服务已启动')
  } finally {
    loading.value = false
  }
}

// 搜索花卉
const searchFlowers = async () => {
  if (!searchKeyword.value.trim()) {
    isSearching.value = false
    return
  }
  
  searchLoading.value = true
  isSearching.value = true
  try {
    const response = await fetch(`${API_BASE}/gallery/search?keyword=${encodeURIComponent(searchKeyword.value)}`)
    const data = await response.json()
    if (data.success) {
      searchResults.value = data.data.flowers
      if (data.data.flowers.length === 0) {
        ElMessage.info(`未找到与"${searchKeyword.value}"相关的花卉`)
      }
    } else {
      ElMessage.error(data.error || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请重试')
  } finally {
    searchLoading.value = false
  }
}

// 查看花卉详情
const viewFlowerDetail = async (flower) => {
  currentFlower.value = flower
  imageLoading.value = true
  flowerImages.value = []
  
  try {
    const response = await fetch(`${API_BASE}/gallery/flower/${encodeURIComponent(flower.name)}`)
    const data = await response.json()
    if (data.success) {
      flowerImages.value = data.data.images
      // 检查收藏状态
      await checkGalleryFavorite(flower.name)
    } else {
      ElMessage.error(data.error || '获取图片失败')
    }
  } catch (error) {
    console.error('获取花卉图片失败:', error)
    ElMessage.error('获取图片失败，请重试')
  } finally {
    imageLoading.value = false
  }
}

// 检查图库收藏状态
async function checkGalleryFavorite(folderName) {
  const token = localStorage.getItem('token')
  if (!token) {
    galleryFavorited.value = false
    return
  }
  
  try {
    const res = await fetch(`${API_BASE}/community/favorites/check?folder_name=${encodeURIComponent(folderName)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      galleryFavorited.value = data.is_favorited
    }
  } catch (e) {
    console.error('检查收藏失败:', e)
  }
}

// 切换收藏
async function toggleGalleryFavorite() {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  const flower = currentFlower.value
  if (!flower) return
  
  if (galleryFavorited.value) {
    // 取消收藏
    try {
      const res = await fetch(`${API_BASE}/community/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const fav = data.data.favorites.find(f => f.folder_name === flower.name)
        if (fav) {
          await fetch(`${API_BASE}/community/favorites/${fav.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          galleryFavorited.value = false
          ElMessage.success('已取消收藏')
        }
      }
    } catch (e) {
      ElMessage.error('操作失败')
    }
  } else {
    // 添加收藏
    try {
      const res = await fetch(`${API_BASE}/community/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flower_id: flower.id,
          folder_name: flower.name,
          latin_name: flower.name_en,
          chinese_name: flower.name_cn || flower.name
        })
      })
      const data = await res.json()
      if (data.success) {
        galleryFavorited.value = true
        ElMessage.success('收藏成功')
      } else {
        ElMessage.warning(data.error || '收藏失败')
      }
    } catch (e) {
      ElMessage.error('收藏失败')
    }
  }
}

// 加入花园
async function addFlowerToGarden() {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  const flower = currentFlower.value
  if (!flower) return
  
  try {
    const res = await fetch(`${API_BASE}/community/garden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        flower_id: flower.id,
        flower_name: flower.name,
        latin_name: flower.name_en,
        chinese_name: flower.name_cn || flower.name
      })
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('已添加到花园')
    } else {
      ElMessage.warning(data.error || '添加失败')
    }
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

// 关闭详情弹窗
const closeDetail = () => {
  currentFlower.value = null
  flowerImages.value = []
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  isSearching.value = false
  searchResults.value = []
}

// 打开图片预览
const previewImage = (image) => {
  window.open(getFullImageUrl(image.url), '_blank')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchFlowerList()
})
</script>

<template>
  <div class="gallery-container">
    <!-- 页面标题和搜索 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">花卉图库</span>
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索花卉名称..."
              class="search-input"
              clearable
              @keyup.enter="searchFlowers"
              @clear="clearSearch"
            >
              <template #append>
                <el-button 
                  :icon="SearchIcon" 
                  @click="searchFlowers"
                  :loading="searchLoading"
                />
              </template>
            </el-input>
          </div>
        </div>
      </template>
      <div class="stats">
        <el-tag type="info" size="large">
          共 {{ displayedFlowers.length }} 种花卉
        </el-tag>
        <el-tag v-if="isSearching" type="warning">
          搜索结果: "{{ searchKeyword }}"
        </el-tag>
      </div>
    </el-card>

    <!-- 花卉列表 -->
    <div v-loading="loading" class="flower-grid">
      <el-empty v-if="!loading && displayedFlowers.length === 0" description="暂无花卉数据" />
      
      <el-row :gutter="20" v-else>
        <el-col 
          v-for="flower in displayedFlowers" 
          :key="flower.name"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <el-card 
            class="flower-card" 
            shadow="hover"
            @click="viewFlowerDetail(flower)"
          >
            <div class="flower-cover">
              <el-image
                v-if="flower.sample_image"
                :src="getFullImageUrl(flower.sample_image)"
                :alt="flower.name"
                fit="cover"
                class="flower-image"
                loading="lazy"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon :size="40"><PictureIcon /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="image-placeholder">
                <el-icon :size="40"><PictureIcon /></el-icon>
              </div>
              <div class="image-count">
                <el-icon><PictureIcon /></el-icon>
                {{ flower.image_count }} 张
              </div>
            </div>
            <div class="flower-info">
              <h3 class="flower-name">{{ flower.name_cn || flower.name }}</h3>
              <p class="flower-name-en" v-if="flower.name_en !== flower.name">{{ flower.name_en }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 花卉详情弹窗 -->
    <el-dialog
      v-model="currentFlower"
      :title="currentFlower ? (currentFlower.name_cn || currentFlower.name) : ''"
      width="80%"
      :before-close="closeDetail"
      class="detail-dialog"
    >
      <template #header v-if="currentFlower">
        <div class="dialog-header">
          <div>
            <span class="flower-title">{{ currentFlower.name_cn || currentFlower.name }}</span>
            <span class="flower-title-en" v-if="currentFlower.name_en !== currentFlower.name">{{ currentFlower.name_en }}</span>
          </div>
          <div class="dialog-actions">
            <el-button 
              :type="galleryFavorited ? 'danger' : 'default'" 
              size="small"
              @click="toggleGalleryFavorite"
            >
              {{ galleryFavorited ? '❤️ 已收藏' : '🤍 收藏' }}
            </el-button>
            <el-button 
              type="success" 
              size="small"
              @click="addFlowerToGarden"
            >
              🌱 加入花园
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-loading="imageLoading" class="image-gallery">
        <el-empty v-if="!imageLoading && flowerImages.length === 0" description="暂无图片" />
        
        <el-row :gutter="12" v-else>
          <el-col 
            v-for="(image, index) in flowerImages" 
            :key="index"
            :xs="12" :sm="8" :md="6" :lg="4"
          >
            <div class="gallery-item" @click="previewImage(image)">
              <el-image
                :src="getFullImageUrl(image.url)"
                :alt="image.filename"
                fit="cover"
                class="gallery-image"
                loading="lazy"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon :size="30"><WarnTriangleFilled /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="image-overlay">
                <el-icon><ZoomInIcon /></el-icon>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <span class="image-count-info">共 {{ flowerImages.length }} 张图片</span>
          <el-button @click="closeDetail">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.gallery-container {
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
  flex-wrap: wrap;
  gap: 15px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.search-box {
  width: 300px;
}

.search-input {
  width: 100%;
}

.stats {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.flower-grid {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

.flower-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flower-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.flower-cover {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 4px;
  background: #f0f2f5;
}

.flower-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.flower-card:hover .flower-image {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  background: #f0f2f5;
}

.image-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.flower-info {
  padding: 12px 0;
  text-align: center;
}

.flower-name {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.flower-name-en {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #909399;
}

/* 详情弹窗样式 */
.detail-dialog {
  max-width: 1200px;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flower-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.flower-title-en {
  font-size: 14px;
  color: #909399;
}

.image-gallery {
  min-height: 300px;
}

.gallery-item {
  position: relative;
  width: 100%;
  height: 150px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.gallery-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-item:hover .image-overlay {
  opacity: 1;
}

.image-overlay .el-icon {
  color: white;
  font-size: 30px;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  color: #c0c4cc;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-count-info {
  color: #909399;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-box {
    width: 100%;
  }
  
  .gallery-item {
    height: 120px;
  }
}
</style>
