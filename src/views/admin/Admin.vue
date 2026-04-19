<template>
  <div class="admin-container">
    <h1>管理后台</h1>

    <!-- 用户管理 -->
    <div class="section">
      <h2>用户管理</h2>
      <el-button type="primary" @click="loadUsers">刷新用户列表</el-button>

      <el-table :data="users" border style="width: 100%; margin-top: 15px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="is_active" label="账号状态">
          <template #default="{ row }">
            <el-tag :type="row.is_active === 0 || row.is_active === '0' ? 'danger' : 'success'">
              {{ row.is_active === 0 || row.is_active === '0' ? '已禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button
              v-if="row.id !== currentUserId"
              :type="row.is_active === 0 || row.is_active === '0' ? 'success' : 'warning'"
              size="small"
              @click="toggleStatus(row)"
              :loading="loadingId === row.id"
            >
              {{ row.is_active === 0 || row.is_active === '0' ? '恢复账号' : '禁用账号' }}
            </el-button>
            <el-tag v-else type="info">当前账号</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 识别记录 -->
    <div class="section">
      <h2>识别记录</h2>

      <div style="margin-bottom: 15px">
        <el-select
          v-model="selectedUserId"
          placeholder="查看所有用户"
          clearable
          @change="loadHistory"
          style="width: 200px"
        >
          <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
        </el-select>
        <el-button @click="loadHistory" style="margin-left: 10px">刷新</el-button>
      </div>

      <el-table :data="history" border style="width: 100%">
        <el-table-column prop="index" label="序号" width="70" />
        <el-table-column prop="user_id" label="用户ID" width="120" />
        <el-table-column prop="predicted_class_name" label="花卉" />
        <el-table-column prop="confidence" label="置信度" width="100" />
        <el-table-column prop="model_name" label="模型" width="120" />
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        layout="prev, pager, next"
        :total="historyTotal"
        :page-size="pageSize"
        :current-page="page"
        @current-change="changePage"
        style="margin-top: 20px; text-align: center"
      />
    </div>

    <!-- 模型管理 -->
    <div class="section">
      <h2>模型管理</h2>

      <el-card>
        <!-- <p>当前使用模型：<el-tag type="success">{{ currentModel }}</el-tag></p> -->
        <el-divider />

        <el-table :data="models" border style="width: 100%">
          <el-table-column prop="name" label="模型名称" />
          <el-table-column prop="badge" label="类型" />
          <el-table-column prop="id" label="模型ID" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'danger'">
                {{ row.enabled ? '已启用' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button
                :type="row.enabled ? 'warning' : 'success'"
                size="small"
                @click="toggleModel(row)"
                :loading="loadingModel === row.id"
              >
                {{ row.enabled ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 数据统计（暂时隐藏echarts） -->
    <div class="section">
      <h2>数据统计</h2>
      <el-card>
        <p>统计功能开发中...</p>
        <p>API返回的数据格式需要进一步确认</p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://127.0.0.1:5000/api'

// 用户
const users = ref([])
const loadingId = ref(null)

// 当前登录用户ID
const currentUserId = ref(null)

// 历史记录
const history = ref([])
const page = ref(1)
const pageSize = ref(10)
const historyTotal = ref(0)
const selectedUserId = ref('')

// 模型
const models = ref([
  { id: 'clip_rn50', name: 'ResNet50', badge: '快速', enabled: true },
  { id: 'clip_rn101', name: 'ResNet101', badge: '平衡', enabled: true },
  { id: 'clip_vit_b16', name: 'ViT-B/16', badge: '高精度(速度较慢)', enabled: true },
  { id: 'clip_vit_l14', name: 'ViT-L/14', badge: '最高精度(速度慢)', enabled: true },
])
const currentModel = ref('clip_rn50')
const selectedModel = ref('')
const loadingModel = ref(null)

// 获取token
const getToken = () => localStorage.getItem('token')

// 加载用户
const loadUsers = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await res.json()
    console.log('用户数据:', data)
    if (data.success) {
      users.value = data.users
      // 保存当前登录用户ID
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
      currentUserId.value = userInfo.id
    } else {
      ElMessage.error(data.error || '获取用户失败')
    }
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error('加载用户失败')
  }
}

const toggleStatus = async (user) => {
  if (loadingId.value) return
  if (user.id === currentUserId.value) {
    ElMessage.warning('不能操作自己的账号')
    return
  }
  loadingId.value = user.id
  try {
    // 切换状态：如果是正常(1)就禁用(0)，如果是禁用(0)就恢复(1)
    const newStatus = user.is_active === 1 || user.is_active === '1' ? 0 : 1
    const res = await fetch(`${API_BASE}/admin/user/status/${user.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ is_active: newStatus }),
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success(newStatus === 0 ? '账号已禁用' : '账号已恢复')
      loadUsers()
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    loadingId.value = null
  }
}

const deleteUser = async (user) => {
  try {
    const res = await fetch(`${API_BASE}/admin/user/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('删除成功')
      loadUsers()
    } else {
      ElMessage.error(data.error || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 历史记录
const loadHistory = async () => {
  try {
    let url = `${API_BASE}/admin/history?page=${page.value}&page_size=${pageSize.value}`
    if (selectedUserId.value) {
      url += `&user_id=${selectedUserId.value}`
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await res.json()
    console.log('历史记录数据:', data)
    if (data.success) {
      history.value = data.history.map((item, index) => ({
        ...item,
        index: (page.value - 1) * pageSize.value + index + 1,
      }))
      historyTotal.value = data.total
    } else {
      ElMessage.error(data.error || '获取历史记录失败')
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
  }
}

const changePage = (p) => {
  page.value = p
  loadHistory()
}

const deleteRecord = async (row) => {
  try {
    const res = await fetch(`${API_BASE}/admin/history/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('删除成功')
      loadHistory()
    } else {
      ElMessage.error(data.error || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 模型管理
const loadModels = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/models`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await res.json()
    console.log('模型数据:', data)
    if (data.success) {
      models.value = data.models
    }
  } catch (error) {
    console.error('加载模型失败:', error)
  }
}

const toggleModel = async (model) => {
  if (loadingModel.value) return
  loadingModel.value = model.id
  try {
    const res = await fetch(`${API_BASE}/admin/model/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ model_id: model.id, enabled: !model.enabled }),
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success(model.enabled ? '模型已禁用' : '模型已启用')
      loadModels()
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    loadingModel.value = null
  }
}

// 初始化
onMounted(() => {
  loadUsers()
  loadHistory()
  loadModels()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}

.section {
  margin-bottom: 40px;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}
</style>
