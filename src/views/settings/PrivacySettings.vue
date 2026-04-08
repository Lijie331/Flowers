<template>
  <div class="privacy-container">
    <el-card v-loading="loading">
      <template #header>
        <span>隐私设置</span>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="花园可见性">
          <el-select v-model="settings.garden_visibility" style="width: 300px">
            <el-option label="公开 - 所有人可见" value="public" />
            <el-option label="仅好友可见" value="friends" />
            <el-option label="仅自己可见" value="private" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <div class="save-btn">
        <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
      </div>
      
      <el-divider>黑名单管理</el-divider>
      
      <div v-loading="loadingBlacklist">
        <el-empty v-if="blacklist.length === 0" description="暂无黑名单" />
        <div v-else class="blacklist">
          <div v-for="user in blacklist" :key="user.user_id" class="blacklist-item">
            <el-avatar :size="40">{{ user.nickname?.charAt(0) }}</el-avatar>
            <span class="name">{{ user.nickname }}</span>
            <el-button type="danger" size="small" @click="removeBlock(user.user_id)">移出黑名单</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://127.0.0.1:5000/api'
const loading = ref(false)
const saving = ref(false)
const loadingBlacklist = ref(false)
const settings = ref({ garden_visibility: 'public' })
const blacklist = ref([])

const fetchProfile = async () => {
  const token = localStorage.getItem('token')
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      settings.value.garden_visibility = data.data.profile.garden_visibility || 'public'
    }
  } catch { ElMessage.error('获取设置失败') }
  finally { loading.value = false }
}

const fetchBlacklist = async () => {
  const token = localStorage.getItem('token')
  loadingBlacklist.value = true
  try {
    const res = await fetch(`${API_BASE}/user/blacklist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      blacklist.value = data.data.blacklist || []
    }
  } catch {}
  finally { loadingBlacklist.value = false }
}

const saveSettings = async () => {
  const token = localStorage.getItem('token')
  saving.value = true
  try {
    const res = await fetch(`${API_BASE}/user/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(settings.value)
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('设置已保存')
    }
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

const removeBlock = async (userId) => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/user/blacklist/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('已移出黑名单')
      fetchBlacklist()
    }
  } catch { ElMessage.error('操作失败') }
}

onMounted(() => {
  fetchProfile()
  fetchBlacklist()
})
</script>

<style scoped>
.privacy-container { padding: 20px; max-width: 700px; margin: 0 auto; }
.save-btn { margin: 20px 0; }
.blacklist-item { display: flex; align-items: center; gap: 15px; padding: 10px; border-bottom: 1px solid #eee; }
.blacklist-item .name { flex: 1; }
</style>
