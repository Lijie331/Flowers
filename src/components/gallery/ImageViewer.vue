<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close as CloseIcon, ArrowLeft as PrevIcon, ArrowRight as NextIcon } from '@element-plus/icons-vue'

const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  initialIndex: {
    type: Number,
    default: 0
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update:visible'])

const API_BASE_URL = 'http://127.0.0.1:5000'

const currentIndex = ref(props.initialIndex || 0)

const getFullImageUrl = (relativePath) => {
  if (!relativePath) return ''
  if (relativePath.startsWith('http')) return relativePath
  return API_BASE_URL + relativePath
}

const imageUrls = computed(() => props.images.map(img => getFullImageUrl(img.url)))

const currentImageUrl = computed(() => imageUrls.value[currentIndex.value] || '')

const totalImages = computed(() => props.images.length)

const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => currentIndex.value < totalImages.value - 1)

const showPrev = () => {
  if (canPrev.value) {
    currentIndex.value--
  }
}

const showNext = () => {
  if (canNext.value) {
    currentIndex.value++
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

const handleKeydown = (e) => {
  if (!props.visible) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    showPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    showNext()
  } else if (e.key === 'Escape') {
    handleClose()
  }
}

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    currentIndex.value = props.initialIndex || 0
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  }
})

watch(() => props.initialIndex, (newIndex) => {
  if (props.visible) {
    currentIndex.value = newIndex
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="viewer-fade">
      <div
        v-if="visible"
        class="image-viewer-overlay"
        @click="handleOverlayClick"
      >
        <div class="image-viewer-container">
          <!-- 关闭按钮 -->
          <button class="viewer-close" @click="handleClose">
            <el-icon :size="24"><CloseIcon /></el-icon>
          </button>

          <!-- 索引指示器 -->
          <div class="viewer-index">
            {{ currentIndex + 1 }} / {{ totalImages }}
          </div>

          <!-- 上一张按钮 -->
          <button
            class="viewer-nav viewer-prev"
            :disabled="!canPrev"
            @click="showPrev"
          >
            <el-icon :size="32"><PrevIcon /></el-icon>
          </button>

          <!-- 主图 -->
          <div class="viewer-image-wrapper">
            <el-image
              :src="currentImageUrl"
              fit="contain"
              class="viewer-image"
              referrerpolicy="no-referrer"
              :initial-index="currentIndex"
            >
              <template #error>
                <div class="image-load-error">
                  <el-icon :size="48"><CloseIcon /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>

          <!-- 下一张按钮 -->
          <button
            class="viewer-nav viewer-next"
            :disabled="!canNext"
            @click="showNext"
          >
            <el-icon :size="32"><NextIcon /></el-icon>
          </button>

          <!-- 图片信息 -->
          <div v-if="images[currentIndex]?.filename" class="viewer-filename">
            {{ images[currentIndex].filename }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.image-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.viewer-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.viewer-index {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 16px;
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  z-index: 10;
  user-select: none;
}

.viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 80px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.viewer-nav:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.2);
}

.viewer-nav:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.viewer-prev {
  left: 20px;
  border-radius: 0 12px 12px 0;
}

.viewer-next {
  right: 20px;
  border-radius: 12px 0 0 12px;
}

.viewer-image-wrapper {
  max-width: 90%;
  max-height: 85%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
}

.image-load-error {
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.viewer-filename {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 过渡动画 */
.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .viewer-nav {
    width: 44px;
    height: 60px;
  }

  .viewer-close {
    top: 12px;
    right: 12px;
  }

  .viewer-index {
    top: 12px;
    font-size: 14px;
    padding: 6px 14px;
  }
}
</style>
