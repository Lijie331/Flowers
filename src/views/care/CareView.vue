<template>
  <el-space direction="vertical" :size="16" fill>
    <el-card>
      <template #header>
        <span>植物养护</span>
      </template>
      <el-alert
        title="当前建议：春季可适当增加浇水频率，避免积水。"
        type="success"
        show-icon
        :closable="false"
      />
    </el-card>

    <el-card>
      <el-steps :active="2" finish-status="success" align-center>
        <el-step title="观察状态" description="先看叶色、土壤和光照" />
        <el-step title="制定方案" description="确定浇水和施肥计划" />
        <el-step title="执行复盘" description="1周后记录变化" />
      </el-steps>
    </el-card>

    <el-card>
      <el-table
        :data="[
          { item: '浇水', advice: '见干见湿，忌积水' },
          { item: '施肥', advice: '生长期薄肥勤施' },
          { item: '光照', advice: '大多数开花植物需要充足散射光' },
        ]"
      >
        <el-table-column prop="item" label="项目" width="120" />
        <el-table-column prop="advice" label="建议" />
      </el-table>
    </el-card>
  </el-space>
</template>
