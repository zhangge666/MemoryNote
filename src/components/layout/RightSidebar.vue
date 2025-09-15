<template>
  <div class="right-sidebar h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
    <!-- 头部 -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        {{ title || '右侧面板' }}
      </h2>
      <button 
        @click="$emit('close')"
        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        title="关闭右侧栏"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
    
    <!-- 内容区域 -->
    <div class="flex-1 overflow-auto">
      <slot>
        <!-- 默认内容：插件挂载区域 -->
        <PluginMountArea location="right_sidebar" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import PluginMountArea from '../plugins/PluginMountArea.vue';

defineProps<{
  title?: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.right-sidebar {
  min-width: 200px;
  max-width: 600px;
}
</style>

