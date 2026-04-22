<!-- 内容审核中心 -->
<template>
  <div class="audit-container">
    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">📋 内容审核</span>
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>
    </el-card>

    <el-tabs v-model="activeTab" class="audit-tabs">
      <el-tab-pane label="待审核" name="pending">
        <template #label>
          <span
            >待审核 <el-badge :value="pendingCount" :hidden="pendingCount === 0" type="warning"
          /></span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已拒绝" name="rejected" />
      <el-tab-pane label="AI自动通过" name="auto_pass" />
    </el-tabs>

    <div v-loading="loading" class="audit-content">
      <el-empty v-if="!loading && posts.length === 0" description="暂无待审核内容" />

      <el-card v-for="post in posts" :key="post.id" class="post-card">
        <div class="post-header">
          <el-avatar :src="post.user_avatar" :size="40">
            {{ post.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-info">
            <span class="username">{{ post.username }}</span>
            <span class="time">{{ formatTime(post.created_at) }}</span>
          </div>
          <el-tag :type="getStatusType(post.status)" size="small">
            {{ getStatusText(post.status) }}
          </el-tag>
        </div>

        <div class="post-content" v-html="post.content"></div>

        <div class="post-images" v-if="post.images && post.images.length">
          <el-image
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="getFullImageUrl(img)"
            fit="cover"
            class="post-image"
            :preview-src-list="post.images.map(getFullImageUrl)"
          />
        </div>

        <div class="post-video" v-if="post.video_url">
          <video :src="getFullImageUrl(post.video_url)" controls class="video-player"></video>
        </div>

        <div class="post-meta" v-if="post.flower_name || (post.topics && post.topics.length)">
          <el-tag v-if="post.flower_name" type="success" size="small"
            >#{{ post.flower_name }}</el-tag
          >
          <el-tag v-for="topic in post.topics" :key="topic" type="warning" size="small"
            >#{{ topic }}</el-tag
          >
        </div>

        <!-- 审核详情 -->
        <div class="audit-info" v-if="post.audit_info">
          <el-divider />
          <div class="audit-info-row">
            <span class="audit-info-label">风险等级：</span>
            <el-tag :type="getRiskLevelType(post.audit_info.risk_level)" size="small">
              {{ post.audit_info.risk_level || '未知' }}
            </el-tag>
            <span class="audit-info-label" v-if="post.audit_info.risk_level">（</span>
            <span class="audit-info-desc">{{ getRiskLevelDesc(post.audit_info.risk_level) }}</span>
            <span class="audit-info-label" v-if="post.audit_info.risk_level">）</span>
          </div>
          <div class="audit-info-row" v-if="getDisplayLabels(post.audit_info).length">
            <span class="audit-info-label">违规标签：</span>
            <el-tag v-for="label in getDisplayLabels(post.audit_info)" :key="label" type="danger" size="small" style="margin-right: 4px">
              {{ label }}
            </el-tag>
          </div>
          <div class="audit-info-row" v-if="post.audit_info.reason">
            <span class="audit-info-label">违规原因：</span>
            <span class="audit-info-text">{{ post.audit_info.reason }}</span>
          </div>
        </div>

        <div class="audit-actions" v-if="activeTab === 'pending'">
          <el-button type="primary" @click="approvePost(post)">
            <el-icon><Check /></el-icon>
            通过
          </el-button>
          <el-button type="danger" @click="showRejectDialog(post)">
            <el-icon><Close /></el-icon>
            拒绝
          </el-button>
          <el-button @click="viewUserProfile(post.user_id)"> 查看用户 </el-button>
        </div>
      </el-card>

      <div v-if="posts.length > 0" class="load-more">
        <el-button v-if="hasMore" @click="loadMore" :loading="loadingMore">加载更多</el-button>
        <span v-else class="no-more">没有更多了</span>
      </div>
    </div>

    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="400px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="请输入拒绝原因（可选）"
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Close } from '@element-plus/icons-vue'

const router = useRouter()
const API_BASE = 'http://127.0.0.1:5000/api'
const IMAGE_BASE = 'http://127.0.0.1:5000'

const loading = ref(false)
const loadingMore = ref(false)
const posts = ref([])
const activeTab = ref('pending')
const pendingCount = ref(0)
const currentPage = ref(1)
const hasMore = ref(true)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const currentRejectPost = ref(null)

const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return IMAGE_BASE + url
}

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

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
  return texts[status] || status
}

const getRiskLevelType = (level) => {
  const types = { P0: 'danger', P1: 'warning', P2: 'info' }
  return types[level] || 'info'
}

const getRiskLevelDesc = (level) => {
  const descs = { P0: '必拦', P1: '建议拦', P2: '可放行' }
  return descs[level] || ''
}

const getDisplayLabels = (auditInfo) => {
  if (!auditInfo) return []
  return auditInfo.labels_display || auditInfo.labels || []
}

const fetchPosts = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('请先登录')
    router.push('/login')
    return
  }

  loading.value = true
  currentPage.value = 1
  try {
    let url
    if (activeTab.value === 'pending') {
      url = `${API_BASE}/community/audit/list?status=pending&page=1&page_size=10`
    } else {
      url = `${API_BASE}/community/audit/processed?admin_status=${activeTab.value}&page=1&page_size=10`
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()

    if (data.success) {
      posts.value = data.data.posts || []
      hasMore.value = data.data.page < data.data.total_pages

      if (activeTab.value === 'pending') {
        pendingCount.value = data.data.total
      }
    } else if (data.error?.includes('管理员')) {
      ElMessage.error('需要管理员权限')
      router.push('/')
    } else {
      ElMessage.error(data.error || '获取失败')
    }
  } catch (error) {
    ElMessage.error('获取审核列表失败')
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value) return

  loadingMore.value = true
  currentPage.value += 1
  try {
    const token = localStorage.getItem('token')
    let url
    if (activeTab.value === 'pending') {
      url = `${API_BASE}/community/audit/list?status=pending&page=${currentPage.value}&page_size=10`
    } else {
      url = `${API_BASE}/community/audit/processed?admin_status=${activeTab.value}&page=${currentPage.value}&page_size=10`
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()

    if (data.success) {
      posts.value = [...posts.value, ...(data.data.posts || [])]
      hasMore.value = data.data.page < data.data.total_pages
    }
  } catch (error) {
    ElMessage.error('加载更多失败')
  } finally {
    loadingMore.value = false
  }
}

const approvePost = async (post) => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch(`${API_BASE}/community/audit/${post.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已通过审核')
      posts.value = posts.value.filter((p) => p.id !== post.id)
      pendingCount.value = Math.max(0, pendingCount.value - 1)
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const showRejectDialog = (post) => {
  currentRejectPost.value = post
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch(
      `${API_BASE}/community/audit/${currentRejectPost.value.id}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.value }),
      },
    )
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已拒绝')
      rejectDialogVisible.value = false
      posts.value = posts.value.filter((p) => p.id !== currentRejectPost.value.id)
      pendingCount.value = Math.max(0, pendingCount.value - 1)
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const viewUserProfile = (userId) => {
  router.push(`/profile/${userId}`)
}

onMounted(() => {
  fetchPosts()
})

watch(activeTab, () => {
  fetchPosts()
})
</script>

<style scoped>
.audit-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
  background: #f5f7fa;
}

.header-card {
  margin-bottom: 16px;
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

.audit-tabs {
  margin-bottom: 16px;
  background: white;
  padding: 16px;
  border-radius: 8px;
}

.audit-content {
  min-height: 400px;
}

.post-card {
  margin-bottom: 16px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.post-content {
  font-size: 15px;
  line-height: 1.7;
  color: #303133;
  margin-bottom: 12px;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.post-image {
  width: 100%;
  height: 120px;
  border-radius: 4px;
  cursor: pointer;
}

.post-video {
  margin-bottom: 12px;
}

.video-player {
  width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.audit-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.audit-info {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.audit-info-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.audit-info-row:last-child {
  margin-bottom: 0;
}

.audit-info-label {
  font-size: 13px;
  color: #606266;
}

.audit-info-desc {
  font-size: 13px;
  color: #909399;
}

.audit-info-text {
  font-size: 13px;
  color: #f56c6c;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.no-more {
  color: #909399;
}
</style>
