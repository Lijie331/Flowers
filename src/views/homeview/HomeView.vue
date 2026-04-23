<script setup>
import { ArrowRight } from '@element-plus/icons-vue'

const quickEntries = [
  { title: '植物百科', desc: '分类、习性和花期资料', path: '/encyclopedia' },
  { title: '花卉图库', desc: '图像浏览和详情展示', path: '/gallery' },
  { title: '植物识别', desc: '上传图片后快速识别', path: '/identify' },
  { title: '社区交流', desc: '分享养护经验和动态', path: '/community' },
  { title: '我的花园', desc: '记录植物成长和管理养护', path: '/garden' },
]

const newsList = [
  {
    id: 1,
    title: '三角梅施肥技巧大全',
    date: '2026-03-13',
    summary:
      '三角梅施肥技巧大全，学会这几点，四季花开不断',
    tag: '养护技巧',
    url: 'https://www.china-flower.com/newsinfo/11119712.html',
  },
  {
    id: 2,
    title: '春季养花必知的五个要点',
    date: '2026-03-12',
    summary:
      '春季养花必知的五个要点，新手也能养出漂亮花',
    tag: '室内植物',
    url: 'https://www.china-flower.com/newsinfo/10755393.html',
  },
  {
    id: 3,
    title: '茶花养殖方法和注意事项',
    date: '2026-03-10',
    summary:
      '茶花养殖方法和注意事项，简单实用的养殖技巧',
    tag: '科研动态',
    url: 'https://www.china-flower.com/newsinfo/8140098.html',
  },
  {
    id: 4,
    title: '家里养殖三角梅的常见问题',
    date: '2026-03-08',
    summary:
      '家里养殖三角梅的常见问题及其解决方法',
    tag: '多肉植物',
    url: 'https://www.china-flower.com/newsinfo/10990063.html',
  },
]
</script>

<template>
  <div class="home-container">
    <!-- 欢迎卡片 -->
    <el-card shadow="hover" class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>主页</span>
          <el-tag type="success">Flower Hub</el-tag>
        </div>
      </template>
      <el-text>欢迎来到花卉平台，你可以通过侧边入口进入各模块。</el-text>
    </el-card>

    <!-- 主内容区 -->
    <el-row :gutter="20">
      <!-- 左侧快速入口 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="7" :xl="6" class="sidebar-col">
        <el-card shadow="hover" class="sidebar-card">
          <template #header>
            <div class="card-header">
              <span>快速入口</span>
            </div>
          </template>
          <div class="quick-entries-container">
            <el-card
              v-for="item in quickEntries"
              :key="item.path"
              shadow="hover"
              class="entry-card"
              @click="$router.push(item.path)"
            >
              <div class="entry-content">
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
                <el-icon class="entry-icon">
                  <ArrowRight />
                </el-icon>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧新闻内容 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="17" :xl="18">
        <el-card shadow="hover" class="news-card">
          <template #header>
            <div class="card-header">
              <span>植物新闻</span>
              <el-button type="primary" text>查看更多</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="news in newsList"
              :key="news.id"
              :timestamp="news.date"
              placement="top"
              type="primary"
            >
              <el-card class="news-item" shadow="hover">
                <a :href="news.url" target="_blank" class="news-content">
                  <div class="news-title">
                    <h4>{{ news.title }}</h4>
                    <el-tag size="small" type="success">{{ news.tag }}</el-tag>
                  </div>
                  <p class="news-summary">{{ news.summary }}</p>
                </a>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home-container {
  width: 100%;
}

.welcome-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-card {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

.sidebar-col {
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .sidebar-col {
    margin-bottom: 0;
  }
}

.quick-entries-container {
  width: 100%;
}

.entry-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  margin-bottom: 8px;
  width: 100%;
}

.entry-card:last-child {
  margin-bottom: 0;
}

.entry-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.entry-content {
  position: relative;
  padding-right: 32px;
}

.entry-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.entry-content p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.entry-icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  transition: all 0.3s ease;
}

.entry-card:hover .entry-icon {
  color: #409eff;
  transform: translateY(-50%) translateX(4px);
}

.news-card {
  margin-bottom: 16px;
}

.news-item {
  margin-bottom: 0;
  transition: all 0.3s ease;
}

.news-item:hover {
  transform: translateY(-2px);
}

.news-content {
  display: block;
  padding: 4px 0;
  text-decoration: none;
  color: inherit;
}

.news-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.news-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.news-summary {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 13px;
}
</style>
