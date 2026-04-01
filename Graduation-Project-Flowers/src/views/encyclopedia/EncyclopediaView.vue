<template>
  <div class="encyclopedia-container">
    <!-- 顶部搜索和筛选 -->
    <el-card class="search-card">
      <template #header>
        <div class="header-row">
          <span>植物百科</span>
          <el-tag type="success" effect="light">知识库 · 120种花卉</el-tag>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索植物名称，例如：月季、玫瑰"
            clearable
            :prefix-icon="Search"
          />
        </el-col>
        <el-col :xs="24" :md="6">
          <el-select v-model="selectedCategory" placeholder="花卉类别" clearable class="full-width">
            <el-option label="春季花卉" :value="1" />
            <el-option label="夏季花卉" :value="2" />
            <el-option label="秋季花卉" :value="3" />
            <el-option label="冬季花卉" :value="4" />
            <el-option label="全年花卉" :value="5" />
          </el-select>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-select v-model="selectedFamily" placeholder="按科属筛选" clearable class="full-width" filterable>
            <el-option
              v-for="family in uniqueFamilies"
              :key="family"
              :label="family"
              :value="family"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 统计信息 -->
    <div class="stats-row">
      <el-statistic title="共收录" :value="filteredFlowers.length" suffix="种花卉" />
      <el-statistic title="筛选结果" :value="filteredFlowers.length" suffix="种" />
    </div>

    <!-- 花卉卡片网格 -->
    <div class="flowers-grid" v-if="filteredFlowers.length > 0">
      <el-card
        v-for="flower in paginatedFlowers"
        :key="flower.id"
        class="flower-card"
        shadow="hover"
        @click="showFlowerDetail(flower)"
      >
        <template #header>
          <div class="flower-header">
            <span class="flower-name">{{ flower.chinese_name }}</span>
            <el-tag size="small" type="info">{{ flower.family }}</el-tag>
          </div>
        </template>

        <div class="flower-content">
          <p class="flower-latin">{{ flower.latin_name }}</p>
          <p class="flower-genus">{{ flower.genus }}</p>

          <div class="flower-tags">
            <el-tag size="small" type="info" effect="plain">
              <el-icon><Sunny /></el-icon>
              {{ flower.growth_habit?.includes('阳光') ? '喜阳' : '耐阴' }}
            </el-tag>
          </div>

          <p class="flower-desc">{{ flower.morphology }}</p>

          <div class="flower-languages">
            <span class="language-label">花语：</span>
            <span class="language-text">{{ flower.flower_language }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 无结果 -->
    <el-empty v-else description="未找到匹配的花卉" />

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="filteredFlowers.length > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredFlowers.length"
        layout="prev, pager, next"
        background
      />
    </div>

    <!-- 花卉详情对话框 -->
    <el-dialog v-model="dialogVisible" width="700px" destroy-on-close>
      <template #header>
        <div v-if="selectedFlower">
          <h2>{{ selectedFlower.chinese_name }}</h2>
          <p class="dialog-subtitle">{{ selectedFlower.latin_name }}</p>
        </div>
      </template>

      <div v-if="selectedFlower" class="flower-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="中文名">{{ selectedFlower.chinese_name }}</el-descriptions-item>
          <el-descriptions-item label="拉丁名">{{ selectedFlower.latin_name }}</el-descriptions-item>
          <el-descriptions-item label="科">{{ selectedFlower.family }}</el-descriptions-item>
          <el-descriptions-item label="属">{{ selectedFlower.genus }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4>形态特征</h4>
          <p>{{ selectedFlower.morphology }}</p>
        </div>

        <div class="detail-section">
          <h4>生长环境</h4>
          <p>{{ selectedFlower.habitat }}</p>
        </div>

        <div class="detail-section">
          <h4>生长习性</h4>
          <p>{{ selectedFlower.growth_habit }}</p>
        </div>

        <div class="detail-section">
          <h4>观赏价值</h4>
          <p>{{ selectedFlower.ornamental_value }}</p>
        </div>

        <div class="detail-section">
          <h4>养护方法</h4>
          <p>{{ selectedFlower.care_methods }}</p>
        </div>

        <div class="detail-section">
          <h4>花语</h4>
          <el-tag type="success" size="large">{{ selectedFlower.flower_language }}</el-tag>
        </div>

        <div class="detail-section">
          <el-divider />
          <p class="data-source">数据来源：{{ selectedFlower.data_source }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Sunny } from '@element-plus/icons-vue'
import flowersData120 from '@/data/flowers_data_120.json'

// 搜索和筛选
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedFamily = ref('')

// 分页
const currentPage = ref(1)
const pageSize = 12

// 详情对话框
const dialogVisible = ref(false)
const selectedFlower = ref(null)

// 花卉数据
const flowers = ref([])

// 获取唯一的科属列表
const uniqueFamilies = computed(() => {
  const families = flowers.value.map(f => f.family)
  return [...new Set(families)].sort()
})

// 挂载时加载数据
onMounted(() => {
  if (flowersData120 && flowersData120.flowers) {
    flowers.value = flowersData120.flowers
  }
})

// 筛选后的花卉
const filteredFlowers = computed(() => {
  let result = [...flowers.value]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(flower =>
      flower.chinese_name.toLowerCase().includes(keyword) ||
      flower.latin_name.toLowerCase().includes(keyword) ||
      flower.family.toLowerCase().includes(keyword) ||
      flower.genus.toLowerCase().includes(keyword)
    )
  }

  // 科属筛选
  if (selectedFamily.value) {
    result = result.filter(flower => flower.family === selectedFamily.value)
  }

  return result
})

// 分页后的花卉
const paginatedFlowers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredFlowers.value.slice(start, start + pageSize)
})

// 显示花卉详情
const showFlowerDetail = (flower) => {
  selectedFlower.value = flower
  dialogVisible.value = true
}
</script>

<style scoped>
.encyclopedia-container {
  padding: 16px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.full-width {
  width: 100%;
}

.search-card {
  margin-bottom: 16px;
}

.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.flowers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.flower-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.flower-card:hover {
  transform: translateY(-4px);
}

.flower-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flower-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.flower-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flower-latin {
  color: #909399;
  font-size: 14px;
  font-style: italic;
  margin: 0;
}

.flower-genus {
  color: #606266;
  font-size: 13px;
  margin: 0;
}

.flower-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.flower-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.flower-languages {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ebeef5;
}

.language-label {
  color: #909399;
  font-size: 12px;
}

.language-text {
  color: #67c23a;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.dialog-subtitle {
  color: #909399;
  margin: 4px 0 0 0;
  font-size: 14px;
  font-style: italic;
}

.flower-detail {
  padding: 8px 0;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  border-left: 3px solid #67c23a;
  padding-left: 8px;
}

.detail-section p {
  color: #606266;
  line-height: 1.8;
  margin: 0;
}

.data-source {
  color: #909399;
  font-size: 12px;
  text-align: right;
}
</style>
