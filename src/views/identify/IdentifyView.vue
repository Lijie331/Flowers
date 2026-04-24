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

          <!-- 图片缩略图列表 -->
          <div v-if="images.length > 0" class="image-list">
            <div
              v-for="img in images"
              :key="img.id"
              class="image-item"
              :class="{ active: currentImageId === img.id, identified: img.results.length > 0 }"
              @click="selectImage(img.id)"
            >
              <el-image :src="img.imageUrl" fit="cover" class="image-thumb" />
              <div v-if="img.results.length > 0" class="image-badge">
                <el-tag size="small" type="success">{{ img.results[0]?.name_cn }}</el-tag>
              </div>
              <div v-if="img.results.length > 0" class="image-confidence">
                {{ img.results[0]?.confidence }}%
              </div>
              <el-icon class="remove-icon" @click.stop="removeImage(img.id)"><Close /></el-icon>
            </div>
          </div>

          <!-- 上传区域（始终显示） -->
          <div class="upload-box" @click="showUploadMenu = true">
            <el-dropdown trigger="click" v-model="showUploadMenu" @command="handleUploadCommand" hide-timeout="100">
              <div class="upload-box-content">
                <el-icon class="upload-box-icon"><Plus /></el-icon>
                <div class="upload-box-text">添加图片或文件夹</div>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="image">
                    <el-icon><Picture /></el-icon> 添加图片
                  </el-dropdown-item>
                  <el-dropdown-item command="folder">
                    <el-icon><FolderOpened /></el-icon> 上传文件夹
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 当前图片预览 + 框选区域 -->
          <div v-if="currentImage" class="image-preview-wrapper">
            <div
              class="crop-container"
              ref="cropContainerRef"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
              @mouseleave="onMouseUp"
            >
              <el-image
                :src="currentImage.imageUrl"
                fit="contain"
                class="preview-image"
                @load="onImageLoad"
              />

              <!-- 选区框 -->
              <div v-if="currentImage.crop.visible" class="crop-box" :style="cropStyle"></div>
            </div>

            <div class="crop-hint">
              <span v-if="!currentImage.crop.visible">拖拽鼠标创建选区</span>
              <span v-else>
                已选择: {{ Math.round(currentImage.crop.width) }} × {{ Math.round(currentImage.crop.height) }}
              </span>
              <el-button v-if="currentImage.crop.visible" size="small" text @click="clearCrop"> 清除 </el-button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <el-space style="margin-top: 16px" wrap>
            <el-button
              type="primary"
              :loading="loading"
              :disabled="!currentImage"
              @click="handleIdentify"
            >
              <el-icon v-if="!loading"><magic-stick /></el-icon>
              {{ loading ? '识别中...' : '开始识别' }}
            </el-button>
            <el-button
              type="warning"
              :loading="batchLoading"
              :disabled="images.length < 2"
              @click="handleBatchIdentify"
            >
              <el-icon v-if="!batchLoading"><Files /></el-icon>
              {{ batchLoading ? '批量识别中...' : '批量识别' }}
            </el-button>
            <el-button @click="handleReset">清空全部</el-button>
          </el-space>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card class="result-card">
          <template #header>
            <div class="card-header">
              <span>识别结果</span>
              <div>
                <el-button
                  v-if="currentImage?.results.length"
                  size="small"
                  type="primary"
                  link
                  @click="openFeedbackDialog"
                >
                  反馈
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  link
                  @click="$router.push('/identify/history')"
                >
                  查看历史
                </el-button>
              </div>
            </div>
          </template>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <el-icon class="is-loading"><loading /></el-icon>
            <p>正在分析图片...</p>
          </div>

          <!-- 无结果状态 -->
          <el-empty v-else-if="!currentImage || (!currentImage.results.length && !batchResults.length)" description="选择图片后点击识别" />

          <!-- 批量识别结果 -->
          <div v-else-if="batchResults.length > 0" class="result-content">
            <div class="batch-info">
              <el-tag type="warning">批量识别 · {{ images.length }} 张图片</el-tag>
            </div>
            <!-- 主要结果 -->
            <div class="top-result" @click="goToEncyclopedia(batchResults[0])" style="cursor: pointer;">
              <div class="result-header">
                <div class="result-info">
                  <div class="result-label">综合结果（平均置信度）</div>
                  <div class="result-name">{{ batchResults[0]?.name_cn }}</div>
                  <div class="result-name-en">{{ batchResults[0]?.name_en }}</div>
                </div>
                <el-image
                  v-if="batchResults[0]?.flowerImage"
                  :src="batchResults[0].flowerImage"
                  fit="cover"
                  class="flower-thumbnail"
                />
              </div>

              <div class="confidence-display">
                <span class="confidence-value">{{ batchResults[0]?.avgConfidence.toFixed(2) }}</span>
                <span class="confidence-symbol">%</span>
                <span class="confidence-label">平均置信度</span>
              </div>

              <div class="result-confidence">
                <el-progress
                  :percentage="batchResults[0]?.avgConfidence"
                  :color="getProgressColor(batchResults[0]?.avgConfidence)"
                  :format="formatPercentage"
                  :stroke-width="8"
                />
              </div>
            </div>

            <!-- 其他结果 -->
            <div class="other-results">
              <div class="result-label">其他可能</div>
              <div
                v-for="(result, index) in batchResults.slice(1)"
                :key="result.class_id"
                class="result-item"
                @click="goToEncyclopedia(result)"
                style="cursor: pointer;"
              >
                <span class="result-rank">{{ index + 2 }}</span>
                <span class="result-item-name">{{ result.name_cn }}</span>
                <div class="result-item-bar">
                  <div
                    class="result-item-bar-fill"
                    :style="{
                      width: result.avgConfidence + '%',
                      background: getProgressColor(result.avgConfidence),
                    }"
                  ></div>
                </div>
                <span class="result-item-confidence">{{ result.avgConfidence.toFixed(2) }}%</span>
              </div>
            </div>
          </div>

          <!-- 单张识别结果 -->
          <div v-else class="result-content">
            <!-- 主要结果 -->
            <div class="top-result" @click="goToEncyclopedia(currentImage.results[0])" style="cursor: pointer;">
              <div class="result-header">
                <div class="result-info">
                  <div class="result-label">最可能的类别</div>
                  <div class="result-name">{{ currentImage.results[0]?.name_cn }}</div>
                  <div class="result-name-en">{{ currentImage.results[0]?.name_en }}</div>
                </div>
                <el-image
                  v-if="currentImage.flowerImage"
                  :src="currentImage.flowerImage"
                  fit="cover"
                  class="flower-thumbnail"
                />
              </div>

              <!-- 置信度小数字显示 -->
              <div class="confidence-display">
                <span class="confidence-value">{{ currentImage.results[0]?.confidence }}</span>
                <span class="confidence-symbol">%</span>
                <span class="confidence-label">置信度</span>
              </div>

              <!-- 置信度进度条 -->
              <div class="result-confidence">
                <el-progress
                  :percentage="currentImage.results[0]?.confidence"
                  :color="getProgressColor(currentImage.results[0]?.confidence)"
                  :format="formatPercentage"
                  :stroke-width="8"
                />
              </div>
            </div>

            <!-- 其他结果 -->
            <div class="other-results">
              <div class="result-label">其他可能</div>
              <div
                v-for="(result, index) in currentImage.results.slice(1)"
                :key="result.class_id"
                class="result-item"
                @click="goToEncyclopedia(result)"
                style="cursor: pointer;"
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

    <FeedbackDialog v-model="feedbackDialogVisible" :feedback-data="feedbackData" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, MagicStick, Loading, Close, Plus, Files, FolderOpened, Picture, CaretBottom } from '@element-plus/icons-vue'
import FeedbackDialog from '@/components/feedback/FeedbackDialog.vue'

defineOptions({ name: 'IdentifyView' })

const $router = useRouter()

// API地址
const API_BASE_URL = 'http://127.0.0.1:5000'

// 模型选项配置
const modelOptions = ref([
  { value: 'clip_rn50', label: 'ResNet50', badge: '快速', enabled: true },
  { value: 'clip_rn101', label: 'ResNet101', badge: '平衡', enabled: true },
  { value: 'clip_vit_b16', label: 'ViT-B/16', badge: '高精度(速度较慢)', enabled: true },
  { value: 'clip_vit_l14', label: 'ViT-L/14', badge: '最高精度(速度慢)', enabled: true },
])

// 当前选中的模型
const selectedModel = ref('')

// 状态变量
const hasBeenMounted = ref(false)
const showUploadMenu = ref(false)
const loading = ref(false)
const batchLoading = ref(false)
const batchResults = ref([])
const feedbackDialogVisible = ref(false)
const feedbackData = ref({ plant_name: '', model_name: '' })
const cropContainerRef = ref(null)

// 图片列表
const images = ref([])
let imageIdCounter = 0

// 当前选中的图片ID
const currentImageId = ref(null)

// 当前选中的图片
const currentImage = computed(() => {
  return images.value.find(img => img.id === currentImageId.value) || null
})

// 图片加载状态
const imageLoaded = ref(false)
const imageRect = ref({ left: 0, top: 0, width: 0, height: 0 })

// 生成唯一ID
const generateId = () => {
  return `img_${++imageIdCounter}_${Date.now()}`
}

// 选择图片
const selectImage = (id) => {
  currentImageId.value = id
  // 切换图片时清空批量结果
  if (batchResults.value.length > 0) {
    batchResults.value = []
  }
}

// 处理上传下拉菜单命令
const handleUploadCommand = (command) => {
  if (command === 'image') {
    triggerUpload()
  } else if (command === 'folder') {
    triggerUploadFolder()
  }
}

// 触发上传文件夹
const triggerUploadFolder = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.webkitdirectory = true
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      handleFileAdd(file)
    })
  }
  input.click()
}

// 触发上传图片
const triggerUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleFileAdd(file)
      }
    })
  }
  input.click()
}

// 处理文件添加
const handleFileAdd = (file) => {
  const id = generateId()
  const imageUrl = URL.createObjectURL(file)
  const newImage = {
    id,
    file,
    imageUrl,
    crop: {
      visible: false,
      drawing: false,
      x: 0, y: 0, width: 0, height: 0,
      dragging: false, resizing: false, resizeDir: '',
      startX: 0, startY: 0,
      originX: 0, originY: 0, originW: 0, originH: 0,
    },
    results: [],
    flowerImage: '',
  }
  images.value.push(newImage)
  currentImageId.value = id
}

// 处理文件选择
const handleFileChange = (uploadFile) => {
  handleFileAdd(uploadFile.raw)
}

// 处理文件移除
const handleFileRemove = (uploadFile) => {
  removeImage(uploadFile.uid)
}

// 移除单张图片
const removeImage = (id) => {
  images.value = images.value.filter(img => img.id !== id)
  if (currentImageId.value === id) {
    currentImageId.value = images.value.length > 0 ? images.value[0].id : null
  }
}

// 重置
const handleReset = () => {
  images.value = []
  currentImageId.value = null
  imageIdCounter = 0
  batchResults.value = []
}

// 图片加载后获取真实显示区域
const onImageLoad = () => {
  imageLoaded.value = true
  const container = cropContainerRef.value
  if (!container) return
  const imgEl = container.querySelector('.preview-image')
  if (!imgEl) return
  imageRect.value = {
    left: imgEl.offsetLeft,
    top: imgEl.offsetTop,
    width: imgEl.offsetWidth,
    height: imgEl.offsetHeight,
  }
}

const getMousePos = (e) => {
  if (!cropContainerRef.value) return { x: 0, y: 0 }
  const rect = cropContainerRef.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left - imageRect.value.left,
    y: e.clientY - rect.top - imageRect.value.top,
    rect,
  }
}

// 框选样式
const cropStyle = computed(() => {
  if (!currentImage.value) return {}
  return {
    left: currentImage.value.crop.x + 'px',
    top: currentImage.value.crop.y + 'px',
    width: currentImage.value.crop.width + 'px',
    height: currentImage.value.crop.height + 'px',
  }
})

// 鼠标按下
const onMouseDown = (e) => {
  if (!currentImage.value) return
  const { x, y } = getMousePos(e)
  e.preventDefault()

  const crop = currentImage.value.crop
  if (
    crop.visible &&
    x > crop.x && x < crop.x + crop.width &&
    y > crop.y && y < crop.y + crop.height
  ) {
    crop.dragging = true
    crop.startX = x
    crop.startY = y
    return
  }

  crop.drawing = true
  crop.visible = true
  crop.x = x
  crop.y = y
  crop.width = 0
  crop.height = 0
  crop.startX = x
  crop.startY = y
}

// 鼠标移动
const onMouseMove = (e) => {
  if (!currentImage.value || !cropContainerRef.value) return

  const { x, y, rect } = getMousePos(e)
  const crop = currentImage.value.crop

  if (crop.dragging) {
    const dx = x - crop.startX
    const dy = y - crop.startY
    crop.x = clamp(crop.x + dx, 0, rect.width - crop.width)
    crop.y = clamp(crop.y + dy, 0, rect.height - crop.height)
    crop.startX = x
    crop.startY = y
    return
  }

  if (crop.resizing) {
    resizeCrop(x, y, rect, crop)
    return
  }

  if (crop.drawing) {
    crop.x = Math.min(crop.startX, x)
    crop.y = Math.min(crop.startY, y)
    crop.width = Math.abs(x - crop.startX)
    crop.height = Math.abs(y - crop.startY)
  }
}

// 鼠标抬起
const onMouseUp = () => {
  if (!currentImage.value) return
  currentImage.value.crop.drawing = false
  currentImage.value.crop.dragging = false
  currentImage.value.crop.resizing = false
}

// 缩放逻辑
const resizeCrop = (x, y, rect, crop) => {
  let { originX, originY, originW, originH } = crop

  if (crop.resizeDir.includes('r')) {
    crop.width = clamp(x - originX, 10, rect.width - originX)
  }
  if (crop.resizeDir.includes('l')) {
    const newX = clamp(x, 0, originX + originW - 10)
    crop.width = originX + originW - newX
    crop.x = newX
  }
  if (crop.resizeDir.includes('b')) {
    crop.height = clamp(y - originY, 10, rect.height - originY)
  }
  if (crop.resizeDir.includes('t')) {
    const newY = clamp(y, 0, originY + originH - 10)
    crop.height = originY + originH - newY
    crop.y = newY
  }
}

// 边界限制
const clamp = (val, min, max) => {
  return Math.max(min, Math.min(max, val))
}

// 清除框选
const clearCrop = () => {
  if (currentImage.value) {
    currentImage.value.crop.visible = false
  }
}

// 加载模型列表
const loadModels = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/models`)
    const data = await res.json()
    if (data.success) {
      const availableModels = data.models
        .filter((m) => m.enabled && m.checkpoint_exists)
        .map((m) => ({
          value: m.value,
          label: m.label,
          badge: m.badge,
        }))

      modelOptions.value = availableModels

      if (
        availableModels.length > 0 &&
        !availableModels.find((m) => m.value === selectedModel.value)
      ) {
        selectedModel.value = availableModels[0].value
      }
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

onMounted(() => {
  if (!hasBeenMounted.value) {
    hasBeenMounted.value = true
    loadModels()
  }
  window.addEventListener('mouseup', onMouseUp)
})

import { onUnmounted } from 'vue'

onUnmounted(() => {
  window.removeEventListener('mouseup', onMouseUp)
})

const openFeedbackDialog = () => {
  const results = batchResults.length > 0 ? batchResults : (currentImage.value?.results || [])
  feedbackData.value = {
    plant_name: results[0]?.name_cn || '',
    model_name: selectedModel.value
  }
  feedbackDialogVisible.value = true
}

// 批量识别
const handleBatchIdentify = async () => {
  if (images.value.length < 2) {
    ElMessage.warning('批量识别需要至少2张图片')
    return
  }

  batchLoading.value = true
  batchResults.value = []
  loading.value = true

  // 清空所有图片的之前结果
  images.value.forEach(img => {
    img.results = []
    img.flowerImage = ''
  })

  try {
    // 将所有图片转为 base64
    const imagesBase64 = await Promise.all(
      images.value.map(img => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1] || ''
            resolve(base64)
          }
          reader.readAsDataURL(img.file)
        })
      })
    )

    const response = await fetch(`${API_BASE_URL}/api/classify/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        images: imagesBase64,
        top_k: 5,
        model: selectedModel.value
      }),
    })

    const data = await response.json()

    if (data.success && data.results) {
      // 更新每张图片的结果
      data.all_image_results.forEach((imgResult, idx) => {
        if (images.value[idx] && imgResult.top_results) {
          images.value[idx].results = imgResult.top_results
        }
      })
      batchResults.value = data.results
      // 获取百科图片
      if (batchResults.value[0]) {
        await fetchFlowerImageForBatch(batchResults.value[0])
      }
      ElMessage.success(`批量识别完成，已识别 ${data.image_count} 张图片（已保存为一条历史记录）`)
    } else {
      ElMessage.error(data.error || '批量识别失败')
    }
  } catch (error) {
    console.error('批量识别失败:', error)
    ElMessage.error('批量识别失败，请重试')
  } finally {
    batchLoading.value = false
    loading.value = false
  }
}

// 获取批量结果的花卉图片
const fetchFlowerImageForBatch = async (result) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/encyclopedia/search/by-name?name=${encodeURIComponent(result.name_cn)}`)
    const data = await res.json()
    if (data.success) {
      const flower = data.multiple ? data.data[0] : data.data
      result.flowerImage = flower.image_url || ''
    } else {
      const res2 = await fetch(`${API_BASE_URL}/api/encyclopedia/search/by-name?name=${encodeURIComponent(result.name_en)}`)
      const data2 = await res2.json()
      if (data2.success) {
        const flower = data2.multiple ? data2.data[0] : data2.data
        result.flowerImage = flower.image_url || ''
      }
    }
  } catch (e) {
    console.error('获取花卉图片失败:', e)
  }
}

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#909399'
}

// 发送识别请求
const handleIdentify = async () => {
  if (!currentImage.value) {
    ElMessage.warning('请先选择一张图片')
    return
  }

  loading.value = true
  currentImage.value.results = []

  try {
    const formData = new FormData()
    formData.append('image', currentImage.value.file)
    formData.append('top_k', 5)
    formData.append('model', selectedModel.value)

    if (currentImage.value.crop.visible && currentImage.value.crop.width > 0 && currentImage.value.crop.height > 0) {
      const container = cropContainerRef.value
      if (container) {
        const imgEl = container.querySelector('.el-image')
        const imgRect = imgEl.getBoundingClientRect()
        formData.append('crop_left', currentImage.value.crop.x)
        formData.append('crop_top', currentImage.value.crop.y)
        formData.append('crop_width', currentImage.value.crop.width)
        formData.append('crop_height', currentImage.value.crop.height)
        formData.append('image_width', Math.round(imgRect.width))
        formData.append('image_height', Math.round(imgRect.height))
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      currentImage.value.results = data.results
      if (data.results && data.results[0]) {
        await fetchFlowerImage(currentImage.value, data.results[0])
      }
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

// 获取花卉图片
const fetchFlowerImage = async (imageItem, result) => {
  imageItem.flowerImage = ''
  try {
    const res = await fetch(`${API_BASE_URL}/api/encyclopedia/search/by-name?name=${encodeURIComponent(result.name_cn)}`)
    const data = await res.json()
    if (data.success) {
      const flower = data.multiple ? data.data[0] : data.data
      imageItem.flowerImage = flower.image_url || ''
    } else {
      const res2 = await fetch(`${API_BASE_URL}/api/encyclopedia/search/by-name?name=${encodeURIComponent(result.name_en)}`)
      const data2 = await res2.json()
      if (data2.success) {
        const flower = data2.multiple ? data2.data[0] : data2.data
        imageItem.flowerImage = flower.image_url || ''
      }
    }
  } catch (e) {
    console.error('获取花卉图片失败:', e)
  }
}

// 跳转到百科详情
const goToEncyclopedia = async (result) => {
  if (!result) return
  try {
    const res = await fetch(`${API_BASE_URL}/api/encyclopedia/search/by-name?name=${encodeURIComponent(result.name_cn)}`)
    const data = await res.json()
    if (data.success) {
      if (data.multiple) {
        $router.push(`/encyclopedia?flower_id=${data.data[0].id}`)
      } else {
        $router.push(`/encyclopedia?flower_id=${data.data.id}`)
      }
    } else {
      const res2 = await fetch(`${API_BASE_URL}/api/encyclopedia/search/by-name?name=${encodeURIComponent(result.name_en)}`)
      const data2 = await res2.json()
      if (data2.success) {
        if (data2.multiple) {
          $router.push(`/encyclopedia?flower_id=${data2.data[0].id}`)
        } else {
          $router.push(`/encyclopedia?flower_id=${data2.data.id}`)
        }
      } else {
        ElMessage.warning('未找到该花卉的百科信息')
      }
    }
  } catch (e) {
    console.error('查找花卉失败:', e)
    ElMessage.error('跳转百科详情失败')
  }
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

.model-selector {
  margin-bottom: 16px;
}

.model-label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-badge {
  font-size: 12px;
  color: #909399;
}

/* 图片列表 */
.image-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.upload-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

/* 上传区域 */
.upload-box {
  border: 2px dashed #d0d6db;
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
  background: #fafafa;
}

.upload-box:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.upload-box-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-box-icon {
  font-size: 36px;
  color: #909399;
}

.upload-box-text {
  font-size: 14px;
  color: #606266;
}

.image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.image-item.active {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
}

.image-item.identified {
  border-color: #67c23a;
}

.image-thumb {
  width: 100%;
  height: 100%;
}

.image-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  overflow: hidden;
}

.image-badge .el-tag {
  font-size: 10px;
}

.image-confidence {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  padding: 1px 5px;
  border-radius: 4px;
}

.batch-info {
  margin-bottom: 12px;
}

.batch-info .el-tag {
  font-size: 13px;
  padding: 6px 12px;
}

.remove-icon {
  position: absolute;
  top: 2px;
  right: 2px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 2px;
  display: none;
}

.image-item:hover .remove-icon {
  display: block;
}

.add-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  border: 2px dashed #dcdfe6;
}

.add-new:hover {
  background: #eef2ff;
  border-color: #409eff;
  color: #409eff;
}

.add-new span {
  font-size: 12px;
  margin-top: 2px;
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

/* 框选功能样式 */
.image-preview-wrapper {
  margin-top: 16px;
}

.crop-container {
  position: relative;
  cursor: crosshair;
  width: 100%;
  height: 300px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.crop-box {
  position: absolute;
  border: 2px solid #409eff;
  z-index: 10;
  background: rgba(64, 158, 255, 0.15);
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

.crop-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.top-result {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
}

.top-result:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.result-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.flower-thumbnail {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  flex-shrink: 0;
  object-fit: cover;
}

.result-name {
  font-size: 28px;
  font-weight: bold;
  margin: 8px 0 4px 0;
  color: #fff;
}

.result-name-en {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.confidence-display {
  display: flex;
  align-items: baseline;
  margin: 12px 0 8px 0;
  gap: 3px;
}

.confidence-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.confidence-symbol {
  font-size: 16px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

.confidence-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 6px;
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
  transition: background 0.2s;
}

.result-item:hover {
  background: #eef2ff;
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
