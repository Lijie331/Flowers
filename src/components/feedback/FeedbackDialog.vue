<template>
  <el-dialog
    v-model="dialogVisible"
    title="提交反馈"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleDialogClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      status-icon
    >
      <el-form-item label="反馈类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择反馈类型" style="width: 100%">
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="详细描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请详细描述您的问题或建议（10-500字）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="上传图片" prop="image">
        <el-upload
          ref="uploadRef"
          class="feedback-upload"
          action="#"
          :auto-upload="false"
          :limit="1"
          :on-change="handleImageChange"
          :on-remove="handleImageRemove"
          accept="image/*"
          list-type="picture"
        >
          <el-button size="small" type="primary">选择图片</el-button>
          <template #tip>
            <div class="el-upload__tip">支持 JPG、PNG 格式，可上传识别结果截图帮助管理员判断</div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item label="联系方式" prop="contact">
        <el-input
          v-model="form.contact"
          placeholder="请输入手机号（选填）"
          maxlength="11"
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  feedbackData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const API_BASE_URL = 'http://127.0.0.1:5000'

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const formRef = ref()
const uploadRef = ref()

const form = ref({
  type: '',
  description: '',
  contact: '',
  image: null
})

const typeOptions = [
  { value: 'incorrect', label: '识别结果错误', description: '将A植物误识别为B植物' },
  { value: 'missing', label: '植物类别缺失', description: '无法找到正确的植物类别' },
  { value: 'low_confidence', label: '置信度过低', description: '识别结果不确定' },
  { value: 'bug', label: '功能异常', description: '页面或功能出现错误' },
  { value: 'suggestion', label: '改进建议', description: '对产品功能的建议' },
  { value: 'other', label: '其他问题', description: '其他反馈' }
]

const rules = {
  type: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入反馈描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述内容需10-500字', trigger: 'blur' }
  ],
  contact: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const handleImageChange = (uploadFile) => {
  form.value.image = uploadFile.raw
}

const handleImageRemove = () => {
  form.value.image = null
}

const handleDialogClosed = () => {
  form.value = { type: '', description: '', contact: '', image: null }
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('type', form.value.type)
      formData.append('description', form.value.description)
      if (form.value.contact) {
        formData.append('contact', form.value.contact)
      }
      if (form.value.image) {
        formData.append('image', form.value.image)
      }
      formData.append('context', JSON.stringify(props.feedbackData))

      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        ElMessage.success('反馈已提交，感谢您的帮助')
        dialogVisible.value = false
      } else {
        ElMessage.error(data.error || '提交失败')
      }
    } catch (error) {
      console.error('提交反馈失败:', error)
      ElMessage.error('网络错误，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.feedback-upload {
  width: 100%;
}

.feedback-upload :deep(.el-upload-list) {
  max-width: 300px;
}
</style>
