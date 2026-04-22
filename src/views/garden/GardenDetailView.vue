<template>
  <div class="garden-detail">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button @click="$router.push('/garden')">
        <el-icon><ArrowLeft /></el-icon> 返回花园
      </el-button>
    </div>

    <!-- 花卉信息头部 -->
    <el-card class="plant-header-card" v-loading="loading">
      <div class="plant-header" v-if="plant">
        <div class="plant-main-info">
          <h1 class="plant-name">{{ plant.nickname || plant.flower_name }}</h1>
          <p class="plant-latin" v-if="plant.nickname">{{ plant.latin_name || plant.flower_name }}</p>
          <div class="plant-tags">
            <el-tag :type="getStatusType(plant.status)" size="large">{{ getStatusText(plant.status) }}</el-tag>
            <el-tag v-if="plant.location" type="info" size="large">
              <el-icon><Location /></el-icon> {{ plant.location }}
            </el-tag>
            <el-tag v-if="plant.acquired_date" type="info" size="large">
              <el-icon><Calendar /></el-icon> {{ formatDate(plant.acquired_date) }}
            </el-tag>
          </div>
        </div>
        <div class="plant-actions">
          <el-button type="primary" @click="showEditDialog = true">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 养护状态卡片 -->
    <el-row :gutter="20" class="care-status-row" v-if="plant">
      <el-col :span="8">
        <el-card shadow="hover" class="care-card">
          <div class="care-stat">
            <el-icon class="care-icon water"><Watermelon /></el-icon>
            <div class="care-info">
              <span class="care-label">浇水周期</span>
              <span class="care-value">{{ plant.water_frequency || 3 }} 天</span>
            </div>
          </div>
          <div class="care-footer">
            <span v-if="plant.last_watered">上次: {{ plant.last_watered }}</span>
            <span v-else class="text-muted">暂无记录</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="care-card">
          <div class="care-stat">
            <el-icon class="care-icon fertilize"><Sugar /></el-icon>
            <div class="care-info">
              <span class="care-label">施肥周期</span>
              <span class="care-value">{{ plant.fertilize_frequency || 30 }} 天</span>
            </div>
          </div>
          <div class="care-footer">
            <span v-if="plant.last_fertilized">上次: {{ plant.last_fertilized }}</span>
            <span v-else class="text-muted">暂无记录</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="care-card">
          <div class="care-stat">
            <el-icon class="care-icon schedule"><Clock /></el-icon>
            <div class="care-info">
              <span class="care-label">待办养护</span>
              <span class="care-value">{{ upcomingSchedules.length }} 项</span>
            </div>
          </div>
          <div class="care-footer">
            <el-button type="text" size="small" @click="activeTab = 'care'">查看计划 →</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tab切换区域 -->
    <el-card class="main-content-card">
      <el-tabs v-model="activeTab">
        <!-- 成长记录（合并图册和日志） -->
        <el-tab-pane label="📝 成长记录" name="records">
          <div class="tab-header">
            <el-button type="primary" @click="openDiaryDialog()">
              <el-icon><Plus /></el-icon> 写记录
            </el-button>
            <el-button type="warning" @click="showCompareDialog = true" :disabled="records.length < 2">
              <el-icon><Operation /></el-icon> 对比图
            </el-button>
          </div>
          
          <div v-loading="loadingRecords" class="records-timeline">
            <el-empty v-if="!loadingRecords && records.length === 0" description="还没有记录，快来写下第一篇成长记录吧！" />
            <div v-else class="timeline">
              <div v-for="record in records" :key="record.id" class="record-item">
                <div class="timeline-date">
                  <span class="date-text">{{ record.diary_date || record.recorded_date }}</span>
                </div>
                <div class="timeline-content">
                  <el-card shadow="hover" class="record-card">
                    <!-- 图片区域 -->
                    <div v-if="record.image_url" class="record-images">
                      <div class="image-grid">
                        <div v-for="(img, idx) in getImages(record)" :key="idx" class="image-item">
                          <el-image 
                            :src="img" 
                            fit="cover" 
                            class="record-image"
                            :preview-src-list="getImages(record)"
                            :initial-index="idx"
                          />
                        </div>
                      </div>
                    </div>
                    <!-- 内容区域 -->
                    <div class="record-body">
                      <div class="record-header">
                        <span class="record-mood">{{ getMoodEmoji(record.mood) }}</span>
                        <span class="record-weather" v-if="record.weather">{{ record.weather }}</span>
                        <el-button type="text" size="small" class="edit-btn" @click="editRecord(record)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button type="text" size="small" class="delete-btn" @click="deleteRecord(record)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                      <div class="record-content">{{ record.content || record.notes || '无文字记录' }}</div>
                      <div class="record-footer">
                        <span class="record-time">{{ formatTime(record.created_at) }}</span>
                      </div>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 养护计划 -->
        <el-tab-pane label="🌱 养护计划" name="care">
          <div class="tab-header">
            <el-button type="success" @click="showScheduleDialog = true">
              <el-icon><Plus /></el-icon> 添加计划
            </el-button>
          </div>
          
          <div v-loading="loadingSchedule" class="schedule-list">
            <el-empty v-if="!loadingSchedule && schedules.length === 0" description="还没有养护计划，快来添加吧！" />
            <div v-else class="schedules">
              <div v-for="schedule in schedules" :key="schedule.id" class="schedule-item">
                <div class="schedule-icon" :class="schedule.care_type">
                  <el-icon v-if="schedule.care_type === 'water'"><Watermelon /></el-icon>
                  <el-icon v-else-if="schedule.care_type === 'fertilize'"><Sugar /></el-icon>
                  <el-icon v-else><Sunny /></el-icon>
                </div>
                <div class="schedule-info">
                  <span class="schedule-type">{{ getCareTypeName(schedule.care_type) }}</span>
                  <span class="schedule-freq">每 {{ schedule.frequency_days }} 天</span>
                </div>
                <div class="schedule-due">
                  <el-tag :type="isOverdue(schedule.next_due) ? 'danger' : 'success'">
{{ isOverdue(schedule.next_due) ? '已到期' : schedule.next_due }}
                  </el-tag>
                </div>
                <div class="schedule-actions">
                  <el-button type="primary" size="small" @click="completeCare(schedule)" :loading="completing">
                    完成
                  </el-button>
                  <el-button type="danger" size="small" plain @click="deleteSchedule(schedule.id)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 写记录对话框 -->
    <el-dialog v-model="showDiaryDialog" :title="editingRecord ? '编辑记录' : '写成长记录'" width="600px">
      <el-form :model="diaryForm" label-width="80px">
        <el-form-item label="日期" required>
          <el-date-picker v-model="diaryForm.diary_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="心情">
          <el-select v-model="diaryForm.mood" style="width: 100%">
            <el-option label="😊 开心" value="happy" />
            <el-option label="😐 一般" value="normal" />
            <el-option label="😢 难过" value="sad" />
          </el-select>
        </el-form-item>
        <el-form-item label="天气">
          <el-input v-model="diaryForm.weather" placeholder="如：晴、阴、雨" />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            ref="diaryUploadRef"
            :auto-upload="false"
            :limit="9"
            accept="image/*"
            :on-change="handleDiaryImageChange"
            :file-list="diaryFileList"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="diaryForm.content" type="textarea" :rows="4" placeholder="记录今天的成长变化..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDiaryDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDiary" :loading="submittingDiary" :disabled="!diaryForm.content">保存</el-button>
      </template>
    </el-dialog>

    <!-- 养护计划对话框 -->
    <el-dialog v-model="showScheduleDialog" title="添加养护计划" width="450px">
      <el-form :model="scheduleForm" label-width="80px">
        <el-form-item label="养护类型" required>
          <el-select v-model="scheduleForm.care_type" style="width: 100%">
            <el-option label="💧 浇水" value="water" />
            <el-option label="🌱 施肥" value="fertilize" />
            <el-option label="✂️ 修剪" value="prune" />
            <el-option label="🪴 换盆" value="repot" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="间隔天数" required>
          <el-input-number v-model="scheduleForm.frequency_days" :min="1" :max="365" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="scheduleForm.notes" placeholder="养护注意事项..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showScheduleDialog = false">取消</el-button>
        <el-button type="success" @click="submitSchedule" :loading="submittingSchedule">添加</el-button>
      </template>
    </el-dialog>

    <!-- 对比图对话框 -->
    <el-dialog v-model="showCompareDialog" title="Before / After 对比图" width="800px">
      <div class="compare-container">
        <div class="compare-select">
          <div class="select-group">
            <label>选择第一张（Before）：</label>
            <el-select v-model="compareBefore" placeholder="选择图片" filterable style="width: 100%">
              <el-option v-for="record in recordsWithImages" :key="record.id"
                :label="`${record.diary_date || record.recorded_date} - ${(record.content || '').substring(0, 20)}...`"
                :value="record.id" />
            </el-select>
          </div>
          <div class="select-group">
            <label>选择第二张（After）：</label>
            <el-select v-model="compareAfter" placeholder="选择图片" filterable style="width: 100%">
              <el-option v-for="record in recordsWithImages" :key="record.id"
                :label="`${record.diary_date || record.recorded_date} - ${(record.content || '').substring(0, 20)}...`"
                :value="record.id" />
            </el-select>
          </div>
        </div>
        <div class="compare-preview" v-if="compareBefore && compareAfter">
          <div class="compare-images">
            <div class="compare-side before">
              <div class="compare-label">Before</div>
              <div class="compare-date">{{ getCompareDate(compareBefore) }}</div>
              <div class="compare-img-container">
                <img :src="getCompareImage(compareBefore)" alt="Before" class="compare-img" />
              </div>
              <div class="compare-desc">{{ getCompareContent(compareBefore) }}</div>
            </div>
            <div class="compare-arrow"><el-icon size="40"><Right /></el-icon></div>
            <div class="compare-side after">
              <div class="compare-label">After</div>
              <div class="compare-date">{{ getCompareDate(compareAfter) }}</div>
              <div class="compare-img-container">
                <img :src="getCompareImage(compareAfter)" alt="After" class="compare-img" />
              </div>
              <div class="compare-desc">{{ getCompareContent(compareAfter) }}</div>
            </div>
          </div>
          <div class="compare-days" v-if="getCompareDays()">相差 {{ getCompareDays() }} 天</div>
        </div>
        <el-empty v-else description="请选择两张图片进行对比" />
      </div>
      <template #footer>
        <el-button @click="showCompareDialog = false">关闭</el-button>
        <el-button type="primary" @click="shareCompare" :disabled="!compareBefore || !compareAfter">
          <el-icon><Share /></el-icon> 分享
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑植物对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑植物信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="给植物起个名字..." />
        </el-form-item>
        <el-form-item label="浇水频率">
          <el-input-number v-model="editForm.water_frequency" :min="1" :max="90" /> 天
        </el-form-item>
        <el-form-item label="施肥频率">
          <el-input-number v-model="editForm.fertilize_frequency" :min="1" :max="180" /> 天
        </el-form-item>
        <el-form-item label="摆放位置">
          <el-input v-model="editForm.location" placeholder="如: 阳台、客厅..." />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status">
            <el-option label="健康" value="healthy" />
            <el-option label="生长中" value="growing" />
            <el-option label="休眠" value="dormant" />
            <el-option label="生病" value="sick" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updatePlant" :loading="updating">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Location, Calendar, Edit, Delete, Plus,
  Watermelon, Sugar, Clock, Sunny, Operation, Right, Share
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const API_BASE = 'http://127.0.0.1:5000/api'

const plantId = computed(() => route.params.id)

// 数据
const loading = ref(false)
const plant = ref(null)
const records = ref([])  // 合并日记和照片
const schedules = ref([])
const upcomingSchedules = ref([])

// Tab状态
const activeTab = ref('records')
const loadingRecords = ref(false)
const loadingSchedule = ref(false)

// 对话框状态
const showDiaryDialog = ref(false)
const showScheduleDialog = ref(false)
const showEditDialog = ref(false)
const showCompareDialog = ref(false)
const compareBefore = ref(null)
const compareAfter = ref(null)

// 状态
const submittingDiary = ref(false)
const submittingSchedule = ref(false)
const completing = ref(false)
const updating = ref(false)
const editingRecord = ref(null)
const diaryUploadRef = ref(null)
const selectedDiaryFiles = ref([])
const diaryFileList = ref([])

// 表单数据
const diaryForm = ref({ diary_date: '', content: '', mood: 'normal', weather: '' })
const scheduleForm = ref({ care_type: 'water', frequency_days: 7, notes: '' })
const editForm = ref({})

// 获取植物详情
const fetchPlant = async () => {
  const token = localStorage.getItem('token')
  if (!token) { ElMessage.warning('请先登录'); return }
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden/${plantId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      plant.value = data.data.plant
      editForm.value = { ...plant.value }
    } else if (data.error?.includes('不可见') || data.error?.includes('private')) {
      ElMessage.warning('对方花园不可见哦~')
      router.push('/garden')
    } else if (data.error) {
      ElMessage.error(data.error)
    }
  } catch { ElMessage.error('获取植物信息失败') }
  finally { loading.value = false }
}

// 获取合并的成长记录（日记+照片）
const fetchRecords = async () => {
  const token = localStorage.getItem('token')
  loadingRecords.value = true
  try {
    // 获取日记
    const diaryRes = await fetch(`${API_BASE}/community/garden/${plantId.value}/diary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const diaryData = await diaryRes.json()
    
    // 获取照片
    const photoRes = await fetch(`${API_BASE}/community/garden/${plantId.value}/photos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const photoData = await photoRes.json()
    
    const diaryEntries = diaryData.success ? (diaryData.data.entries || []) : []
    const photos = photoData.success ? (photoData.data.photos || []) : []
    
    // 合并并按日期排序
    const allRecords = [
      ...diaryEntries.map(d => ({ ...d, type: 'diary' })),
      ...photos.map(p => ({ ...p, type: 'photo', content: p.notes, diary_date: p.recorded_date, mood: 'normal' }))
    ]
    
    // 按日期排序
    allRecords.sort((a, b) => {
      const dateA = new Date(a.diary_date || a.recorded_date)
      const dateB = new Date(b.diary_date || b.recorded_date)
      return dateB - dateA
    })
    
    records.value = allRecords
  } catch { ElMessage.error('获取记录失败') }
  finally { loadingRecords.value = false }
}

// 获取图片列表
const getImages = (record) => {
  if (record.image_url) {
    return [record.image_url]
  }
  return []
}

// 处理日记图片选择
const handleDiaryImageChange = (file) => {
  selectedDiaryFiles.value = [file.raw]
  diaryFileList.value = [file]
}

// 打开写记录对话框
const openDiaryDialog = () => {
  editingRecord.value = null
  diaryForm.value = { diary_date: '', content: '', mood: 'normal', weather: '' }
  diaryFileList.value = []
  selectedDiaryFiles.value = []
  showDiaryDialog.value = true
}

// 编辑记录
const editRecord = (record) => {
  editingRecord.value = record
  diaryForm.value = {
    diary_date: record.diary_date || record.recorded_date,
    content: record.content || record.notes || '',
    mood: record.mood || 'normal',
    weather: record.weather || ''
  }
  showDiaryDialog.value = true
}

// 删除记录
const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm('确定删除这条记录吗？', '提示', { type: 'warning' })
    const token = localStorage.getItem('token')
    let response
    if (record.type === 'diary') {
      response = await fetch(`${API_BASE}/community/diary/${record.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } else {
      response = await fetch(`${API_BASE}/community/garden/photos/${record.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }
    const data = await response.json()
    if (data.success) { ElMessage.success('已删除'); await fetchRecords() }
  } catch {}
}

// 提交日记
const submitDiary = async () => {
  if (!diaryForm.value.content) { ElMessage.warning('请输入记录内容'); return }
  const token = localStorage.getItem('token')
  if (!diaryForm.value.diary_date) diaryForm.value.diary_date = new Date().toISOString().split('T')[0]
  
  submittingDiary.value = true
  try {
    const formData = new FormData()
    formData.append('diary_date', diaryForm.value.diary_date)
    formData.append('content', diaryForm.value.content)
    formData.append('mood', diaryForm.value.mood)
    formData.append('weather', diaryForm.value.weather)
    
    if (selectedDiaryFiles.value.length > 0) {
      formData.append('image', selectedDiaryFiles.value[0])
    }
    
    let response, data
    if (editingRecord.value) {
      // 编辑模式使用JSON
      response = await fetch(`${API_BASE}/community/diary/${editingRecord.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(diaryForm.value)
      })
      data = await response.json()
    } else {
      // 新增模式使用FormData
      response = await fetch(`${API_BASE}/community/garden/${plantId.value}/diary`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      data = await response.json()
    }
    
    if (data.success) {
      ElMessage.success(editingRecord.value ? '记录已更新' : '记录已保存')
      showDiaryDialog.value = false
      diaryForm.value = { diary_date: '', content: '', mood: 'normal', weather: '' }
      editingRecord.value = null
      diaryFileList.value = []
      selectedDiaryFiles.value = []
      await fetchRecords()
    } else { ElMessage.error(data.error) }
  } catch (e) { ElMessage.error('保存失败: ' + e.message) }
  finally { submittingDiary.value = false }
}

// 获取养护计划
const fetchSchedules = async () => {
  const token = localStorage.getItem('token')
  loadingSchedule.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden/${plantId.value}/schedules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      schedules.value = data.data.schedules || []
      upcomingSchedules.value = schedules.value.filter(s => isOverdue(s.next_due))
    }
  } catch { ElMessage.error('获取计划失败') }
  finally { loadingSchedule.value = false }
}

// 养护计划
const submitSchedule = async () => {
  const token = localStorage.getItem('token')
  submittingSchedule.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden/${plantId.value}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(scheduleForm.value)
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('计划已添加')
      showScheduleDialog.value = false
      scheduleForm.value = { care_type: 'water', frequency_days: 7, notes: '' }
      await fetchSchedules()
    } else { ElMessage.error(data.error) }
  } catch { ElMessage.error('添加失败') }
  finally { submittingSchedule.value = false }
}

const completeCare = async (schedule) => {
  const token = localStorage.getItem('token')
  completing.value = true
  try {
    const response = await fetch(`${API_BASE}/community/schedules/${schedule.id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('养护完成')
      await fetchSchedules()
      await fetchPlant()
    } else { ElMessage.error(data.error) }
  } catch { ElMessage.error('操作失败') }
  finally { completing.value = false }
}

const deleteSchedule = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除此计划吗？', '提示', { type: 'warning' })
    const token= localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/community/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) { ElMessage.success('已删除'); await fetchSchedules() }
  } catch {}
}

// 更新植物
const updatePlant = async () => {
  const token = localStorage.getItem('token')
  updating.value = true
  try {
    const response = await fetch(`${API_BASE}/community/garden/${plantId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(editForm.value)
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('更新成功')
      showEditDialog.value = false
      await fetchPlant()
    } else { ElMessage.error(data.error) }
  } catch { ElMessage.error('更新失败') }
  finally { updating.value = false }
}

// 工具函数
const getStatusType = (status) => ({ healthy: 'success', growing: 'primary', dormant: 'info', sick: 'danger' })[status] || 'info'
const getStatusText = (status) => ({ healthy: '健康', growing: '生长中', dormant: '休眠', sick: '生病' })[status] || status
const getMoodEmoji = (mood) => ({ happy: '😊', normal: '😐', sad: '😢' })[mood] || '😐'
const getCareTypeName = (type) => ({ water: '💧 浇水', fertilize: '🌱 施肥', prune: '✂️ 修剪', repot: '🪴 换盆', other: '🌿 其他' })[type] || type
const isOverdue = (date) => date ? new Date(date) <= new Date() : false
const formatTime = (time) => time ? new Date(time).toLocaleString('zh-CN') : ''
const formatDate = (date) => {
  if (!date) return ''
  // 如果是纯日期字符串（如 "2026-04-22"），直接返回
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date
  return new Date(date).toLocaleDateString('zh-CN')
}

// 对比图功能
const recordsWithImages = computed(() => records.value.filter(r => r.image_url))

const getCompareDate = (recordId) => {
  const record = records.value.find(r => r.id === recordId)
  return record?.diary_date || record?.recorded_date || ''
}

const getCompareContent = (recordId) => {
  const record = records.value.find(r => r.id === recordId)
  return record?.content || record?.notes || ''
}

const getCompareImage = (recordId) => {
  const record = records.value.find(r => r.id === recordId)
  if (!record?.image_url) return ''
  return record.image_url.startsWith('http') ? record.image_url : `http://127.0.0.1:5000${record.image_url}`
}

const getCompareDays = () => {
  if (!compareBefore.value || !compareAfter.value) return 0
  const before = records.value.find(r => r.id === compareBefore.value)
  const after = records.value.find(r => r.id === compareAfter.value)
  if (!before || !after) return 0
  const date1 = new Date(before.diary_date || before.recorded_date)
  const date2 = new Date(after.diary_date || after.recorded_date)
  return Math.abs(Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24)))
}

const shareCompare = () => {
  const shareText = `来看看我的${plant.value?.nickname || plant.value?.flower_name}的成长变化！`
  navigator.clipboard.writeText(shareText).then(() => {
    ElMessage.success('分享语已复制到剪贴板')
  })
}

onMounted(async () => {
  await fetchPlant()
  await fetchRecords()
})
</script>

<style scoped>
.garden-detail {
  padding: 20px;
  min-height: calc(100vh - 120px);
  background: #f5f7fa;
}

.back-bar {
  margin-bottom: 20px;
}

.plant-header-card {
  margin-bottom: 20px;
}

.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plant-name {
  margin: 0 0 5px;
  font-size: 28px;
  color: #303133;
}

.plant-latin {
  margin: 0 0 15px;
  font-size: 16px;
  color: #909399;
  font-style: italic;
}

.plant-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.care-status-row {
  margin-bottom: 20px;
}

.care-card {
  text-align: center;
}

.care-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 10px 0;
}

.care-icon {
  font-size: 32px;
}

.care-icon.water { color: #409eff; }
.care-icon.fertilize { color: #67c23a; }
.care-icon.schedule { color: #e6a23c; }

.care-info {
  text-align: left;
}

.care-label {
  display: block;
  font-size: 12px;
  color: #909399;
}

.care-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.care-footer {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
}

.main-content-card {
  min-height: 500px;
}

.tab-header {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

/* 成长记录时间线 */
.records-timeline {
  position: relative;
  padding-left: 20px;
}

.records-timeline::before {
  content: '';
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.record-item {
  display: flex;
  margin-bottom: 25px;
}

.timeline-date {
  width: 80px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 20px;
  position: relative;
}

.timeline-date::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 10px;
  width: 12px;
  height: 12px;
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid #fff;
}

.date-text {
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
}

.timeline-content {
  flex: 1;
  padding-left: 30px;
}

.record-card {
  background: #fafafa;
}

.record-images {
  margin-bottom: 12px;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-item {
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
}

.record-image {
  width: 100%;
  height: 100%;
}

.record-body {
  padding: 0;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.record-mood {
  font-size: 20px;
}

.record-weather {
  font-size: 12px;
  color: #909399;
}

.record-header .edit-btn,
.record-header .delete-btn {
  margin-left: auto;
  padding: 2px;
}

.record-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.record-footer {
  margin-top: 10px;
  text-align: right;
}

.record-time {
  font-size: 12px;
  color: #c0c4cc;
}

/* 养护计划 */
.schedule-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  gap: 15px;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
}

.schedule-icon.water { background: #409eff; }
.schedule-icon.fertilize { background: #67c23a; }
.schedule-icon.prune { background: #e6a23c; }
.schedule-icon.repot { background: #8e44ad; }
.schedule-icon.other { background: #909399; }

.schedule-info {
  flex: 1;
}

.schedule-type {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.schedule-freq {
  font-size: 12px;
  color: #909399;
}

.schedule-due {
  min-width: 100px;
  text-align: center;
}

.schedule-actions {
  display: flex;
  gap: 8px;
}

/* 对比图样式 */
.compare-container {
  min-height: 300px;
}

.compare-select {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.select-group {
  flex: 1;
}

.select-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.compare-preview {
  text-align: center;
}

.compare-images {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.compare-side {
  flex: 1;
  max-width: 300px;
}

.compare-label {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.compare-side.before .compare-label { color: #909399; }
.compare-side.after .compare-label { color: #67c23a; }

.compare-date {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.compare-img-container {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.compare-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.compare-desc {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.compare-arrow {
  color: #409eff;
}

.compare-days {
  margin-top: 20px;
  padding: 10px 20px;
  background: #f0f9eb;
  border-radius: 20px;
  color: #67c23a;
  font-weight: 500;
  display: inline-block;
}
</style>
