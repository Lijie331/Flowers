<template>
  <div class="encyclopedia-page">
    <!-- 固定搜索区域 -->
    <div class="search-section">
      <el-card>
        <template #header>
          <div class="header-row">
            <span>植物百科</span>
            <el-tag type="success" effect="light">知识库</el-tag>
          </div>
        </template>

        <el-row :gutter="12">
          <el-col :xs="24" :md="11">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索植物名称，例如：玫瑰、月季" 
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch" />
              </template>
            </el-input>
          </el-col>
          <el-col :xs="12" :md="4">
            <el-select 
              v-model="filterType" 
              placeholder="筛选方式"
              class="full-width"
              @change="handleFilterTypeChange"
            >
              <el-option label="按科筛选" value="family" />
              <el-option label="按属筛选" value="genus" />
            </el-select>
          </el-col>
          <el-col :xs="12" :md="6">
            <el-select 
              v-model="selectedCategory" 
              :placeholder="filterType === 'family' ? '选择科' : '选择属'" 
              class="full-width"
              clearable
              filterable
              @change="handleSearch"
            >
              <el-option 
                v-for="cat in categories" 
                :key="cat" 
                :label="cat" 
                :value="cat" 
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :md="3">
            <el-button type="default" class="full-width" @click="handleReset">
              <el-icon><RefreshRight /></el-icon> 重置
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 动态内容区域 -->
    <div class="content-section">
      <!-- 加载状态 -->
      <el-card v-if="loading" class="loading-card">
        <el-skeleton :rows="3" animated />
      </el-card>

      <!-- 无结果提示 -->
      <div v-else-if="pagination.total === 0 && (searchKeyword || selectedCategory)" class="empty-result">
        <el-empty description="未找到匹配的结果" />
      </div>

      <!-- 花卉列表 -->
      <div v-else-if="!loading && flowers.length > 0" class="flower-list">
        <div class="result-info">
          共找到 <strong>{{ pagination.total }}</strong> 条记录
        </div>
        <el-row :gutter="16">
          <el-col 
            v-for="flower in flowers" 
            :key="flower.id" 
            :xs="24" :sm="12" :md="8" :lg="6"
            class="flower-card-col"
          >
            <el-card class="flower-card" shadow="hover" @click="showFlowerDetail(flower)">
              <!-- 花卉图片 -->
              <div class="flower-image-container">
                <el-image 
                  v-if="flower.image_url"
                  :src="flower.image_url"
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
                <div v-else class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
              
              <template #header>
                <div class="flower-header">
                  <span class="flower-name">{{ flower.chinese_name }}</span>
                  <el-tag size="small" type="info">{{ flower.category_id }}</el-tag>
                </div>
              </template>
              
              <div class="flower-content">
                <p class="latin-name"><em>{{ flower.latin_name }}</em></p>
                <p class="family-genus">{{ flower.family }} · {{ flower.genus }}</p>
                <div class="flower-preview">
                  <el-text class="preview-text" truncated>
                    {{ flower.morphology?.substring(0, 60) }}...
                  </el-text>
                </div>
                <div class="flower-tags">
                  <el-tag size="small" type="success" effect="plain" v-if="flower.flower_language">
                    {{ flower.flower_language }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 分页 -->
        <div class="pagination-container" v-if="pagination.total > 0">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.page_size"
            :page-sizes="[8, 12, 24, 48]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSearch"
            @current-change="handleSearch"
          />
        </div>
      </div>

      <!-- 初始空状态 -->
      <div v-else-if="!loading && flowers.length === 0 && !searchKeyword && !selectedCategory" class="empty-state">
        <el-empty description="请输入关键词或选择分类进行搜索" />
      </div>
    </div>

    <!-- 花卉详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="currentFlower?.chinese_name" width="800px">
      <template #header v-if="currentFlower">
        <span>{{ currentFlower.chinese_name }}</span>
        <el-tag size="small" style="margin-left: 10px" type="info">
          {{ currentFlower.family }} · {{ currentFlower.genus }}
        </el-tag>
      </template>
      
      <div v-if="currentFlower" class="flower-detail">
        <!-- 花卉图片轮播 -->
        <div v-if="currentFlower.images && currentFlower.images.length > 0" class="detail-images">
          <el-carousel :interval="4000" type="card" height="250px">
            <el-carousel-item v-for="(img, index) in currentFlower.images" :key="index">
              <el-image 
                :src="img" 
                fit="contain" 
                class="carousel-image"
                :initial-index="index"
              />
            </el-carousel-item>
          </el-carousel>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="中文名">
            {{ currentFlower.chinese_name }}
          </el-descriptions-item>
          <el-descriptions-item label="拉丁学名">
            <em>{{ currentFlower.latin_name }}</em>
          </el-descriptions-item>
          <el-descriptions-item label="科">
            {{ currentFlower.family }}
          </el-descriptions-item>
          <el-descriptions-item label="属">
            {{ currentFlower.genus }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">形态特征</el-divider>
        <p class="detail-text">{{ currentFlower.morphology }}</p>

        <el-divider content-position="left">生长环境</el-divider>
        <p class="detail-text">{{ currentFlower.habitat }}</p>

        <el-divider content-position="left">生长习性</el-divider>
        <p class="detail-text">{{ currentFlower.growth_habit }}</p>

        <el-divider content-position="left">观赏价值</el-divider>
        <p class="detail-text">{{ currentFlower.ornamental_value }}</p>

        <el-divider content-position="left">养护方法</el-divider>
        <p class="detail-text">{{ currentFlower.care_methods }}</p>

        <el-divider content-position="left">花语</el-divider>
        <p class="detail-text flower-language">
          <el-tag type="success">{{ currentFlower.flower_language }}</el-tag>
        </p>

        <el-divider content-position="left">其他信息</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="数据来源">
            {{ currentFlower.data_source || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="采集日期">
            {{ currentFlower.collected_date || '未知' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, RefreshRight, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// API基础URL - 使用相对路径，通过vite代理
const API_BASE = '/api'

// 搜索相关
const searchKeyword = ref('')
const selectedCategory = ref('')
const filterType = ref('family')
const flowers = ref([])
const categories = ref([])
const loading = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  page_size: 12,
  total: 0
})

// 详情弹窗
const detailVisible = ref(false)
const currentFlower = ref(null)

// 加载分类
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/encyclopedia/categories?type=${filterType.value}`)
    const data = await res.json()
    if (data.success) {
      categories.value = data.categories
    }
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

// 切换筛选方式
function handleFilterTypeChange() {
  selectedCategory.value = ''
  loadCategories()
  handleSearch()
}

// 重置筛选
function handleReset() {
  searchKeyword.value = ''
  selectedCategory.value = ''
  filterType.value = 'family'
  pagination.page = 1
  loadCategories()
  handleSearch()
}

// 搜索花卉
async function handleSearch() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)
    if (selectedCategory.value) params.append('category_id', selectedCategory.value)
    params.append('page', pagination.page)
    params.append('page_size', pagination.page_size)

    const res = await fetch(`${API_BASE}/encyclopedia/search?${params}`)
    const data = await res.json()
    
    if (data.success) {
      flowers.value = data.data.flowers
      pagination.total = data.data.pagination.total
      pagination.page = data.data.pagination.page
    } else {
      ElMessage.error(data.error || '搜索失败')
    }
  } catch (e) {
    console.error('搜索失败:', e)
    ElMessage.error('无法连接到服务器，请确保后端服务已启动')
  } finally {
    loading.value = false
  }
}

// 显示花卉详情
function showFlowerDetail(flower) {
  currentFlower.value = flower
  detailVisible.value = true
}

// 初始化
onMounted(() => {
  loadCategories()
  handleSearch()
})
</script>

<style scoped>
.encyclopedia-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-section {
flex-shrink: 0;
}

.content-section {
  flex: 1;
  min-height: 0;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.full-width {
  width: 100%;
}

.loading-card {
  min-height: 300px;
}

.empty-result,
.empty-state {
  padding: 40px 0;
}

.flower-list {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.result-info {
  padding: 12px 0;
  color: #666;
  font-size: 14px;
}

.flower-card-col {
  margin-bottom: 16px;
}

.flower-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.flower-image-container {
  width: 100%;
  height: 180px;
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

.flower-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.flower-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flower-name {
  font-size: 16px;
  font-weight: bold;
  color: #2c5f2d;
}

.flower-content {
  font-size: 14px;
}

.latin-name {
  color: #666;
  margin: 8px 0 4px;
  font-size: 13px;
}

.family-genus {
  color: #888;
  margin: 0 0 8px;
  font-size: 12px;
}

.flower-preview {
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.preview-text {
  font-size: 12px;
  color: #666;
}

.flower-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.flower-detail {
  padding: 0 8px;
}

.detail-text {
  line-height: 1.8;
  color: #444;
  text-indent: 2em;
}

.flower-language {
  text-align: center;
}

.flower-language .el-tag {
  font-size: 16px;
  padding: 8px 16px;
}

/* 详情弹窗图片轮播 */
.detail-images {
  margin-bottom: 20px;
}

.carousel-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-images :deep(.el-carousel__item) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-images :deep(.el-carousel__item img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
