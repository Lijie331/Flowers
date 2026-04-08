<template>
  <div class="level-container">
    <el-card v-loading="loading">
      <template #header>
        <span>成长体系</span>
      </template>
      
      <div class="current-level">
        <el-avatar :size="60" class="level-avatar">{{ currentLevel?.icon }}</el-avatar>
        <div class="level-info">
          <h3>{{ profile?.nickname || '花友' }}</h3>
          <div class="level-badge">
            <span>{{ currentLevel?.title || '新手花友' }}</span>
            <el-tag type="success">Lv.{{ profile?.level || 1 }}</el-tag>
          </div>
          <p>经验值: {{ profile?.experience || 0 }}</p>
        </div>
      </div>
      
      <el-divider>等级一览</el-divider>
      
      <div class="level-list">
        <div 
          v-for="level in levels" 
          :key="level.level" 
          class="level-item"
          :class="{ current: level.level === profile?.level, locked: level.level > profile?.level }"
        >
          <div class="level-icon">{{ level.icon }}</div>
          <div class="level-details">
            <span class="level-title">{{ level.title }}</span>
            <span class="level-exp">Lv.{{ level.level }} | {{ level.min_experience }}-{{ level.max_experience === 999999 ? '∞' : level.max_experience }} 经验</span>
          </div>
          <el-tag v-if="level.level === profile?.level" type="success">当前</el-tag>
        </div>
      </div>
      
      <el-divider>经验值获取方式</el-divider>
      
      <div class="exp-rules">
        <div class="rule-item">
          <span class="rule-icon">📝</span>
          <span class="rule-name">发布动态</span>
          <span class="rule-exp">+10 经验</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">💬</span>
          <span class="rule-name">评论</span>
          <span class="rule-exp">+2 经验</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">❤️</span>
          <span class="rule-name">点赞</span>
          <span class="rule-exp">+1 经验</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🔍</span>
          <span class="rule-name">识花</span>
          <span class="rule-exp">+3 经验</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🏠</span>
          <span class="rule-name">每日登录</span>
          <span class="rule-exp">+5 经验</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🔥</span>
          <span class="rule-name">连续登录7天</span>
          <span class="rule-exp">+10 经验</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://127.0.0.1:5000/api'
const loading = ref(false)
const profile = ref(null)
const levels = ref([])

const currentLevel = computed(() => {
  if (!profile.value || !levels.value.length) return null
  return levels.value.find(l => l.level === profile.value.level) || levels.value[0]
})

const fetchProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      profile.value = data.data.profile
    }
  } catch { ElMessage.error('获取失败') }
  finally { loading.value = false }
}

const fetchLevels = async () => {
  try {
    const res = await fetch(`${API_BASE}/user/levels`)
    const data = await res.json()
    if (data.success) {
      levels.value = data.data.levels || []
    }
  } catch {}
}

onMounted(() => {
  fetchProfile()
  fetchLevels()
})
</script>

<style scoped>
.level-container { padding: 20px; max-width: 800px; margin: 0 auto; }
.current-level { display: flex; gap: 20px; align-items: center; padding: 20px; background: linear-gradient(135deg, #67c23a22, #85ce6122); border-radius: 12px; margin-bottom: 20px; }
.level-avatar { background: #67c23a; font-size: 30px; }
.level-info h3 { margin: 0 0 10px; }
.level-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.level-list { max-height: 400px; overflow-y: auto; }
.level-item { display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 8px; margin-bottom: 8px; }
.level-item.current { background: #67c23a22; }
.level-item.locked { opacity: 0.5; }
.level-icon { width: 40px; height: 40px; background: #f5f5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.level-details { flex: 1; }
.level-title { display: block; font-weight: 600; }
.level-exp { font-size: 12px; color: #999; }
.exp-rules { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.rule-item { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9f9f9; border-radius: 8px; }
.rule-icon { font-size: 20px; }
.rule-name { flex: 1; }
.rule-exp { color: #67c23a; font-weight: 600; }
</style>
