<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="420px"
    :close-on-click-modal="false"
    @closed="handleDialogClosed"
  >
    <!-- 登录表单 -->
    <el-form
      v-if="currentMode === 'login'"
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      label-width="80px"
      status-icon
    >
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="loginForm.username"
          placeholder="请输入用户名"
          prefix-icon="User"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="请输入密码"
          prefix-icon="Lock"
          show-password
          @keyup.enter="handleLogin"
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="text" @click="switchMode('reset' )">忘记密码？</el-button>
        <el-button type="text" style="float: right" @click="switchMode('register')">注册账号</el-button>
      </el-form-item>
    </el-form>
    
    <!-- 注册表单 -->
    <el-form
      v-else-if="currentMode === 'register'"
      ref="registerFormRef"
      :model="registerForm"
      :rules="registerRules"
      label-width="80px"
      status-icon
    >
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="registerForm.username"
          placeholder="请输入用户名"
          prefix-icon="User"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="registerForm.phone"
          placeholder="请输入手机号"
          prefix-icon="Phone"
          maxlength="11"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="请输入密码(至少6位)"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>
      
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="text" @click="switchMode('login')">已有账号？登录</el-button>
      </el-form-item>
    </el-form>
    
    <!-- 找回密码表单 -->
    <el-form
      v-else-if="currentMode === 'reset'"
      ref="resetFormRef"
      :model="resetForm"
      :rules="resetRules"
      label-width="80px"
      status-icon
    >
      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="resetForm.phone"
          placeholder="请输入注册的手机号"
          prefix-icon="Phone"
          maxlength="11"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="resetForm.newPassword"
          type="password"
          placeholder="请输入新密码(至少6位)"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="text" @click="switchMode('login')">想起密码了？登录</el-button>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ currentMode === 'login' ? '登录' : currentMode === 'register' ? '注册' : '重置密码' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'success'])

const API_BASE_URL = 'http://127.0.0.1:5000'

// 状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentMode = ref('login') // login | register | reset
const loading = ref(false)

// 表单引用
const loginFormRef = ref()
const registerFormRef = ref()
const resetFormRef = ref()

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// 注册表单
const registerForm = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// 重置密码表单
const resetForm = ref({
  phone: '',
  newPassword: ''
})

// 验证器
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 登录规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 注册规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名3-20个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 重置密码规则
const resetRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

// 标题
const dialogTitle = computed(() => {
  switch (currentMode.value) {
    case 'login': return '登录'
    case 'register': return '注册账号'
    case 'reset': return '找回密码'
    default: return '登录'
  }
})

// 切换模式
const switchMode = (mode) => {
  currentMode.value = mode
}

// 重置表单
const handleDialogClosed = () => {
  loginForm.value = { username: '', password: '' }
  registerForm.value = { username: '', phone: '', password: '', confirmPassword: '' }
  resetForm.value = { phone: '', newPassword: '' }
}

// 提交表单
const handleSubmit = async () => {
  if (currentMode.value === 'login') {
    await handleLogin()
  } else if (currentMode.value === 'register') {
    await handleRegister()
  } else if (currentMode.value === 'reset') {
    await handleReset()
  }
}

// 登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm.value)
      })
      
      const data = await res.json()
      
      if (data.success) {
        ElMessage.success('登录成功')
        // 保存token和用户信息
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        emit('success', data.user)
        dialogVisible.value = false
      } else {
        ElMessage.error(data.message)
      }
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error('登录失败，请检查网络连接')
    } finally {
      loading.value = false
    }
  })
}

// 注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.value.username,
          phone: registerForm.value.phone,
          password: registerForm.value.password
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        ElMessage.success('注册成功，请登录')
        switchMode('login')
        loginForm.value.username = registerForm.value.username
      } else {
        ElMessage.error(data.message)
      }
    } catch (error) {
      console.error('注册失败:', error)
      ElMessage.error('注册失败，请检查网络连接')
    } finally {
      loading.value = false
    }
  })
}

// 重置密码
const handleReset = async () => {
  if (!resetFormRef.value) return
  
  await resetFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: resetForm.value.phone,
          new_password: resetForm.value.newPassword
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        ElMessage.success('密码重置成功')
        switchMode('login')
      } else {
        ElMessage.error(data.message)
      }
    } catch (error) {
      console.error('重置失败:', error)
      ElMessage.error('重置失败，请检查网络连接')
    } finally {
      loading.value = false
    }
  })
}
</script>
