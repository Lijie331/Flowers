<template>
  <div class="garden-container">
    <!-- 页面标题 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">🌸 我的花园</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加植物
          </el-button>
        </div>
      </template>
      <div class="stats">
        <el-tag type="success" size="large">共 {{ plants.length }} 株植物</el-tag>
      </div>
    </el-card>

    <!-- 花园展示 -->
    <div v-loading="loading" class="garden-grid">
      <el-empty v-if="!loading && plants.length === 0" description="您的花园还没有植物，快来添加吧！">
        <el-button type="primary" @click="showAddDialog = true">添加第一株植物</el-button>
      </el-empty>
      
      <el-row :gutter="20" v-else>
        <el-col 
          v-for="plant in plants" 
          :key="plant.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <el-card class="plant-card" shadow="hover" @click="goToDetail(plant.id)">
            <div class="plant-header" @click.stop>
              <el-tag :type="getStatusType(plant.status)" size="small">
                {{ getStatusText(plant.status) }}
              </el-tag>
              <el-dropdown trigger="click">
                <el-icon class="more-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToDetail(plant.id)">🌸 详情</el-dropdown-item>
                    <el-dropdown-item @click="editPlant(plant)">✏️ 编辑</el-dropdown-item>
                    <el-dropdown-item @click="deletePlant(plant.id)" divided>🗑️ 删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="plant-name">
              <h3>{{ plant.nickname || plant.flower_name }}</h3>
              <p class="latin-name" v-if="plant.nickname">{{ plant.latin_name || plant.flower_name }}</p>
            </div>
            
            <div class="plant-info">
              <p v-if="plant.location"><el-icon><Location /></el-icon> {{ plant.location }}</p>
              <p v-if="plant.acquired_date"><el-icon><Calendar /></el-icon> {{ formatDate(plant.acquired_date) }}</p>
            </div>
            
            <div class="plant-notes" v-if="plant.notes">
              {{ plant.notes }}
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加植物对话框 -->
    <el-dialog v-model="showAddDialog" title="添加到花园" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="花卉名称" required>
          <el-input v-model="form.searchKeyword" placeholder="搜索花卉..." @input="searchFlowers" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <div class="flower-suggestions" v-if="flowerSuggestions.length">
            <div 
              v-for="f in flowerSuggestions" 
              :key="f.id"
              class="suggestion-item"
              @click="selectFlower(f)"
            >
              {{ f.chinese_name }} ({{ f.latin_name }})
            </div>
          </div>
          <div v-if="form.flower_name" class="selected-flower">
            已选择: {{ form.chinese_name || form.flower_name }}
          </div>
        </el-form-item>
        
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="给植物起个名字..." />
        </el-form-item>
        
        <el-form-item label="放置位置">
          <el-input v-model="form.location" placeholder="如: 阳台、客厅..." />
        </el-form-item>
        
        <el-form-item label="获得日期">
          <el-date-picker v-model="form.acquired_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="健康" value="healthy" />
            <el-option label="生长中" value="growing" />
            <el-option label="休眠" value="dormant" />
            <el-option label="生病" value="sick" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="养护笔记..." />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPlant" :loading="submitting">添加</el-button>
      </template>
    </el-dialog>

    <!-- 照片图册对话框 -->
    <el-dialog v-model="showPhotoDialog" :title="`${currentPlant?.nickname || currentPlant?.flower_name || ''} - 成长记录`" width="700px">
      <div class="photo-toolbar">
        <el-button type="primary" size="small" @click="showUploadPanel = !showUploadPanel">
          <el-icon><Upload /></el-icon>
          {{ showUploadPanel ? '取消上传' : '添加照片' }}
        </el-button>
      </div>
      
      <!-- 上传面板 -->
      <div v-if="showUploadPanel" class="upload-panel">
        <el-form :model="photoForm" label-width="80px" size="small">
          <el-form-item label="记录日期" required>
            <el-date-picker 
              v-model="photoForm.recorded_date" 
              type="date" 
              placeholder="选择日期" 
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="photoForm.notes" placeholder="记录此刻的成长状态..." />
          </el-form-item>
          <el-form-item label="上传照片" required>
            <el-upload
              ref="photoUploadRef"
              :auto-upload="false"
              :limit="1"
              accept="image/*"
              :on-change="handlePhotoChange"
              :file-list="photoFileList"
              list-type="picture"
            >
              <el-button type="primary" plain>
                <el-icon><Plus /></el-icon> 选择图片
              </el-button>
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="uploadPhoto" :loading="uploadingPhoto" :disabled="!photoForm.recorded_date || !selectedPhotoFile">
              上传照片
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 照片列表 -->
      <div v-loading="loadingPhotos" class="photo-gallery">
        <el-empty v-if="!loadingPhotos && plantPhotos.length === 0" description="暂无照片记录" />
        <div v-else class="photo-grid">
          <div v-for="photo in plantPhotos" :key="photo.id" class="photo-item">
            <el-image 
              :src="photo.image_url" 
              :preview-src-list="[photo.image_url]" 
              fit="cover"
              class="photo-image"
            />
            <div class="photo-info">
              <span class="photo-date">{{ photo.recorded_date || photo.created_at?.split('T')[0] }}</span>
              <span v-if="photo.notes" class="photo-notes">{{ photo.notes }}</span>
            </div>
            <el-button 
              type="danger" 
              size="small" 
              circle 
              class="delete-photo-btn"
              @click="deletePhoto(photo.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled, Location, Calendar, Search, Upload, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const API_BASE = 'http://127.0.0.1:5000/api'
const ENCYCLOPEDIA_API = 'http://127.0.0.1:5000/api/encyclopedia'

const loading = ref(false)
const plants = ref([])
const showAddDialog = ref(false)
const submitting = ref(false)
const flowerSuggestions = ref([])

// 照片相关
const showPhotoDialog = ref(false)
const currentPlant = ref(null)
const plantPhotos = ref([])
const loadingPhotos = ref(false)
const showUploadPanel = ref(false)
const uploadingPhoto = ref(false)
const photoUploadRef = ref(null)
const selectedPhotoFile = ref(null)
const photoFileList = ref([])

const photoForm = ref({
  recorded_date: '',
  notes: ''
})

const form = ref({
  flower_id: null,
  flower_name: '',
  latin_name: '',
  chinese_name: '',
  nickname: '',
  location: '',
  acquired_date: '',
  status: 'healthy',
  notes: ''
})

// 获取花园列表
const fetchGarden = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      plants.value = data.data.plants
    } else {
      ElMessage.error(data.error || '获取花园失败')
    }
  } catch (error) {
    ElMessage.error('获取花园失败')
  } finally {
    loading.value = false
  }
}

// 搜索花卉
const searchFlowers = async () => {
  if (!form.value.searchKeyword || form.value.searchKeyword.length < 1) {
    flowerSuggestions.value = []
    return
  }
  
  try {
    const response = await fetch(`${ENCYCLOPEDIA_API}/search?keyword=${encodeURIComponent(form.value.searchKeyword)}&page_size=10`)
    const data = await response.json()
    if (data.success) {
      flowerSuggestions.value = data.data.flowers.slice(0, 5)
    }
  } catch (error) {
    console.error('搜索失败', error)
  }
}

// 选择花卉
const selectFlower = (flower) => {
  form.value.flower_id = flower.id
  form.value.flower_name = flower.chinese_name || flower.latin_name
  form.value.latin_name = flower.latin_name
  form.value.chinese_name = flower.chinese_name
  flowerSuggestions.value = []
}

// 提交植物
const submitPlant = async () => {
  if (!form.value.flower_name) {
    ElMessage.warning('请选择花卉')
    return
  }
  
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  submitting.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('添加成功')
      showAddDialog.value = false
      resetForm()
      fetchGarden()
    } else {
      ElMessage.error(data.error || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    submitting.value = false
  }
}

// 跳转到详情页
const goToDetail = (plantId) => {
  router.push(`/garden/${plantId}`)
}

// 编辑植物
const editPlant = async (plant) => {
  const { value: newNotes } = await ElMessageBox.prompt('修改备注', '编辑植物', {
    inputValue: plant.notes,
    confirmButtonText: '保存',
    cancelButtonText: '取消'
  })
  
  if (newNotes !== null) {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${API_BASE}/community/garden/${plant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: newNotes })
      })
      const data = await response.json()
      if (data.success) {
        ElMessage.success('更新成功')
        fetchGarden()
      }
    } catch (error) {
      ElMessage.error('更新失败')
    }
  }
}

// 删除植物
const deletePlant = async (id) => {
  try {
    await ElMessageBox.confirm('确定要从花园移除这株植物吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/community/garden/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已移除')
      fetchGarden()
    }
  } catch {}
}

// 打开照片对话框
const openPhotoDialog = async (plant) => {
  currentPlant.value = plant
  showPhotoDialog.value = true
  showUploadPanel.value = false
  photoFileList.value = []
  selectedPhotoFile.value = null
  photoForm.value = { recorded_date: '', notes: '' }
  await fetchPlantPhotos(plant.id)
}

// 获取植物照片
const fetchPlantPhotos = async (plantId) => {
  const token = localStorage.getItem('token')
  loadingPhotos.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden/${plantId}/photos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      plantPhotos.value = data.data.photos || []
    }
  } catch (error) {
    ElMessage.error('获取照片失败')
  } finally {
    loadingPhotos.value = false
  }
}

// 处理照片选择
const handlePhotoChange = (file) => {
  selectedPhotoFile.value = file.raw
  photoFileList.value = [file]
}

// 上传照片
const uploadPhoto = async () => {
  if (!selectedPhotoFile.value || !photoForm.value.recorded_date) {
    ElMessage.warning('请选择照片和记录日期')
    return
  }
  
  const token = localStorage.getItem('token')
  uploadingPhoto.value = true
  
  const formData = new FormData()
  formData.append('image', selectedPhotoFile.value)
  formData.append('recorded_date', photoForm.value.recorded_date)
  if (photoForm.value.notes) {
    formData.append('notes', photoForm.value.notes)
  }
  
  try {
    const response = await fetch(`${API_BASE}/community/garden/${currentPlant.value.id}/photos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('照片上传成功')
      showUploadPanel.value = false
      photoFileList.value = []
      selectedPhotoFile.value = null
      photoForm.value = { recorded_date: '', notes: '' }
      await fetchPlantPhotos(currentPlant.value.id)
    } else {
      ElMessage.error(data.error || '上传失败')
    }
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploadingPhoto.value = false
  }
}

// 删除照片
const deletePhoto = async (photoId) => {
  try {
    await ElMessageBox.confirm('确定要删除这张照片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/community/garden/photos/${photoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已删除')
      await fetchPlantPhotos(currentPlant.value.id)
    }
  } catch {}
}

// 重置表单
const resetForm = () => {
  form.value = {
    flower_id: null,
    flower_name: '',
    latin_name: '',
    chinese_name: '',
    nickname: '',
    location: '',
    acquired_date: '',
    status: 'healthy',
    notes: ''
  }
}

// 状态显示
const getStatusType = (status) => {
  const map = { healthy: 'success', growing: 'primary', dormant: 'info', sick: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { healthy: '健康', growing: '生长中', dormant: '休眠', sick: '生病' }
  return map[status] || status
}

const formatDate = (date) => {
  if (!date) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchGarden()
})

// 监听路由变化，刷新数据
watch(() => route.path, () => {
  if (route.path === '/garden') {
    fetchGarden()
  }
})
</script>

<style scoped>
.garden-container {
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

.garden-grid {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

.plant-card {
  margin-bottom: 20px;
}

.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.more-icon {
  cursor: pointer;
  font-size: 18px;
}

.plant-name {
  text-align: center;
  margin-bottom: 10px;
}

.plant-name h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.latin-name {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.plant-info {
  font-size: 13px;
  color: #606266;
}

.plant-info p {
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.plant-notes {
  margin-top: 10px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.flower-suggestions {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-top: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
}

.suggestion-item:hover {
  background: #f5f7fa;
}

.selected-flower {
  margin-top: 8px;
  padding: 8px;
  background: #ecf5ff;
  border-radius: 4px;
  color: #409eff;
  font-size: 14px;
}

/* 照片图册样式 */
.photo-toolbar {
  margin-bottom: 15px;
}

.upload-panel {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.photo-gallery {
  min-height: 200px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.photo-image {
  width: 100%;
  height: 160px;
  display: block;
}

.photo-info {
  padding: 8px;
}

.photo-date {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.photo-notes {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-photo-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.photo-item:hover .delete-photo-btn {
  opacity: 1;
}
</style>
