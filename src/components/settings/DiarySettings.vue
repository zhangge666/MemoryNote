<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">日记设置</h3>
      <p class="text-gray-500 dark:text-gray-400">日记设置功能正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineExpose({
  saveSettings: () => console.log('保存日记设置'),
  resetSettings: () => console.log('重置日记设置')
});
</script>


