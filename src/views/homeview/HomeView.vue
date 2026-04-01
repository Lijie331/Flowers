<script setup>
import { ArrowRight } from '@element-plus/icons-vue'

const quickEntries = [
  { title: '植物百科', desc: '分类、习性和花期资料', path: '/encyclopedia' },
  { title: '花卉图库', desc: '图像浏览和详情展示', path: '/gallery' },
  { title: '植物识别', desc: '上传图片后快速识别', path: '/identify' },
  { title: '社区交流', desc: '分享养护经验和动态', path: '/community' },
  { title: '植物养护', desc: '浇水、施肥和病虫害建议', path: '/care' },
]

const newsList = [
  {
    id: 1,
    title: '春季花卉养护指南：三月适合种植哪些花卉？',
    date: '2026-03-13',
    summary:
      '春季是种植花卉的最佳季节，本文为你推荐三月适合种植的花卉品种，包括郁金香、风信子、水仙等，并提供详细的养护技巧。',
    tag: '养护技巧',
  },
  {
    id: 2,
    title: '热门室内绿植排行榜，净化空气的最佳选择',
    date: '2026-03-12',
    summary:
      '室内绿植不仅能美化环境，还能净化空气。本文介绍最受欢迎的室内绿植，如绿萝、吊兰、虎皮兰等，让你轻松打造绿色家居。',
    tag: '室内植物',
  },
  {
    id: 3,
    title: '新发现！科学家培育出耐旱玫瑰品种',
    date: '2026-03-10',
    summary:
      '经过多年研究，农业科学家成功培育出一种耐旱玫瑰品种，能够在缺水环境下正常生长，为干旱地区的花卉种植带来了希望。',
    tag: '科研动态',
  },
  {
    id: 4,
    title: '多肉植物春季换盆攻略：时机与方法详解',
    date: '2026-03-08',
    summary:
      '春季是多肉植物换盆的最佳时期，本文详细介绍换盆的时机、方法和注意事项，帮助你让多肉植物健康成长。',
    tag: '多肉植物',
  },
  {
    id: 5,
    title: '花卉病虫害防治：常见问题及解决方案',
    date: '2026-03-05',
    summary:
      '花卉养护过程中常见的病虫害问题，如何预防和治疗？本文汇总了最常见的问题和对应的解决方案，让你轻松应对。',
    tag: '病虫害防治',
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
                <div class="news-content">
                  <div class="news-title">
                    <h4>{{ news.title }}</h4>
                    <el-tag size="small" type="success">{{ news.tag }}</el-tag>
                  </div>
                  <p class="news-summary">{{ news.summary }}</p>
                </div>
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
  padding: 4px 0;
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
