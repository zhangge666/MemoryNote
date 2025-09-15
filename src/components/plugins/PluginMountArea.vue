<template>
  <div class="plugin-mount-area h-full">
    <template v-if="mountedPlugins.length > 0">
      <!-- 插件组件列表 -->
      <div v-for="plugin in mountedPlugins" :key="plugin.id" class="plugin-container border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <div class="plugin-header flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-750">
          <div class="flex items-center space-x-2">
            <div v-if="plugin.icon" v-html="plugin.icon" class="w-4 h-4"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ plugin.name }}</span>
          </div>
          <button 
            @click="unmountPlugin(plugin.id)"
            class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title="卸载插件"
          >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="plugin-content">
          <component 
            :is="plugin.component" 
            :api="plugin.api"
            :config="plugin.config"
            v-bind="plugin.props"
            @error="handlePluginError"
          />
        </div>
      </div>
    </template>
    
    <!-- 空状态 -->
    <div v-else class="empty-state flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
      <div class="text-center">
        <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
        </svg>
        <p class="text-sm">暂无插件挂载到{{ locationName }}</p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          在插件管理中启用插件并选择挂载位置
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue';
import { usePluginsStore } from '../../stores/plugins';
import type { MountLocation } from '../../plugins/types';

const props = defineProps<{
  location: MountLocation;
}>();

const pluginsStore = usePluginsStore();

// 获取位置的中文名称
const locationName = computed(() => {
  switch (props.location) {
    case 'left_sidebar':
      return '左侧文件列表区域';
    case 'main_area':
      return '主工作区';
    case 'right_sidebar':
      return '右侧栏';
    default:
      return '此区域';
  }
});

// 获取挂载到指定位置的插件
const mountedPlugins = computed(() => {
  if (!pluginsStore.pluginManager) return [];
  
  return pluginsStore.enabledPluginsList
    .filter(plugin => {
      const mountLocation = plugin.manifest.mount_preferences?.default_location;
      return mountLocation === props.location;
    })
    .map(plugin => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      icon: plugin.manifest.icon,
      component: plugin.mountedComponents?.get(props.location)?.[0] || null,
      api: plugin.api,
      config: plugin.manifest,
      props: plugin.mountedProps || {}
    }))
    .filter(plugin => plugin.component); // 只显示有组件的插件
});

// 卸载插件
function unmountPlugin(pluginId: string) {
  if (pluginsStore.pluginManager) {
    // 从指定位置卸载插件
    pluginsStore.pluginManager.unmountPluginFromLocation(pluginId, props.location);
  }
}

// 处理插件错误
function handlePluginError(error: any) {
  console.error('插件组件错误:', error);
  // TODO: 显示错误通知
}
</script>

<style scoped>
.plugin-mount-area {
  @apply h-full;
}

.plugin-container:not(:last-child) {
  @apply border-b border-gray-200 dark:border-gray-700;
}

.plugin-content {
  @apply p-2;
}

.empty-state {
  @apply h-full flex items-center justify-center text-gray-500 dark:text-gray-400;
}
</style>

