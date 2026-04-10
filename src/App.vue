<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import AuthDialog from './components/auth/AuthDialog.vue'

const route = useRoute()
const router = useRouter()
const activePath = computed(() => route.path)
const API_BASE = 'http://127.0.0.1:5000/api'
const IMAGE_BASE = 'http://127.0.0.1:5000'

// 用户状态
const isLoggedIn = ref(false)
const userInfo = ref(null)
const showAuthDialog = ref(false)

// 通知状态
const showNotificationPanel = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (token && user) {
    isLoggedIn.value = true
    userInfo.value = JSON.parse(user)
    // 确保头像URL完整
    if (userInfo.value?.avatar_url) {
      userInfo.value.avatar_url = getFullAvatarUrl(userInfo.value.avatar_url)
    }
    fetchNotifications()
  } else {
    isLoggedIn.value = false
    userInfo.value = null
  }
}

// 头像URL处理函数
const getFullAvatarUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return IMAGE_BASE + url
}

// 监听 localStorage 变化（用于跨组件同步用户信息）
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'user' && e.newValue) {
      try {
        const newUserInfo = JSON.parse(e.newValue)
        userInfo.value = newUserInfo
        // 确保头像URL完整
        if (newUserInfo?.avatar_url) {
          userInfo.value.avatar_url = getFullAvatarUrl(newUserInfo.avatar_url)
        }
      } catch {}
    }
  })
}

// 监听路由变化，重新检查登录状态
watch(
  () => route.path,
  () => {
    checkLoginStatus()
  },
)

// 获取通知列表
const fetchNotifications = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    // 获取养护提醒通知
    const response1 = await fetch(`${API_BASE}/community/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // 获取用户互动通知
    const response2 = await fetch(`${API_BASE}/user/notifications?page_size=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    let allNotifications = []
    let careCount = 0
    let interactCount = 0

    if (response1.ok) {
      const data1 = await response1.json()
      if (data1.success) {
        const careNotifications = (data1.data.notifications || []).map((n) => ({
          ...n,
          notification_type: 'care_' + (n.notification_type || 'reminder'),
          title: n.title || '🌱 养护提醒',
          content: n.content || '',
          is_care: true,
        }))
        allNotifications = [...allNotifications, ...careNotifications]
        careCount = data1.data.unread_count || 0
      }
    }

    if (response2.ok) {
      const data2 = await response2.json()
      if (data2.success) {
        const typeMap = {
          like: '❤️ 赞了你',
          comment: '💬 评论了你',
          follow: '➕ 关注了你',
          mention: '@ 提到了你',
        }
        const interactNotifications = (data2.data.notifications || []).map((n) => ({
          ...n,
          title: typeMap[n.notification_type] || '📬 新通知',
          content: n.target_content || '',
          is_care: false,
        }))
        allNotifications = [...allNotifications, ...interactNotifications]
        interactCount = data2.data.unread_count || 0
      }
    }

    // 按时间排序
    allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    notifications.value = allNotifications.slice(0, 20)
    unreadCount.value = careCount + interactCount
  } catch (error) {
    console.error('获取通知失败', error)
  }
}

// 标记通知为已读
const markAsRead = async (notification) => {
  if (notification.is_read) return

  const token = localStorage.getItem('token')
  try {
    // 根据通知类型调用不同API
    if (notification.is_care) {
      await fetch(`${API_BASE}/community/notifications/${notification.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
    } else {
      await fetch(`${API_BASE}/user/notifications/${notification.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    notification.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {}
}

// 标记全部已读
const markAllRead = async () => {
  const token = localStorage.getItem('token')
  try {
    // 标记养护通知已读
    await fetch(`${API_BASE}/community/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    // 标记用户通知已读
    await fetch(`${API_BASE}/user/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    notifications.value.forEach((n) => (n.is_read = true))
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch {}
}

// 删除通知
const dismissNotification = async (notification) => {
  const token = localStorage.getItem('token')
  try {
    if (notification.is_care) {
      await fetch(`${API_BASE}/community/notifications/${notification.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } else {
      await fetch(`${API_BASE}/user/notifications/${notification.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    if (!notification.is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    notifications.value = notifications.value.filter((n) => n.id !== notification.id)
  } catch {}
}

// 监听登录成功
const handleLoginSuccess = async (user) => {
  isLoggedIn.value = true
  userInfo.value = user
  // 获取完整用户信息（包括等级）
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        userInfo.value = data.data
        localStorage.setItem('user', JSON.stringify(data.data))
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }
  fetchNotifications()
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    isLoggedIn.value = false
    userInfo.value = null
    notifications.value = []
    unreadCount.value = 0
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

// 打开登录对话框
const openLogin = () => {
  showAuthDialog.value = true
}

// 路由跳转函数
const goToFavorites = () => {
  router.push('/favorites')
}

const goToNotifications = () => {
  router.push('/notifications')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToGarden = () => {
  router.push('/garden')
}

const goToCare = () => {
  router.push('/care')
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<template>
  <el-container class="layout">
    <el-header class="layout-header">
      <div class="title-wrap">
        <span class="title">花卉平台</span>
      </div>

      <el-menu
        mode="horizontal"
        :default-active="activePath"
        router
        class="top-menu"
        :ellipsis="false"
      >
        <el-menu-item index="/">主页</el-menu-item>
        <el-menu-item index="/encyclopedia">百科</el-menu-item>
        <el-menu-item index="/gallery">图库</el-menu-item>
        <el-menu-item index="/identify">识别</el-menu-item>
        <el-menu-item index="/community">社区</el-menu-item>
        <el-menu-item index="/care">植物养护</el-menu-item>

        <!-- 用户区域 -->
        <el-menu-item class="user-area">
          <!-- 通知按钮 -->
          <el-popover
            v-if="isLoggedIn"
            placement="bottom-end"
            :width="360"
            trigger="click"
            v-model:visible="showNotificationPanel"
          >
            <template #reference>
              <el-badge
                :value="unreadCount"
                :hidden="unreadCount === 0"
                :max="99"
                class="notification-badge"
              >
                <el-icon size="22"><Bell /></el-icon>
              </el-badge>
            </template>
            <div class="notification-panel">
              <div class="notification-header">
                <span class="notification-title">消息通知</span>
                <el-button type="text" size="small" @click="markAllRead" v-if="unreadCount > 0"
                  >全部已读</el-button
                >
              </div>
              <div class="notification-list" v-if="notifications.length > 0">
                <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="notification-item"
                  :class="{ unread: !item.is_read }"
                  @click="markAsRead(item)"
                >
                  <div class="notification-icon">
                    <el-icon v-if="item.notification_type === 'water'" color="#409eff"
                      ><Watermelon
                    /></el-icon>
                    <el-icon v-else-if="item.notification_type === 'fertilize'" color="#67c23a"
                      ><Sugar
                    /></el-icon>
                    <el-icon v-else color="#e6a23c"><Bell /></el-icon>
                  </div>
                  <div class="notification-content">
                    <div class="notification-text">{{ item.title }}</div>
                    <div class="notification-desc" v-if="item.nickname">
                      {{ item.nickname }} - {{ item.content }}
                    </div>
                    <div class="notification-desc" v-else>{{ item.content }}</div>
                    <div class="notification-time">{{ formatTime(item.created_at) }}</div>
                  </div>
                  <el-button
                    type="text"
                    size="small"
                    class="dismiss-btn"
                    @click.stop="dismissNotification(item)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-empty v-else description="暂无通知" :image-size="60" />
            </div>
          </el-popover>

          <!-- 用户下拉菜单 -->
          <el-dropdown v-if="isLoggedIn" trigger="click">
            <span class="user-info">
              <el-avatar
                :size="32"
                :src="userInfo?.avatar_url ? getFullAvatarUrl(userInfo.avatar_url) : undefined"
              >
                {{ (userInfo?.nickname || userInfo?.username)?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
              <span class="username">{{ userInfo?.nickname || userInfo?.username }}</span>
              <span v-if="userInfo?.level_info" class="level-badge">{{
                userInfo.level_info.icon
              }}</span>
              <el-icon><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToNotifications">
                  🔔 我的通知
                  <el-badge
                    :value="unreadCount"
                    :hidden="unreadCount === 0"
                    style="margin-left: 8px"
                  />
                </el-dropdown-item>
                <el-dropdown-item @click="goToProfile">👤 个人中心</el-dropdown-item>
                <el-dropdown-item @click="goToGarden">🌸 我的花园</el-dropdown-item>
                <el-dropdown-item @click="goToFavorites">❤️ 我的收藏</el-dropdown-item>
                <el-dropdown-item @click="goToCare">🌱 养护计划</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 未登录 -->
          <el-button v-else type="primary" @click="openLogin"> 登录 / 注册 </el-button>
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main class="layout-main">
      <router-view />
    </el-main>

    <!-- 登录注册对话框 -->
    <AuthDialog v-model="showAuthDialog" @success="handleLoginSuccess" />
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6faf4 0%, #eef6ea 100%);
}

.layout-header {
  height: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #dfe8da;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
}

.top-menu {
  height: 56px;
  border-bottom: none;
  min-width: 0;
}

.top-menu:deep(.el-menu--horizontal) {
  border-bottom: none;
  justify-content: flex-end;
}

.top-menu:deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  padding: 0 14px;
  border-bottom: 2px solid transparent;
  background: transparent;
}

.top-menu:deep(.el-menu-item.is-active) {
  color: #409eff;
  background: transparent;
  border-bottom-color: #409eff;
}

.layout-main {
  width: min(1400px, 100%);
  margin: 0 auto;
  padding: 20px;
}

/* 用户区域 */
.user-area {
  border: none !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-info .username {
  font-size: 14px;
  color: #606266;
}

.user-info:hover .username {
  color: #409eff;
}

.level-badge {
  font-size: 14px;
  margin-left: 2px;
}

/* 通知样式 */
.notification-badge {
  margin-right: 15px;
  cursor: pointer;
}

.notification-panel {
  max-height: 400px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.notification-title {
  font-weight: 600;
  color: #303133;
}

.notification-list {
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 10px;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #ecf5ff;
}

.notification-item.unread:hover {
  background: #e6effe;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.notification-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.dismiss-btn {
  padding: 4px;
  color: #c0c4cc;
}

.dismiss-btn:hover {
  color: #909399;
}
</style>
