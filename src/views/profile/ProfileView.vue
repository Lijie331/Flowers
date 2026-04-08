<template>
  <div class="profile-container">
    <el-card v-loading="loading">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <!-- <el-avatar :size="80" :src="getFullUrl(profile?.avatar_url)" class="avatar">
            {{ profile?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar> -->
          <el-avatar
            :size="80"
            :src="profile?.avatar_url ? getFullUrl(profile.avatar_url) : undefined"
            class="avatar"
          >
            {{ profile?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
          <el-button class="avatar-upload-btn" size="small" circle @click="triggerAvatarUpload">
            <el-icon><Camera /></el-icon>
          </el-button>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleAvatarChange"
          />
        </div>
        <div class="info">
          <h2>{{ profile?.nickname || profile?.username || '未设置昵称' }}</h2>
          <div class="level-badge">
            <span>{{ profile?.title || '新手花友' }}</span>
            <el-tag size="small">Lv.{{ profile?.level || 1 }}</el-tag>
          </div>
          <p class="bio">{{ profile?.bio || '这个人很懒，什么都没写~' }}</p>
          <div class="stats">
            <span>粉丝: {{ profile?.followers_count || 0 }}</span>
            <span>关注: {{ profile?.following_count || 0 }}</span>
            <span>发帖: {{ profile?.posts_count || 0 }}</span>
          </div>
        </div>
        <div class="actions">
          <el-button type="primary" @click="showEditDialog = true">编辑资料</el-button>
          <el-button @click="$router.push('/settings/privacy')">隐私设置</el-button>
        </div>
      </div>
      <div class="exp-section">
        <span>经验值: {{ profile?.experience || 0 }}</span>
        <el-progress :percentage="expPercentage" :stroke-width="10" style="margin-top: 10px" />
      </div>
      <div class="feature-grid">
        <el-card shadow="hover" @click="$router.push('/garden')">
          <el-icon size="30" color="#67c23a"><Sunny /></el-icon>
          <span>我的花园</span>
        </el-card>
        <el-card shadow="hover" @click="$router.push('/favorites')">
          <el-icon size="30" color="#f56c6c"><Star /></el-icon>
          <span>我的收藏</span>
        </el-card>
        <el-card shadow="hover" @click="$router.push('/community')">
          <el-icon size="30" color="#409eff"><ChatDotRound /></el-icon>
          <span>我的动态</span>
        </el-card>
        <el-card shadow="hover" @click="showCertDialog = true">
          <el-icon size="30" color="#e6a23c"><Medal /></el-icon>
          <span>申请认证</span>
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="showEditDialog" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCertDialog" title="申请认证" width="500px">
      <el-form :model="certForm" label-width="100px">
        <el-form-item label="认证类型">
          <el-select v-model="certForm.cert_type" style="width: 100%">
            <el-option label="园艺师" value="horticulturist" />
            <el-option label="植物学家" value="botanist" />
          </el-select>
        </el-form-item>
        <el-form-item label="真实姓名" required>
          <el-input v-model="certForm.real_name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCertDialog = false">关闭</el-button>
        <el-button type="success" @click="submitCert">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Sunny, Star, ChatDotRound, Medal, Camera } from '@element-plus/icons-vue'

const route = useRoute()
const API_BASE = 'http://127.0.0.1:5000/api'
const IMAGE_BASE = 'http://127.0.0.1:5000'
const loading = ref(false)
const profile = ref(null)
const showEditDialog = ref(false)
const showCertDialog = ref(false)
const editForm = ref({ nickname: '', bio: '' })
const certForm = ref({ cert_type: 'horticulturist', real_name: '' })
const avatarInput = ref(null)
const avatarUploading = ref(false)

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return IMAGE_BASE + url
}

// 触发头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 处理头像选择
const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 检查文件大小 (最大2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过2MB')
    return
  }

  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  avatarUploading.value = true

  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const res = await fetch(`${API_BASE}/auth/avatar/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    const data = await res.json()

    if (data.success) {
      ElMessage.success('头像上传成功')
      // 刷新头像（使用完整URL）
      if (profile.value) {
        profile.value.avatar_url = getFullUrl(data.avatar_url)
      }
      // 更新本地存储
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      userData.avatar_url = getFullUrl(data.avatar_url)
      localStorage.setItem('user', JSON.stringify(userData))

      // 强制更新页面显示
      await fetchProfile()

      // 触发浏览器事件让其他组件感知变化
      window.dispatchEvent(new Event('storage'))

      // 延迟刷新页面，确保所有状态更新完成
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } else {
      ElMessage.error(data.message || '上传失败')
    }
  } catch (e) {
    console.error('上传失败:', e)
    ElMessage.error('上传失败，请重试')
  } finally {
    avatarUploading.value = false
    // 清空input
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const expPercentage = computed(() => {
  if (!profile.value) return 0
  const exp = profile.value.experience || 0
  const level = profile.value.level || 1
  // 根据等级计算进度
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 7000]
  const currentThreshold = levelThresholds[level - 1] || 0
  const nextThreshold = levelThresholds[level] || 10000
  const progress = ((exp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
})

const fetchProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      profile.value = data.data.profile
      editForm.value = { nickname: profile.value.nickname || '', bio: profile.value.bio || '' }
      // 更新 localStorage 中的用户信息
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      userData.nickname = profile.value.nickname
      userData.username = profile.value.username
      userData.level = profile.value.level
      userData.title = profile.value.title
      userData.avatar_url = getFullUrl(profile.value.avatar_url)
      localStorage.setItem('user', JSON.stringify(userData))
    }
  } catch {
    ElMessage.error('获取资料失败')
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm.value),
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('保存成功')
      showEditDialog.value = false
      await fetchProfile()
    } else {
      ElMessage.error(data.error || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

const submitCert = async () => {
  if (!certForm.value.real_name) {
    ElMessage.warning('请填写真实姓名')
    return
  }
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('cert_type', certForm.value.cert_type)
  formData.append('real_name', certForm.value.real_name)
  try {
    const res = await fetch(`${API_BASE}/user/certification`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('申请已提交')
      showCertDialog.value = false
    }
  } catch {
    ElMessage.error('提交失败')
  }
}

onMounted(() => {
  fetchProfile()
})

// 监听路由变化，刷新数据
watch(
  () => route.path,
  () => {
    if (route.path === '/profile') {
      fetchProfile()
    }
  },
)
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}
.profile-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.avatar-wrapper {
  position: relative;
}
.avatar {
  border: 3px solid #67c23a;
}
.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  opacity: 0;
  transition: opacity 0.3s;
}
.avatar-wrapper:hover .avatar-upload-btn {
  opacity: 1;
}
.avatar-wrapper:hover .avatar {
  border-color: #409eff;
}
.info {
  flex: 1;
}
.info h2 {
  margin: 0 0 10px;
}
.level-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.bio {
  color: #666;
  margin: 10px 0;
}
.stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #999;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exp-section {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}
.feature-grid .el-card {
  text-align: center;
  cursor: pointer;
}
.feature-grid span {
  display: block;
  margin-top: 8px;
  font-size: 14px;
}
</style>
