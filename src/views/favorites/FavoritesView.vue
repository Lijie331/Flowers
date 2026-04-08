<template>
  <div class="favorites-container">
    <!-- 页面标题 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">❤️ 我的收藏</span>
        </div>
      </template>
      <div class="stats">
        <el-tag type="danger" size="large">共 {{ favorites.length }} 个收藏</el-tag>
      </div>
    </el-card>

    <!-- 收藏列表 -->
    <div v-loading="loading" class="favorites-grid">
      <el-empty v-if="!loading && favorites.length === 0" description="还没有收藏任何花卉">
        <el-button type="primary" @click="$router.push('/encyclopedia')">去百科看看</el-button>
      </el-empty>
      
      <el-row :gutter="20" v-else>
        <el-col 
          v-for="item in favorites" 
          :key="item.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <el-card class="favorite-card" shadow="hover">
            <div class="card-header">
              <span class="flower-name">{{ item.chinese_name || item.flower_name }}</span>
              <el-icon class="unfavorite-icon" @click.stop="unfavorite(item.id)"><Close /></el-icon>
            </div>
            <p class="latin-name">{{ item.latin_name || item.flower_name }}</p>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="goToGallery(item)">查看图库</el-button>
              <el-button type="success" size="small" @click="addToGarden(item)">加入花园</el-button>
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
import { Close } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const API_BASE = 'http://127.0.0.1:5000/api'

const loading = ref(false)
const favorites = ref([])

// 获取收藏列表
const fetchFavorites = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/community/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      favorites.value = data.data.favorites
    }
  } catch (error) {
    ElMessage.error('获取收藏失败')
  } finally {
    loading.value = false
  }
}

// 取消收藏
const unfavorite = async (id) => {
  try {
    await ElMessageBox.confirm('确定取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/community/favorites/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已取消收藏')
      fetchFavorites()
    }
  } catch {}
}

// 查看图库
const goToGallery = (item) => {
  router.push(`/gallery?flower=${encodeURIComponent(item.flower_name)}`)
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

onMounted(() => {
  fetchFavorites()
})

// 监听路由变化，刷新数据
watch(() => route.path, () => {
  if (route.path === '/favorites') {
    fetchFavorites()
  }
})
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

.stats {
  margin-top: 10px;
}

.favorites-grid {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

.favorite-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flower-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.unfavorite-icon {
  cursor: pointer;
  color: #909399;
  font-size: 18px;
}

.unfavorite-icon:hover {
  color: #f56c6c;
}

.latin-name {
  margin: 8px 0 16px;
  font-size: 13px;
  color: #909399;
  font-style: italic;
}

.card-actions {
  display: flex;
  gap: 8px;
}
</style>
