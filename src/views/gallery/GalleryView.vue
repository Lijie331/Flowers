<script setup>
const mockImages = [
  { name: '月季', tag: '观花' },
  { name: '绿萝', tag: '观叶' },
  { name: '多肉', tag: '耐旱' },
  { name: '绣球', tag: '庭院' },
  { name: '兰花', tag: '室内' },
  { name: '向日葵', tag: '阳光' },
]
</script>

<template>
  <el-space direction="vertical" :size="16" fill>
    <el-card>
      <template #header>
        <div class="header-row">
          <span>花卉图库</span>
          <el-button type="primary">上传图片</el-button>
        </div>
      </template>
      <el-text type="info">后续可接入真实图片数据源和筛选功能。</el-text>
    </el-card>

    <el-row :gutter="16">
      <el-col v-for="item in mockImages" :key="item.name" :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="img-card">
          <el-skeleton :rows="3" animated />
          <div class="meta">
            <span>{{ item.name }}</span>
            <el-tag size="small">{{ item.tag }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-space>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.img-card .meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
