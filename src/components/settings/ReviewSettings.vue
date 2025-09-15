<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">复习设置</h3>
      <p class="text-gray-500 dark:text-gray-400">复习设置功能正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineExpose({
  saveSettings: () => console.log('保存复习设置'),
  resetSettings: () => console.log('重置复习设置')
});
</script>


