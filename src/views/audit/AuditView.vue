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
      <el-tab-pane name="manual">
        <template #label>
          <span>人工审核 <el-badge :value="pendingCount" :hidden="pendingCount === 0" type="warning" /></span>
        </template>
        <div class="sub-filter" v-if="activeTab === 'manual'">
          <el-radio-group v-model="manualStatus" @change="fetchPosts">
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="approved">已通过</el-radio-button>
            <el-radio-button label="rejected">已拒绝</el-radio-button>
          </el-radio-group>
        </div>
      </el-tab-pane>
      <el-tab-pane label="AI自动通过" name="auto_pass">
        <div class="sub-filter" v-if="activeTab === 'auto_pass'">
          <el-radio-group v-model="autoPassStatus" @change="fetchPosts">
            <el-radio-button label="auto_pass">AI自动通过</el-radio-button>
            <el-radio-button label="rejected">已拒绝</el-radio-button>
          </el-radio-group>
        </div>
      </el-tab-pane>
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

        <div class="audit-actions" v-if="activeTab === 'manual' && manualStatus === 'pending'">
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

        <div class="audit-actions" v-if="activeTab === 'manual' && manualStatus !== 'pending'">
          <el-button type="primary" @click="allowPost(post)">
            <el-icon><Check /></el-icon>
            允许
          </el-button>
          <el-button type="danger" @click="blockPost(post)">
            <el-icon><Close /></el-icon>
            禁止
          </el-button>
          <el-button @click="viewUserProfile(post.user_id)"> 查看用户 </el-button>
        </div>

        <div class="audit-actions" v-if="activeTab === 'auto_pass' && autoPassStatus === 'rejected'">
          <el-button type="primary" @click="restorePost(post)">
            <el-icon><Check /></el-icon>
            恢复
          </el-button>
          <el-button @click="viewUserProfile(post.user_id)"> 查看用户 </el-button>
        </div>

        <div class="audit-actions" v-if="activeTab === 'auto_pass' && autoPassStatus === 'auto_pass'">
          <el-button type="danger" @click="blockPost(post)">
            <el-icon><Close /></el-icon>
            禁止
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
const activeTab = ref('manual')
const manualStatus = ref('pending')
const autoPassStatus = ref('auto_pass')
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

// 标签中文映射
const LABEL_DISPLAY_MAP = {
  // 图片标签
  'Politics': '涉政内容',
  'pornographic': '涉黄内容',
  'sexualHint': '性暗示内容',
  'sexual': '性感内容',
  'profanity': '辱骂内容',
  'terror': '暴恐内容',
  'ad': '广告内容',
  'contraband': '违禁内容',
  'inappropriate': '不良内容',
  'religion': '民族宗教内容',
  // 文本标签
  'pornographic_adult': '色情成人内容',
  'sexual_suggestive': '疑似低俗内容',
  'political_figure': '疑似政治人物',
  'political_n': '疑似敏感政治内容',
  'political_p': '疑似涉政禁宣人物',
  'political_a': '涉政专项升级保障',
  'violent_extremist': '疑似极端组织',
  'violent_incidents': '疑似极端主义内容',
  'violent_weapons': '疑似武器弹药',
  'contraband_drug': '疑似毒品相关',
  'contraband_gambling': '疑似赌博相关',
  'contraband_act': '疑似违禁行为',
  'contraband_entity': '疑似违禁工具',
  'inappropriate_profanity': '疑似攻击辱骂内容',
  'nappropriate_oral': '疑似低俗口头语内容',
  'inappropriate_discrimination': '疑似偏见歧视内容',
  'inappropriate_ethics': '疑似不良价值观内容',
  'inappropriate_superstition': '疑似封建迷信内容',
  'inappropriate_nonsense': '疑似无意义灌水内容',
  'pt_to_sites': '疑似站外引流',
  'pt_by_recruitment': '疑似网赚兼职广告',
  'pt_to_contact': '疑似引流广告号',
  'religion_b': '疑似涉及佛教',
  'religion_t': '疑似涉及道教',
  'religion_c': '疑似涉及',
  'religion_i': '疑似涉及伊斯兰教基督教',
  'religion_h': '疑似涉及印度教',
  // 兼容旧标签
  'politics': '涉政敏感',
  'terror': '暴恐血腥',
  'extremism': '极端主义',
  'cult': '邪教封建迷信',
  'illegal_content': '违法内容',
  'inappropriate_profanity': '不当脏话',
  'political_figure': '政治敏感人物',
  'porn': '色情低俗',
  'vulgar': '低俗内容',
  'violence': '暴力内容',
  'advertising': '广告推广',
  'junk': '垃圾广告',
  'fraud': '欺诈诈骗',
  'hate_speech': '仇恨言论',
  'personal_attack': '人身攻击',
  'inappropriate': '调性异常',
  '钓鱼': '钓鱼诈骗',
  'minor_abuse': '未成年人违规',
  'soft_ad': '软色情广告',
  '诱导未成年人': '诱导未成年人',
}

const getDisplayLabels = (auditInfo) => {
  if (!auditInfo) return []
  // 优先使用 labels_display，否则动态转换 labels
  const rawLabels = auditInfo.labels_display || auditInfo.labels || []
  return rawLabels.map(label => LABEL_DISPLAY_MAP[label] || label)
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
    if (activeTab.value === 'manual') {
      if (manualStatus.value === 'pending') {
        url = `${API_BASE}/community/audit/list?status=pending&page=1&page_size=10`
      } else {
        url = `${API_BASE}/community/audit/processed?admin_status=${manualStatus.value}&page=1&page_size=10`
      }
    } else {
      url = `${API_BASE}/community/audit/processed?admin_status=${autoPassStatus.value}&page=1&page_size=10`
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()

    if (data.success) {
      posts.value = data.data.posts || []
      hasMore.value = data.data.page < data.data.total_pages

      if (activeTab.value === 'manual' && manualStatus.value === 'pending') {
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
    if (activeTab.value === 'manual') {
      if (manualStatus.value === 'pending') {
        url = `${API_BASE}/community/audit/list?status=pending&page=${currentPage.value}&page_size=10`
      } else {
        url = `${API_BASE}/community/audit/processed?admin_status=${manualStatus.value}&page=${currentPage.value}&page_size=10`
      }
    } else {
      url = `${API_BASE}/community/audit/processed?admin_status=${autoPassStatus.value}&page=${currentPage.value}&page_size=10`
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

const blockPost = async (post) => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch(`${API_BASE}/community/audit/${post.id}/block`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已禁止')
      // 更新本地帖子状态，不从列表移除
      post.status = 'rejected'
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const allowPost = async (post) => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch(`${API_BASE}/community/audit/${post.id}/allow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已允许')
      post.status = 'approved'
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const restorePost = async (post) => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch(`${API_BASE}/community/audit/${post.id}/allow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已恢复')
      posts.value = posts.value.filter((p) => p.id !== post.id)
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchPosts()
})

watch(activeTab, () => {
  fetchPosts()
})

watch(manualStatus, () => {
  fetchPosts()
})

watch(autoPassStatus, () => {
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

.sub-filter {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
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
