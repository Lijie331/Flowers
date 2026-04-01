<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activePath = computed(() => route.path)
</script>

<template>
  <el-container class="layout">
    <el-header class="layout-header">
      <div class="title-wrap">
        <span class="title">花卉平台</span>
      </div>

      <el-menu
        mode="horizontal"
        :default-active="activePath"
        router
        class="top-menu"
        :ellipsis="false"
      >
        <el-menu-item index="/">主页</el-menu-item>
        <el-menu-item index="/encyclopedia">百科</el-menu-item>
        <el-menu-item index="/gallery">图库</el-menu-item>
        <el-menu-item index="/identify">识别</el-menu-item>
        <el-menu-item index="/community">社区</el-menu-item>
        <el-menu-item index="/care">植物养护</el-menu-item>
      </el-menu>
    </el-header>

    <el-main class="layout-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6faf4 0%, #eef6ea 100%);
}

.layout-header {
  height: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #dfe8da;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
}

.top-menu {
  height: 56px;
  border-bottom: none;
  min-width: 0;
}

.top-menu:deep(.el-menu--horizontal) {
  border-bottom: none;
  justify-content: flex-end;
}

.top-menu:deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  padding: 0 14px;
  border-bottom: 2px solid transparent;
  background: transparent;
}

.top-menu:deep(.el-menu-item.is-active) {
  color: #409eff;
  background: transparent;
  border-bottom-color: #409eff;
}

.layout-main {
  width: min(1400px, 100%);
  margin: 0 auto;
  padding: 20px;
}
</style>
