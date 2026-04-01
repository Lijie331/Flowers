<template>
  <el-space direction="vertical" :size="16" fill>
    <el-card>
      <template #header>
        <div class="header-row">
          <span>社区</span>
          <el-button type="primary">发布动态</el-button>
        </div>
      </template>
      <el-input type="textarea" :rows="3" placeholder="分享你的养护经验、开花成果或问题..." />
    </el-card>

    <el-card>
      <el-timeline>
        <el-timeline-item timestamp="刚刚" type="success">
          今天给月季修剪了残花，准备追肥。
        </el-timeline-item>
        <el-timeline-item timestamp="1小时前">
          我的绿萝叶片发黄，大家建议先检查浇水频率。
        </el-timeline-item>
        <el-timeline-item timestamp="昨天"> 晒一组阳台花园照片。 </el-timeline-item>
      </el-timeline>
    </el-card>
  </el-space>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
