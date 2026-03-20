<template>
  <el-space direction="vertical" :size="16" fill>
    <el-card>
      <template #header>
        <div class="header-row">
          <span>植物百科</span>
          <el-tag type="success" effect="light">知识库</el-tag>
        </div>
      </template>

      <el-row :gutter="12">
        <el-col :xs="24" :md="16">
          <el-input placeholder="搜索植物名称，例如：月季" clearable />
        </el-col>
        <el-col :xs="24" :md="8">
          <el-select placeholder="选择分类" class="full-width">
            <el-option label="观花植物" value="flowering" />
            <el-option label="观叶植物" value="foliage" />
            <el-option label="多肉植物" value="succulent" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="示例植物">栀子</el-descriptions-item>
        <el-descriptions-item label="科属">茜草科栀子属</el-descriptions-item>
        <el-descriptions-item label="花期">5月-7月</el-descriptions-item>
        <el-descriptions-item label="养护难度">中等</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </el-space>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.full-width {
  width: 100%;
}
</style>
