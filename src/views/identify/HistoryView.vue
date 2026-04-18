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
              <el-tag size="small" type="info">{{ item.model_display }}</el-tag>
            </div>
            <div class="time">{{ item.created_at }}</div>
          </div>

          <div class="top-results" v-if="item.top_results && item.top_results.length > 1">
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
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const history = ref([])
const loading = ref(false)

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
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.success) {
      history.value = response.data.history
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

onMounted(() => {
  fetchHistory()
})
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

.no-login, .no-history {
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
</style>