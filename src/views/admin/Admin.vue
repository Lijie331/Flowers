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

    <!-- 用户反馈管理 -->
    <div class="section">
      <h2>用户反馈</h2>

      <div style="margin-bottom: 15px">
        <el-select
          v-model="feedbackStatus"
          placeholder="全部状态"
          clearable
          @change="loadFeedbacks"
          style="width: 150px"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="已处理" value="processed" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-button @click="loadFeedbacks" style="margin-left: 10px">刷新</el-button>
      </div>

      <el-table :data="feedbacks" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="100" />
        <el-table-column prop="type" label="反馈类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系方式" width="120" />
        <el-table-column prop="plant_name" label="识别植物" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showFeedbackDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        layout="prev, pager, next"
        :total="feedbackTotal"
        :page-size="feedbackPageSize"
        :current-page="feedbackPage"
        @current-change="changeFeedbackPage"
        style="margin-top: 20px; text-align: center"
      />
    </div>

    <!-- 反馈详情弹窗 -->
    <el-dialog v-model="feedbackDetailVisible" title="反馈详情" width="600px">
      <div v-if="currentFeedback" class="feedback-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="反馈ID">{{ currentFeedback.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentFeedback.username }}</el-descriptions-item>
          <el-descriptions-item label="反馈类型">{{ getTypeLabel(currentFeedback.type) }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentFeedback.contact || '无' }}</el-descriptions-item>
          <el-descriptions-item label="识别植物">{{ currentFeedback.plant_name || '无' }}</el-descriptions-item>
          <el-descriptions-item label="使用模型">{{ currentFeedback.model_name || '无' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentFeedback.status)">{{ getStatusLabel(currentFeedback.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentFeedback.created_at }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentFeedback.description }}</el-descriptions-item>
          <el-descriptions-item v-if="currentFeedback.admin_note" label="处理备注" :span="2">{{ currentFeedback.admin_note }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentFeedback.image_path" class="feedback-image">
          <p><strong>反馈图片：</strong></p>
          <el-image
            :src="getImageUrl(currentFeedback.image_path)"
            :preview-src-list="[getImageUrl(currentFeedback.image_path)]"
            fit="contain"
            style="max-width: 100%; max-height: 300px"
          />
        </div>

        <div v-if="currentFeedback.status === 'pending'" class="feedback-actions">
          <el-divider />
          <h4>处理反馈</h4>
          <el-form label-width="100px">
            <el-form-item label="处理方式" required>
              <el-radio-group v-model="processAction">
                <el-radio value="add_training">添加到扩展训练数据</el-radio>
                <el-radio value="mark_correct">标记为正确预测</el-radio>
                <el-radio value="dismiss">无需处理</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 添加到扩展训练数据时显示额外字段 -->
            <template v-if="processAction === 'add_training'">
              <el-form-item label="花卉Label" required>
                <el-input
                  v-model="trainingLabel"
                  placeholder="请输入花卉的label（如：rose）"
                />
              </el-form-item>
              <el-form-item label="中文名称" required>
                <el-input
                  v-model="trainingNameCn"
                  placeholder="请输入花卉的中文名称（如：玫瑰）"
                />
              </el-form-item>
              <el-form-item label="管理员备注">
                <el-input
                  v-model="trainingNote"
                  type="textarea"
                  :rows="2"
                  placeholder="备注信息（选填）"
                />
              </el-form-item>
            </template>

            <!-- 其他处理方式的备注 -->
            <el-form-item v-else label="处理备注">
              <el-input
                v-model="adminNote"
                type="textarea"
                :rows="2"
                placeholder="请输入处理备注"
              />
            </el-form-item>
          </el-form>
          <div style="text-align: right">
            <el-button @click="feedbackDetailVisible = false">取消</el-button>
            <el-button type="primary" :loading="processingLoading" @click="handleProcessFeedback">确认处理</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
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

// 反馈管理
const feedbacks = ref([])
const feedbackPage = ref(1)
const feedbackPageSize = ref(10)
const feedbackTotal = ref(0)
const feedbackStatus = ref('')
const feedbackDetailVisible = ref(false)
const currentFeedback = ref(null)
const adminNote = ref('')
const processAction = ref('add_training')
const processingLoading = ref(false)
const trainingLabel = ref('')
const trainingNameCn = ref('')
const trainingNote = ref('')

const typeOptionsMap = {
  incorrect: '识别结果错误',
  missing: '植物类别缺失',
  low_confidence: '置信度过低',
  bug: '功能异常',
  suggestion: '改进建议',
  other: '其他问题'
}

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
  loadFeedbacks()
})

// 反馈管理
const loadFeedbacks = async () => {
  try {
    let url = `${API_BASE}/admin/feedbacks?page=${feedbackPage.value}&page_size=${feedbackPageSize.value}`
    if (feedbackStatus.value) {
      url += `&status=${feedbackStatus.value}`
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await res.json()
    console.log('反馈数据:', data)
    if (data.success) {
      feedbacks.value = data.feedbacks
      feedbackTotal.value = data.total
    } else {
      ElMessage.error(data.error || '获取反馈列表失败')
    }
  } catch (error) {
    console.error('加载反馈列表失败:', error)
    ElMessage.error('加载反馈列表失败')
  }
}

const changeFeedbackPage = (p) => {
  feedbackPage.value = p
  loadFeedbacks()
}

const getTypeLabel = (type) => typeOptionsMap[type] || type

const getStatusLabel = (status) => {
  const map = { pending: '待处理', processed: '已处理', rejected: '已拒绝' }
  return map[status] || status
}

const getStatusTagType = (status) => {
  const map = { pending: 'warning', processed: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `http://127.0.0.1:5000${path}`
}

const showFeedbackDetail = (row) => {
  currentFeedback.value = row
  adminNote.value = ''
  processAction.value = 'add_training'
  trainingLabel.value = ''
  trainingNameCn.value = ''
  trainingNote.value = ''
  feedbackDetailVisible.value = true
}

const handleProcessFeedback = async () => {
  if (!processAction.value) {
    ElMessage.warning('请选择处理方式')
    return
  }

  if (processAction.value === 'add_training') {
    if (!trainingLabel.value || !trainingNameCn.value) {
      ElMessage.warning('请填写花卉Label和中文名称')
      return
    }
  }

  processingLoading.value = true
  try {
    let requestBody = {
      action: processAction.value
    }

    if (processAction.value === 'add_training') {
      requestBody = {
        ...requestBody,
        label: trainingLabel.value,
        name_cn: trainingNameCn.value,
        note: trainingNote.value
      }
    } else {
      requestBody.note = adminNote.value
    }

    const res = await fetch(`${API_BASE}/admin/feedback/${currentFeedback.value.id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(requestBody)
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('处理成功')
      feedbackDetailVisible.value = false
      loadFeedbacks()
    } else {
      ElMessage.error(data.error || '处理失败')
    }
  } catch (error) {
    ElMessage.error('处理失败')
  } finally {
    processingLoading.value = false
  }
}
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

.feedback-detail {
  padding: 10px 0;
}

.feedback-image {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.feedback-actions {
  margin-top: 20px;
}

.feedback-actions h4 {
  margin-bottom: 15px;
  color: #333;
}
</style>
