<template>
  <div class="notifications-container">
    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">🔔 我的通知</span>
          <el-button v-if="unreadCount > 0" type="primary" size="small" @click="markAllRead">
            全部已读
          </el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="未读" name="unread">
          <template #label>
            <span>未读 <el-badge :value="unreadCount" :hidden="unreadCount === 0" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <div v-loading="loading" class="notifications-list">
      <el-empty v-if="!loading && notifications.length === 0" description="暂无通知" />

      <el-card v-for="notification in notifications" :key="notification.id" 
        class="notification-card" :class="{ unread: !notification.is_read }"
        @click="handleNotificationClick(notification)">
        <div class="notification-item">
          <el-avatar :src="notification.actor_avatar" :size="48" class="actor-avatar">
            {{ notification.actor_name?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          
          <div class="notification-content">
            <div class="notification-text">
              <span class="actor-name">{{ notification.actor_name }}</span>
              <span class="action-text">{{ notification.type_text }}</span>
            </div>
            <div class="notification-preview" v-if="notification.target_content">
              "{{ notification.target_content }}..."
            </div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          
          <div class="notification-actions">
            <el-tag v-if="notification.notification_type === 'like'" type="danger" size="small">❤️</el-tag>
            <el-tag v-else-if="notification.notification_type === 'comment'" type="success" size="small">💬</el-tag>
            <el-tag v-else-if="notification.notification_type === 'follow'" type="warning" size="small">➕</el-tag>
            
            <el-button v-if="!notification.is_read" type="primary" size="small" circle 
              @click.stop="markAsRead(notification)" title="标记已读">
              <el-icon><Check /></el-icon>
            </el-button>
            <el-button type="danger" size="small" circle @click.stop="deleteNotification(notification)" title="删除">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>

      <div v-if="notifications.length > 0 && hasMore" class="load-more">
        <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const API_BASE = 'http://127.0.0.1:5000/api/user'

const loading = ref(false)
const loadingMore = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const currentPage = ref(1)
const hasMore = ref(true)
const activeTab = ref('all')

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

const fetchNotifications = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/notifications?page=1&page_size=20`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      notifications.value = data.data.notifications || []
      unreadCount.value = data.data.unread_count || 0
      hasMore.value = data.data.notifications?.length >= 20
      currentPage.value = 1
    }
  } catch {
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

const fetchUnreadOnly = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/notifications?page=1&page_size=20&unread_only=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      notifications.value = data.data.notifications || []
      hasMore.value = data.data.notifications?.length >= 20
      currentPage.value = 1
    }
  } catch {
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  const token = localStorage.getItem('token')
  if (!token || !hasMore.value) return
  
  loadingMore.value = true
  try {
    const url = activeTab.value === 'unread' 
      ? `${API_BASE}/notifications?page=${currentPage.value + 1}&page_size=20&unread_only=true`
      : `${API_BASE}/notifications?page=${currentPage.value + 1}&page_size=20`
    
const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      notifications.value = [...notifications.value, ...(data.data.notifications || [])]
      hasMore.value = data.data.notifications?.length >= 20
      currentPage.value++
    }
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loadingMore.value = false
  }
}

const markAsRead = async (notification) => {
  const token = localStorage.getItem('token')
  if (!token) return
  
  try {
    const response = await fetch(`${API_BASE}/notifications/${notification.id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      notification.is_read = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const markAllRead = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  
  try {
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      notifications.value.forEach(n => n.is_read = 1)
      unreadCount.value = 0
      ElMessage.success('已全部标记为已读')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const deleteNotification = async (notification) => {
  const token = localStorage.getItem('token')
  if (!token) return
  
  try {
    const response = await fetch(`${API_BASE}/notifications/${notification.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      notifications.value = notifications.value.filter(n => n.id !== notification.id)
      if (!notification.is_read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      ElMessage.success('已删除')
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleNotificationClick = (notification) => {
  // 标记已读
  if (!notification.is_read) {
    markAsRead(notification)
  }
  
  // 跳转到相关页面
  if (notification.target_type === 'post' && notification.target_id) {
    router.push(`/community?highlight=${notification.target_id}`)
  } else if (notification.target_type === 'user' && notification.target_id) {
    router.push(`/profile/${notification.target_id}`)
  }
}

// 监听tab切换
const onTabChange = () => {
  if (activeTab.value === 'unread') {
    fetchUnreadOnly()
  } else {
    fetchNotifications()
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications-container {
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
  font-size: 18px;
  font-weight: 600;
}

.notifications-list {
  max-width: 700px;
  margin: 0 auto;
}

.notification-card {
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-card.unread {
  background: linear-gradient(135deg, #f0f9ff 0%, #ecf5ff 100%);
  border-left: 3px solid #409eff;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.actor-avatar {
  flex-shrink: 0;
  cursor: pointer;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 15px;
  line-height: 1.5;
}

.actor-name {
  font-weight: 600;
  color: #303133;
}

.action-text {
  color: #606266;
}

.notification-preview {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.load-more {
  text-align: center;
  padding: 20px;
}
</style>
