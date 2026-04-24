<template>
  <div class="history-container">
    <div class="history-header">
      <h2>识别历史</h2>
      <el-button @click="fetchHistory" :loading="loading" circle>
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <div v-if="!isLoggedIn" class="no-login">
      <el-empty description="请先登录后查看历史记录">
        <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
      </el-empty>
    </div>

    <div v-else-if="history.length === 0" class="no-history">
      <el-empty description="暂无识别记录，快去识别花卉吧！">
        <el-button type="primary" @click="$router.push('/identify')">去识别</el-button>
      </el-empty>
    </div>

    <div v-else class="history-list">
      <el-card v-for="item in history" :key="item.id" class="history-item" shadow="hover">
        <div class="history-content">
          <div class="history-main">
            <div class="flower-name">{{ item.predicted_class_name }}</div>
            <div class="flower-en">{{ item.predicted_class_en }}</div>
            <div class="confidence">
              <span class="confidence-label">置信度</span>
              <span class="confidence-value">{{ item.confidence }}%</span>
            </div>
          </div>

          <div class="history-meta">
            <div class="model-badge">
              <el-tag v-if="item.is_batch" type="warning" size="small">批量 · {{ item.image_count }}张</el-tag>
              <el-tag v-else size="small" type="info">{{ item.model_display }}</el-tag>
            </div>
            <div class="time">{{ item.created_at }}</div>
          </div>

          <!-- 单图记录的图片 -->
          <div v-if="!item.is_batch && item.image_url" class="single-image-preview">
            <el-image
              :src="getImageSrc(item.image_url)"
              fit="contain"
              class="history-thumb"
              :preview-src-list="[getImageSrc(item.image_url)]"
              :hide-on-click-modal="true"
            />
          </div>

          <!-- 批量记录详情 -->
          <div v-if="item.is_batch" class="batch-detail">
            <div class="batch-summary">
              <div class="results-title">综合结果：</div>
              <div class="results-list">
                <span
                  v-for="(result, index) in (item.top_results_obj?.summary || [])"
                  :key="index"
                  class="result-tag"
                >
                  {{ result.name_cn }} ({{ result.avgConfidence }}%)
                </span>
              </div>
            </div>
            <el-button size="small" text @click="toggleBatchDetail(item.id)">
              {{ item._expanded ? '收起' : '查看' }}{{ item.image_count }}张图片详情
            </el-button>
            <div v-if="item._expanded" class="batch-images">
              <div v-for="img in (item.top_results_obj?.images || [])" :key="img.image_index" class="batch-image-item">
                <div class="batch-image-header">第 {{ img.image_index + 1 }} 张</div>
                <div v-if="img.image_url" class="batch-image-thumb">
                  <img :src="getImageSrc(img.image_url)" alt="识别图片" />
                </div>
                <div class="batch-image-result" v-if="img.top_result">
                  <span class="batch-image-flower">{{ img.top_result.name_cn }}</span>
                  <span class="batch-image-conf">{{ img.top_result.confidence }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 单图记录的其他可能 -->
          <div class="top-results" v-else-if="item.top_results && item.top_results.length > 1">
            <div class="results-title">其他可能：</div>
            <div class="results-list">
              <span
                v-for="(result, index) in item.top_results.slice(1, 4)"
                :key="index"
                class="result-tag"
              >
                {{ result.name_cn }} ({{ result.confidence }}%)
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
  <el-pagination
    v-if="total > 0"
    background
    layout="prev, pager, next"
    :total="total"
    :page-size="pageSize"
    :current-page="page"
    @current-change="handlePageChange"
    style="margin-top: 20px; text-align: center"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const history = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const isLoggedIn = computed(() => {
  const token = localStorage.getItem('token')
  return !!token
})

const fetchHistory = async () => {
  if (!isLoggedIn.value) return

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/identify/history', {
      params: {
        page: page.value,
        page_size: pageSize.value,
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.data.success) {
      // 解析每条记录，检测批量识别
      history.value = response.data.history.map(item => {
        let topResultsObj = null
        let isBatch = false
        let imageCount = 1

        try {
          const topResults = item.top_results
          if (typeof topResults === 'string') {
            topResultsObj = JSON.parse(topResults)
          } else {
            topResultsObj = topResults
          }
          if (topResultsObj && topResultsObj.batch === true) {
            isBatch = true
            imageCount = topResultsObj.image_count || 1
          }
        } catch (e) {
          // 解析失败，忽略
        }

        return {
          ...item,
          is_batch: isBatch,
          image_count: imageCount,
          top_results_obj: topResultsObj,
          _expanded: false
        }
      })
      total.value = response.data.total
    } else {
      ElMessage.error('获取历史记录失败')
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
  }
}

const toggleBatchDetail = (id) => {
  const item = history.value.find(h => h.id === id)
  if (item) {
    item._expanded = !item._expanded
  }
}

const API_BASE_URL = 'http://127.0.0.1:5000'

const getImageSrc = (imageUrl) => {
  if (!imageUrl) return ''
  // 旧格式：base64
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }
  // 新格式：文件路径，拼接API地址
  return API_BASE_URL + imageUrl
}

onMounted(() => {
  fetchHistory()
})

const handlePageChange = (p) => {
  if (p === page.value) return
  page.value = p
  fetchHistory()
}
</script>

<style scoped>
.history-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.history-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.no-login,
.no-history {
  text-align: center;
  padding: 60px 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  border-radius: 8px;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.flower-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.flower-en {
  font-size: 14px;
  color: #999;
}

.confidence {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.confidence-label {
  font-size: 12px;
  color: #999;
}

.confidence-value {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.model-badge {
  display: flex;
  gap: 8px;
}

.time {
  font-size: 12px;
  color: #999;
}

.top-results {
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.results-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.results-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-tag {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.batch-detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.batch-summary {
  margin-bottom: 8px;
}

.batch-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.batch-image-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-image-header {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.batch-image-thumb {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #eee;
}

.batch-image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.batch-image-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.batch-image-flower {
  color: #333;
  font-weight: 500;
}

.batch-image-conf {
  color: #67c23a;
  font-weight: bold;
}

.single-image-preview {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.history-thumb {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
}
</style>
