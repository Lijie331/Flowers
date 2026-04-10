<template>
  <div class="community-container">
    <!-- SVG 图标定义 -->
    <svg style="display: none;">
      <!-- 爱心图标 - 点赞 -->
      <symbol id="heart-icon" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </symbol>
      <symbol id="heart-filled-icon" viewBox="0 0 24 24">
        <path fill="#E53E3E" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </symbol>
      <!-- 星星图标 - 收藏 -->
      <symbol id="star-icon" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </symbol>
      <symbol id="star-filled-icon" viewBox="0 0 24 24">
        <path fill="#F59E0B" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </symbol>
    </svg>

    <el-card class="header-card">
      <template #header>
        <div class="header-row">
          <span class="title">🌺 花友圈</span>
          <div class="header-actions">
            <el-button v-if="isAdmin" type="warning" @click="$router.push('/audit')">
              <el-icon><DocumentChecked /></el-icon>
              内容审核
            </el-button>
            <el-button type="primary" @click="openPostDialog">
              <el-icon><Plus /></el-icon>
              发布动态
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <el-alert v-if="draftCount > 0" :title="`你有 ${draftCount} 个草稿`" type="info" show-icon closable @close="showDrafts = true" class="draft-alert">
      <template #default><span class="draft-link" @click="showDrafts = true">查看草稿箱</span></template>
    </el-alert>

    <div v-loading="loading" class="posts-list">
      <el-empty v-if="!loading && posts.length === 0" description="还没有动态，快来发布第一条吧！">
        <el-button type="primary" @click="openPostDialog">发布动态</el-button>
      </el-empty>
      
      <el-card v-for="post in posts" :key="post.id" class="post-card" shadow="hover">
        <div class="post-header">
          <el-avatar :src="getFullAvatarUrl(post.user_avatar)" :size="40" class="user-avatar" @click="$router.push(`/profile/${post.user_id}`)">
            {{ post.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-info">
            <span class="username" @click="$router.push(`/profile/${post.user_id}`)">{{ post.username }}</span>
            <span class="time">{{ formatTime(post.created_at) }}</span>
          </div>
          <el-tag v-if="post.flower_name" size="small" type="success" effect="plain" class="flower-tag">#{{ post.flower_name }}</el-tag>
        </div>
        
        <div class="post-topics" v-if="post.topics && post.topics.length">
          <el-tag v-for="topic in post.topics" :key="topic" size="small" type="warning" class="topic-item">#{{ topic }}</el-tag>
        </div>
        
        <div class="post-content" v-html="formatContent(post.content)"></div>
        
        <div class="post-video" v-if="post.video_url">
          <video :src="getFullImageUrl(post.video_url)" controls class="post-video-player"></video>
        </div>
        
        <div class="post-images" :class="getImageGridClass(post.images?.length)" v-if="post.images && post.images.length">
          <div v-for="(img, idx) in post.images.slice(0, 9)" :key="idx" class="image-wrapper" @click="previewImages(post.images, idx)">
            <el-image :src="getFullImageUrl(img)" fit="cover" class="post-image" />
            <div v-if="idx === 8 && post.images.length > 9" class="image-more">+{{ post.images.length - 9 }}</div>
          </div>
        </div>
        
        <div class="post-actions">
          <span class="action-item" :class="{ active: post.is_liked }" @click="toggleLike(post)">
            <svg class="action-icon" :class="{ 'is-filled': post.is_liked }"><use :href="post.is_liked ? '#heart-filled-icon' : '#heart-icon'"/></svg>{{ post.likes_count || 0 }}
          </span>
          <span class="action-item" :class="{ active: post.is_favorited, favorited: post.is_favorited }" @click="toggleFavorite(post)">
            <svg class="action-icon" :class="{ 'is-star-filled': post.is_favorited }"><use :href="post.is_favorited ? '#star-filled-icon' : '#star-icon'"/></svg>{{ post.favorites_count || 0 }}
          </span>
          <span class="action-item" @click="showComments(post)">
            <el-icon><ChatDotRound /></el-icon>{{ post.comments_count || 0 }}
          </span>
          <span class="action-item" @click="sharePost(post)"><el-icon><Share /></el-icon></span>
          <span class="action-item" @click="deletePost(post)" v-if="isOwnPost(post)"><el-icon><Delete /></el-icon></span>
        </div>
        
        <div class="comments-section" v-if="post.showComments">
          <div class="comments-list">
            <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
              <el-avatar :size="28" :src="getFullAvatarUrl(comment.user_avatar)"><{{ comment.username?.charAt(0)?.toUpperCase() }}</el-avatar>
              <div class="comment-content">
                <span class="comment-user">{{ comment.username }}</span>
                <span class="comment-text">{{ comment.content }}</span>
              </div>
            </div>
          </div>
          <div class="comment-input">
            <el-input v-model="post.newComment" placeholder="写评论..." size="small" @keyup.enter="submitComment(post)">
              <template #append><el-button @click="submitComment(post)" :loading="post.commentLoading">发送</el-button></template>
            </el-input>
          </div>
        </div>
      </el-card>
      
      <div v-if="posts.length > 0" class="load-more">
        <el-button v-if="hasMore" @click="loadMore" :loading="loadingMore">加载更多</el-button>
        <span v-else class="no-more">没有更多了</span>
      </div>
    </div>

    <!-- 发布对话框 -->
    <el-dialog v-model="showPostDialog" title="发布动态" width="700px" :close-on-click-modal="false">
      <div class="post-editor">
        <div class="editor-toolbar">
          <el-button-group>
            <el-button size="small" @click="insertFormat('bold')"><b>B</b></el-button>
            <el-button size="small" @click="insertFormat('italic')"><i>I</i></el-button>
            <el-button size="small" @click="insertFormat('underline')"><u>U</u></el-button>
          </el-button-group>
        </div>
        
        <div ref="editorRef" class="rich-editor" contenteditable="true" data-placeholder="分享你的养花心得...输入 # 插入话题" @input="handleEditorInput"></div>
        
        <div class="draft-status" v-if="isDraftSaving"><el-icon class="is-loading"><Loading /></el-icon>保存中...</div>
        <div class="draft-status" v-else-if="lastDraftTime">草稿已保存 {{ formatTime(lastDraftTime) }}</div>
        
        <div class="media-upload-section">
          <div class="upload-tabs">
            <el-button :type="uploadTab === 'image' ? 'primary' : 'default'" size="small" @click="uploadTab = 'image'">
              <el-icon><Picture /></el-icon>图片 ({{ uploadedImages.length }}/9)
            </el-button>
            <el-button :type="uploadTab === 'video' ? 'primary' : 'default'" size="small" @click="uploadTab = 'video'">
              <el-icon><VideoCamera /></el-icon>视频
            </el-button>
          </div>
          
          <div class="upload-grid" v-show="uploadTab === 'image'">
            <div v-for="(img, idx) in uploadedImages" :key="idx" class="uploaded-image">
              <el-image :src="getImagePreviewUrl(img)" fit="cover" />
              <el-icon class="remove-icon" @click="removeImage(idx)"><Close /></el-icon>
            </div>
            <el-upload v-if="uploadedImages.length < 9" class="image-uploader" :show-file-list="false" :before-upload="beforeImageUpload" :http-request="uploadImage" accept="image/*" multiple>
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">添加图片</div>
            </el-upload>
          </div>
          
          <div class="video-upload-area" v-show="uploadTab === 'video'">
            <el-upload v-if="!uploadedVideo" class="video-uploader" :show-file-list="false" :before-upload="beforeVideoUpload" :http-request="uploadVideo" accept="video/*">
              <el-icon class="upload-icon"><VideoCamera /></el-icon>
              <div class="upload-text">点击上传视频</div>
              <div class="upload-tip">支持 15秒-3分钟 视频</div>
            </el-upload>
            <div v-else class="uploaded-video">
              <video :src="getImagePreviewUrl(uploadedVideo)" controls class="video-preview"></video>
              <el-button type="danger" size="small" @click="uploadedVideo = null">删除视频</el-button>
            </div>
          </div>
        </div>
        
        <el-form :model="postForm" label-width="80px" size="small" class="association-settings">
          <el-form-item label="关联花卉">
            <el-input v-model="postForm.searchKeyword" placeholder="搜索关联的花卉..." @input="searchFlowers" clearable>
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <div class="flower-suggestions" v-if="flowerSuggestions.length">
              <div v-for="f in flowerSuggestions" :key="f.id" class="suggestion-item" @click="selectFlower(f)">
                {{ f.chinese_name || f.latin_name }}
              </div>
            </div>
            <el-tag v-if="postForm.flower_name" closable @close="postForm.flower_name = ''; postForm.flower_id = null" class="selected-tag">{{ postForm.flower_name }}</el-tag>
          </el-form-item>
          <el-form-item label="话题">
            <el-select v-model="postForm.topics" multiple filterable allow-create default-first-option placeholder="添加话题标签" style="width: 100%">
              <el-option v-for="topic in commonTopics" :key="topic" :label="topic" :value="topic" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button @click="showPostDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPost" :loading="submitting">发布</el-button>
      </template>
    </el-dialog>

    <!-- 草稿箱 -->
    <el-dialog v-model="showDrafts" title="草稿箱" width="600px">
      <div class="drafts-list" v-if="drafts.length > 0">
        <el-card v-for="(draft, idx) in drafts" :key="idx" class="draft-item">
          <div class="draft-content">{{ draft.content?.substring(0, 100) || '空白草稿' }}...</div>
          <div class="draft-meta"><span>{{ formatTime(draft.updatedAt) }}</span><span v-if="draft.images?.length">{{ draft.images.length }}张图片</span></div>
          <div class="draft-actions">
            <el-button size="small" type="primary" @click="loadDraft(draft)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteDraft(idx)">删除</el-button>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="草稿箱是空的" />
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog v-model="showImagePreview" width="80%">
      <div class="preview-container">
        <el-image v-for="(img, idx) in previewImagesList" :key="idx" :src="getFullImageUrl(img)" fit="contain" class="preview-image" :style="{ display: idx === previewIndex ? 'block' : 'none' }" />
      </div>
      <div class="preview-actions">
        <el-button @click="previewIndex = Math.max(0, previewIndex - 1)">上一张</el-button>
        <span>{{ previewIndex + 1 }} / {{ previewImagesList.length }}</span>
        <el-button @click="previewIndex = Math.min(previewImagesList.length - 1, previewIndex + 1)">下一张</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Star, StarFilled, ChatDotRound, Delete, Share, Picture, VideoCamera, Close, Loading, DocumentChecked, Search } from '@element-plus/icons-vue'

const route = useRoute()
const API_BASE = 'http://127.0.0.1:5000/api'
const ENCYCLOPEDIA_API = 'http://127.0.0.1:5000/api/encyclopedia'
const IMAGE_BASE = 'http://127.0.0.1:5000'
const DRAFT_KEY = 'flower_platform_drafts'

const loading = ref(false), loadingMore = ref(false), posts = ref([]), showPostDialog = ref(false)
const submitting = ref(false), flowerSuggestions = ref([]), currentUserId = ref(''), currentPage = ref(1), hasMore = ref(true)
const isAdmin = ref(false), showDrafts = ref(false), drafts = ref([]), draftCount = ref(0), isDraftSaving = ref(false)
const lastDraftTime = ref(null), editorRef = ref(null), uploadTab = ref('image'), uploadedImages = ref([]), uploadedVideo = ref(null)
const showImagePreview = ref(false), previewImagesList = ref([]), previewIndex = ref(0)

const commonTopics = ['养花心得', '花卉摄影', '新手养护', '阳台花园', '花园改造', '植物急救', '扦插繁殖', '换盆换土', '病虫防治', '四季养护']

const postForm = ref({ content: '', flower_id: null, flower_name: '', searchKeyword: '', topics: [], mentions: [] })

const isOwnPost = (post) => post.user_id === currentUserId.value

const fetchPosts = async () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  if (user) { const userData = JSON.parse(user); currentUserId.value = userData.id; isAdmin.value = userData.is_admin === 1 }
  loading.value = true
  try {
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (currentUserId.value) headers['X-User-Id'] = currentUserId.value
    const response = await fetch(`${API_BASE}/community/posts?page=1&page_size=10`, { headers })
    const data = await response.json()
    if (data.success) {
      posts.value = data.data.posts.map(p => ({ ...p, showComments: false, comments: [], newComment: '', commentLoading: false }))
      hasMore.value = data.data.page < data.data.total_pages
      currentPage.value = 1
    }
  } catch { ElMessage.error('获取动态失败') } finally { loading.value = false }
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (currentUserId.value) headers['X-User-Id'] = currentUserId.value
    const response = await fetch(`${API_BASE}/community/posts?page=${currentPage.value + 1}&page_size=10`, { headers })
    const data = await response.json()
    if (data.success) {
      const newPosts = data.data.posts.map(p => ({ ...p, showComments: false, comments: [], newComment: '', commentLoading: false }))
      posts.value = [...posts.value, ...newPosts]
      hasMore.value = data.data.page < data.data.total_pages
      currentPage.value = data.data.page
    }
  } catch { ElMessage.error('加载失败') } finally { loadingMore.value = false }
}

const openPostDialog = () => {
  const token = localStorage.getItem('token')
  if (!token) { ElMessage.warning('请先登录'); return }
  showPostDialog.value = true
  nextTick(() => { loadDrafts() })
}

const resetEditor = () => {
  if (editorRef.value) editorRef.value.innerHTML = ''
  uploadedImages.value = []
  uploadedVideo.value = null
  postForm.value = { content: '', flower_id: null, flower_name: '', searchKeyword: '', topics: [], mentions: [] }
}

const insertFormat = (command) => { document.execCommand(command, false, null); editorRef.value?.focus() }
const handleEditorInput = () => { if (editorRef.value) { postForm.value.content = editorRef.value.innerHTML; autoSaveDraft() } }

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件')
  if (!isLt5M) ElMessage.error('图片大小不能超过 5MB')
  return isImage && isLt5M
}

const uploadImage = async ({ file }) => {
  const formData = new FormData()
  formData.append('image', file)
  try {
    const response = await fetch(`${API_BASE}/community/upload/image`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData
    })
    const data = await response.json()
    if (data.success) { uploadedImages.value.push(data.url); autoSaveDraft(); ElMessage.success('图片上传成功') }
    else ElMessage.error(data.error || '上传失败')
  } catch { ElMessage.error('上传失败') }
}

const removeImage = (idx) => { uploadedImages.value.splice(idx, 1); autoSaveDraft() }
const beforeVideoUpload = (file) => file.type.startsWith('video/') && file.size / 1024 / 1024 < 100

const uploadVideo = async ({ file }) => {
  const formData = new FormData()
  formData.append('video', file)
  try {
    const response = await fetch(`${API_BASE}/community/upload/video`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData
    })
    const data = await response.json()
    if (data.success) { uploadedVideo.value = data.url; autoSaveDraft(); ElMessage.success('视频上传成功') }
    else ElMessage.error(data.error || '上传失败')
  } catch { ElMessage.error('上传失败') }
}

const loadDrafts = () => {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) { try { drafts.value = JSON.parse(saved); draftCount.value = drafts.value.length } catch { drafts.value = [] } }
}

const autoSaveDraft = () => {
  isDraftSaving.value = true
  clearTimeout(window.draftTimer)
  window.draftTimer = setTimeout(() => {
    const content = editorRef.value?.innerHTML || ''
    if (content.trim() || uploadedImages.value.length > 0 || uploadedVideo.value) {
      const draft = { content, images: uploadedImages.value, video: uploadedVideo.value, flower_id: postForm.value.flower_id, flower_name: postForm.value.flower_name, topics: postForm.value.topics, mentions: postForm.value.mentions, updatedAt: new Date().toISOString() }
      const existingDrafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]')
      existingDrafts[0] = draft
      localStorage.setItem(DRAFT_KEY, JSON.stringify(existingDrafts))
      drafts.value = existingDrafts
      lastDraftTime.value = new Date().toISOString()
    }
    isDraftSaving.value = false
  }, 1500)
}

const saveDraft = () => { autoSaveDraft(); ElMessage.success('草稿已保存'); showPostDialog.value = false }

const loadDraft = (draft) => {
  if (editorRef.value) editorRef.value.innerHTML = draft.content || ''
  uploadedImages.value = draft.images || []
  uploadedVideo.value = draft.video || null
  postForm.value = { content: draft.content || '', flower_id: draft.flower_id, flower_name: draft.flower_name || '', searchKeyword: '', topics: draft.topics || [], mentions: draft.mentions || [] }
  showDrafts.value = false
  showPostDialog.value = true
}

const deleteDraft = (idx) => { drafts.value.splice(idx, 1); localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts.value)); draftCount.value = drafts.value.length; ElMessage.success('草稿已删除') }

const searchFlowers = async () => {
  if (!postForm.value.searchKeyword || postForm.value.searchKeyword.length < 1) { flowerSuggestions.value = []; return }
  try {
    const response = await fetch(`${ENCYCLOPEDIA_API}/search?keyword=${encodeURIComponent(postForm.value.searchKeyword)}&page_size=5`)
    const data = await response.json()
    if (data.success) flowerSuggestions.value = data.data.flowers
  } catch {}
}

const selectFlower = (flower) => { postForm.value.flower_id = flower.id; postForm.value.flower_name = flower.chinese_name || flower.latin_name; flowerSuggestions.value = [] }

const submitPost = async () => {
  const token = localStorage.getItem('token')
  if (!token) { ElMessage.warning('请先登录'); return }
  const content = editorRef.value?.innerText?.trim() || editorRef.value?.innerHTML?.trim()
  if (!content) { ElMessage.warning('请输入内容'); return }
  submitting.value = true
  try {
    const response = await fetch(`${API_BASE}/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        content: editorRef.value?.innerHTML || '',
        flower_id: postForm.value.flower_id, flower_name: postForm.value.flower_name,
        images: uploadedImages.value, video_url: uploadedVideo.value,
        topics: postForm.value.topics, mentions: postForm.value.mentions
      })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('发布成功')
      showPostDialog.value = false
      resetEditor()
      deleteDraft(0)
      fetchPosts()
    } else ElMessage.error(data.error || '发布失败')
  } catch { ElMessage.error('发布失败') } finally { submitting.value = false }
}

const toggleLike = async (post) => {
  const token = localStorage.getItem('token')
  if (!token) { ElMessage.warning('请先登录'); return }
  try {
    const response = await fetch(`${API_BASE}/community/posts/${post.id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
    const data = await response.json()
    if (data.success) { post.is_liked = data.liked; post.likes_count = data.likes_count }
    else ElMessage.error(data.error || '操作失败')
  } catch { ElMessage.error('操作失败') }
}

const toggleFavorite = async (post) => {
  const token = localStorage.getItem('token')
  if (!token) { ElMessage.warning('请先登录'); return }
  try {
    const response = await fetch(`${API_BASE}/community/posts/${post.id}/favorite`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
    const data = await response.json()
    if (data.success) { 
      post.is_favorited = data.favorited; 
      post.favorites_count = data.favorites_count
      ElMessage.success(data.favorited ? '已收藏' : '已取消收藏')
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch { ElMessage.error('操作失败') }
}

const showComments = async (post) => {
  if (post.showComments) { post.showComments = false; return }
  post.showComments = true
  if (post.comments.length === 0) {
    try {
      const response = await fetch(`${API_BASE}/community/posts/${post.id}/comments`)
      const data = await response.json()
      if (data.success) post.comments = data.data.comments
    } catch {}
  }
}

const submitComment = async (post) => {
  const token = localStorage.getItem('token')
  if (!token) { ElMessage.warning('请先登录'); return }
  if (!post.newComment.trim()) return
  post.commentLoading = true
  try {
    const response = await fetch(`${API_BASE}/community/posts/${post.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: post.newComment })
    })
    const data = await response.json()
    if (data.success) { post.newComment = ''; showComments(post); post.comments_count = (post.comments_count || 0) + 1 }
  } catch {} finally { post.commentLoading = false }
}

const deletePost = async (post) => {
  try {
    await ElMessageBox.confirm('确定删除这条动态吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/community/posts/${post.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    const data = await response.json()
    if (data.success) { ElMessage.success('已删除'); posts.value = posts.value.filter(p => p.id !== post.id) }
  } catch {}
}

const sharePost = (post) => { navigator.clipboard.writeText(window.location.origin + '/post/' + post.id).then(() => ElMessage.success('链接已复制')) }

const previewImages = (images, index) => { previewImagesList.value = images; previewIndex.value = index; showImagePreview.value = true }

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time), now = new Date(), diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString()
}

const getFullImageUrl = (url) => { if (!url) return ''; if (url.startsWith('http')) return url; return IMAGE_BASE + url }
const getFullAvatarUrl = (url) => { if (!url) return ''; if (url.startsWith('http')) return url; return IMAGE_BASE + url }
const getImagePreviewUrl = (url) => url instanceof File ? URL.createObjectURL(url) : getFullImageUrl(url)
const formatContent = (content) => { if (!content) return ''; return content.replace(/#(\w+)/g, '<span class="topic-link">#$1</span>').replace(/@(\w+)/g, '<span class="mention-link">@$1</span>') }
const getImageGridClass = (count) => { if (!count) return ''; if (count === 1) return 'grid-1'; if (count === 2) return 'grid-2'; if (count === 4) return 'grid-4'; return 'grid-9' }

onMounted(() => { fetchPosts(); loadDrafts() })
onUnmounted(() => { clearTimeout(window.draftTimer) })
</script>

<style scoped>
.community-container { padding: 20px; min-height: calc(100vh - 120px); background: #f5f7fa; }
.header-card { margin-bottom: 16px; }
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 12px; }
.title { font-size: 20px; font-weight: 600; }
.draft-alert { margin-bottom: 16px; }
.draft-link { color: #409eff; cursor: pointer; text-decoration: underline; }
.posts-list { max-width: 700px; margin: 0 auto; }
.post-card { margin-bottom: 16px; }
.post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.user-avatar { cursor: pointer; }
.user-info { flex: 1; display: flex; flex-direction: column; }
.username { font-weight: 500; color: #303133; cursor: pointer; }
.username:hover { color: #409eff; }
.time { font-size: 12px; color: #909399; }
.post-topics { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.topic-item { cursor: pointer; }
.post-content { font-size: 15px; line-height: 1.7; color: #303133; margin-bottom: 12px; }
.post-content :deep(.topic-link) { color: #e6a23c; }
.post-content :deep(.mention-link) { color: #409eff; }
.post-video { margin-bottom: 12px; }
.post-video-player { width: 100%; max-height: 400px; border-radius: 8px; }
.post-images { display: grid; gap: 4px; margin-bottom: 12px; }
.post-images.grid-1 { grid-template-columns: 1fr; }
.post-images.grid-2 { grid-template-columns: repeat(2, 1fr); }
.post-images.grid-4 { grid-template-columns: repeat(2, 1fr); }
.post-images.grid-9 { grid-template-columns: repeat(3, 1fr); }
.image-wrapper { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 4px; cursor: pointer; }
.post-image { width: 100%; height: 100%; }
.image-more { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
.post-actions { display: flex; gap: 24px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.action-item { display: flex; align-items: center; gap: 4px; color: #909399; cursor: pointer; font-size: 14px; transition: color 0.2s; }
.action-item:hover, .action-item.active { color: #409eff; }
.action-item.favorited { color: #F59E0B; }
.action-icon { width: 18px; height: 18px; fill: currentColor; transition: fill 0.2s, transform 0.2s; display: inline-block; vertical-align: middle; }
.action-icon:hover { transform: scale(1.1); }
.action-icon.is-filled { fill: #E53E3E; }
.action-icon.is-star-filled { fill: #F59E0B; }
.comments-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
.comments-list { margin-bottom: 12px; max-height: 300px; overflow-y: auto; }
.comment-item { display: flex; gap: 8px; margin-bottom: 12px; }
.comment-content { flex: 1; }
.comment-user { font-weight: 500; color: #303133; margin-right: 8px; }
.comment-text { color: #606266; font-size: 14px; }
.load-more { text-align: center; padding: 20px; }
.no-more { color: #909399; }
.post-editor { display: flex; flex-direction: column; gap: 12px; }
.editor-toolbar { display: flex; gap: 8px; padding: 8px; border: 1px solid #dcdfe6; border-bottom: none; border-radius: 4px 4px 0 0; background: #fafafa; }
.rich-editor { min-height: 120px; max-height: 250px; overflow-y: auto; border: 1px solid #dcdfe6; border-radius: 0 0 4px 4px; padding: 12px; font-size: 15px; line-height: 1.7; outline: none; }
.rich-editor:empty:before { content: attr(data-placeholder); color: #aaa; pointer-events: none; }
.draft-status { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 4px; }
.media-upload-section { border: 1px solid #dcdfe6; border-radius: 4px; padding: 12px; }
.upload-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.upload-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.uploaded-image { position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; }
.uploaded-image :deep(.el-image) { width: 100%; height: 100%; }
.remove-icon { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; padding: 4px; cursor: pointer; }
.image-uploader { aspect-ratio: 1; border: 2px dashed #dcdfe6; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
.image-uploader:hover { border-color: #409eff; }
.upload-icon { font-size: 28px; color: #909399; }
.upload-text { font-size: 12px; color: #909399; margin-top: 4px; }
.upload-tip { font-size: 12px; color: #909399; margin-top: 8px; }
.video-uploader { padding: 40px; border: 2px dashed #dcdfe6; border-radius: 8px; text-align: center; cursor: pointer; }
.video-uploader:hover { border-color: #409eff; }
.uploaded-video { text-align: center; }
.video-preview { width: 100%; max-height: 250px; border-radius: 8px; }
.association-settings { margin-top: 12px; }
.flower-suggestions { border: 1px solid #dcdfe6; border-radius: 4px; margin-top: 8px; max-height: 120px; overflow-y: auto; }
.suggestion-item { padding: 8px 12px; cursor: pointer; font-size: 14px; }
.suggestion-item:hover { background: #f5f7fa; }
.selected-tag { margin-top: 8px; }
.drafts-list { display: flex; flex-direction: column; gap: 12px; }
.draft-item { cursor: pointer; }
.draft-content { font-size: 14px; color: #606266; margin-bottom: 8px; line-height: 1.5; }
.draft-meta { display: flex; justify-content: space-between; font-size: 12px; color: #909399; margin-bottom: 8px; }
.draft-actions { display: flex; gap: 8px; justify-content: flex-end; }
.preview-container { background: #000; min-height: 400px; display: flex; align-items: center; justify-content: center; }
.preview-image { max-width: 100%; max-height: 70vh; }
.preview-actions { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; background: #fff; }
</style>
