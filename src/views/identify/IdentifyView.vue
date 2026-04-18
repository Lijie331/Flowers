<template>
  <div class="identify-container">
    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>植物识别</span>
              <el-tag type="success" size="small">LIFT模型</el-tag>
            </div>
          </template>

          <!-- 模型选择下拉框 -->
          <div class="model-selector">
            <span class="model-label">选择模型：</span>
            <el-select v-model="selectedModel" placeholder="请选择模型" size="default">
              <el-option
                v-for="model in modelOptions"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              >
                <div class="model-option">
                  <span>{{ model.label }}</span>
                  <span class="model-badge">{{ model.badge }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 上传区域 -->
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept="image/*"
            list-type="picture"
          >
            <div v-if="!imageUrl">
              <el-icon class="upload-icon"><upload-filled /></el-icon>
              <div class="upload-text">将植物图片拖拽到此处，或点击上传</div>
              <div class="upload-hint">支持 JPG、PNG 格式</div>
            </div>
          </el-upload>

          <!-- 图片预览 -->
          <div v-if="imageUrl" class="image-preview">
            <el-image :src="imageUrl" fit="contain" :preview-src-list="[imageUrl]" />
          </div>

          <!-- 操作按钮 -->
          <el-space style="margin-top: 16px" wrap>
            <el-button
              type="primary"
              :loading="loading"
              :disabled="!selectedFile"
              @click="handleIdentify"
            >
              <el-icon v-if="!loading"><magic-stick /></el-icon>
              {{ loading ? '识别中...' : '开始识别' }}
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-space>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card class="result-card">
          <template #header>
            <span>识别结果</span>
          </template>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <el-icon class="is-loading"><loading /></el-icon>
            <p>正在分析图片...</p>
          </div>

          <!-- 无结果状态 -->
          <el-empty v-else-if="!results.length" description="上传图片后显示识别结果" />

          <!-- 识别结果 -->
          <div v-else class="result-content">
            <!-- 主要结果 -->
            <div class="top-result">
              <div class="result-label">最可能的类别</div>
              <div class="result-name">{{ results[0]?.name_cn }}</div>
              <div class="result-name-en">{{ results[0]?.name }}</div>

              <!-- 置信度大数字显示 -->
              <div class="confidence-display">
                <span class="confidence-value">{{ results[0]?.confidence }}</span>
                <span class="confidence-symbol">%</span>
                <span class="confidence-label">置信度</span>
              </div>

              <!-- 置信度进度条 -->
              <div class="result-confidence">
                <el-progress
                  :percentage="results[0]?.confidence"
                  :color="getProgressColor(results[0]?.confidence)"
                  :format="formatPercentage"
                  :stroke-width="12"
                />
              </div>
            </div>

            <!-- 其他结果 -->
            <div class="other-results">
              <div class="result-label">其他可能</div>
              <div
                v-for="(result, index) in results.slice(1)"
                :key="result.class_id"
                class="result-item"
              >
                <span class="result-rank">{{ index + 2 }}</span>
                <span class="result-item-name">{{ result.name_cn }}</span>
                <div class="result-item-bar">
                  <div
                    class="result-item-bar-fill"
                    :style="{
                      width: result.confidence + '%',
                      background: getProgressColor(result.confidence),
                    }"
                  ></div>
                </div>
                <span class="result-item-confidence">{{ result.confidence }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, MagicStick, Loading } from '@element-plus/icons-vue'

// API地址 - 根据环境配置
const API_BASE_URL = 'http://127.0.0.1:5000'

// 模型选项配置
const modelOptions = [
  { value: 'clip_rn50', label: 'ResNet50', badge: '快速' },
  { value: 'clip_rn101', label: 'ResNet101', badge: '平衡' },
  { value: 'clip_vit_b16', label: 'ViT-B/16', badge: '高精度(速度较慢)' },
  { value: 'clip_vit_l14', label: 'ViT-L/14', badge: '最高精度(速度慢)' },
]

// 当前选中的模型
const selectedModel = ref('clip_rn50')

// 状态变量
const uploadRef = ref(null)
const selectedFile = ref(null)
const imageUrl = ref('')
const loading = ref(false)
const results = ref([])

// 处理文件选择
const handleFileChange = (uploadFile) => {
  selectedFile.value = uploadFile.raw
  imageUrl.value = URL.createObjectURL(uploadFile.raw)
  results.value = [] // 清空之前的结果
}

// 处理文件移除
const handleFileRemove = () => {
  selectedFile.value = null
  imageUrl.value = ''
  results.value = []
}

// 重置
const handleReset = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  selectedFile.value = null
  imageUrl.value = ''
  results.value = []
}

// 发送识别请求
const handleIdentify = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择一张图片')
    return
  }

  loading.value = true
  results.value = []

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    formData.append('top_k', 5)
    // 传递选中的模型名称
    formData.append('model', selectedModel.value)

    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      results.value = data.results
      ElMessage.success('识别完成')
    } else {
      ElMessage.error(data.error || '识别失败')
    }
  } catch (error) {
    console.error('识别请求失败:', error)
    ElMessage.error('无法连接到后端服务，请确保Flask服务已启动')
  } finally {
    loading.value = false
  }
}

// 格式化百分比
const formatPercentage = (percentage) => `${percentage}%`

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#909399'
}
</script>

<style scoped>
.identify-container {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 40px 20px;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.image-preview {
  margin-top: 16px;
  max-height: 300px;
  display: flex;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px;
}

.image-preview :deep(.el-image) {
  max-height: 280px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.loading-state .el-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.top-result {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.result-name {
  font-size: 24px;
  font-weight: bold;
  margin: 12px 0 4px 0;
}

.result-name-en {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
}

/* 置信度大数字显示 */
.confidence-display {
  display: flex;
  align-items: baseline;
  margin: 16px 0;
  gap: 4px;
}

.confidence-value {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.confidence-symbol {
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

.confidence-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 8px;
  text-transform: uppercase;
}

.result-confidence {
  margin-top: 12px;
}

.other-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  gap: 12px;
}

.result-item-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  min-width: 60px;
}

.result-item-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.result-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #909399;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.result-item-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.result-item-confidence {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}
</style>
