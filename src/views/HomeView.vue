<script setup>
const quickEntries = [
  { title: '植物百科', desc: '分类、习性和花期资料', path: '/encyclopedia' },
  { title: '花卉图库', desc: '图像浏览和详情展示', path: '/gallery' },
  { title: '植物识别', desc: '上传图片后快速识别', path: '/identify' },
  { title: '社区交流', desc: '分享养护经验和动态', path: '/community' },
  { title: '我的花园', desc: '记录植物成长和管理养护', path: '/garden' },
]
</script>

<template>
  <el-space direction="vertical" :size="16" fill>
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>主页</span>
          <el-tag type="success">Flower Hub</el-tag>
        </div>
      </template>
      <el-text>欢迎来到花卉平台，你可以通过下方入口进入各模块。</el-text>
    </el-card>

    <el-row :gutter="16">
      <el-col v-for="item in quickEntries" :key="item.path" :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="entry-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
          <el-button type="primary" link @click="$router.push(item.path)">进入模块</el-button>
        </el-card>
      </el-col>
    </el-row>
  </el-space>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.entry-card h3 {
  margin: 0 0 8px;
}

.entry-card p {
  margin: 0 0 12px;
  color: #606266;
}
</style>
