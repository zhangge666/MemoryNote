<template>
  <div class="space-y-6">
    <div v-if="plugin" class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <!-- 插件信息头部 -->
      <div class="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-600">
        <div class="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div v-if="plugin.manifest.icon" v-html="plugin.manifest.icon" class="w-10 h-10"></div>
          <svg v-else class="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-medium text-gray-900 dark:text-gray-100">{{ plugin.manifest.name }}</h3>
          <p class="text-gray-600 dark:text-gray-400">{{ plugin.manifest.description }}</p>
          <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>版本: {{ plugin.manifest.version }}</span>
            <span>作者: {{ plugin.manifest.author }}</span>
            <span>类型: {{ getTypeLabel(plugin.manifest.type) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 插件设置表单 -->
      <div class="space-y-6">
        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">插件设置</h4>
        
        <div v-if="settingsItems.length > 0" class="space-y-4">
          <div
            v-for="setting in settingsItems"
            :key="setting.key"
            class="space-y-2"
          >
            <!-- 字符串类型 -->
            <div v-if="setting.type === 'string'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ setting.label || setting.name }}
              </label>
              <input
                v-model="settingsValues[setting.key]"
                type="text"
                :placeholder="setting.placeholder"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
              />
              <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
                {{ setting.description }}
              </p>
            </div>
            
            <!-- 数字类型 -->
            <div v-else-if="setting.type === 'number'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ setting.label || setting.name }}
              </label>
              <input
                v-model.number="settingsValues[setting.key]"
                type="number"
                :min="setting.min"
                :max="setting.max"
                :step="setting.step"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
              />
              <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
                {{ setting.description }}
              </p>
            </div>
            
            <!-- 布尔类型 -->
            <div v-else-if="setting.type === 'boolean'" class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ setting.label || setting.name }}
                </label>
                <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ setting.description }}
                </p>
              </div>
              <input
                v-model="settingsValues[setting.key]"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            
            <!-- 选择类型 -->
            <div v-else-if="setting.type === 'select'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ setting.label || setting.name }}
              </label>
              <select
                v-model="settingsValues[setting.key]"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
              >
                <option
                  v-for="option in setting.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
                {{ setting.description }}
              </p>
            </div>
            
            <!-- 颜色类型 -->
            <div v-else-if="setting.type === 'color'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ setting.label || setting.name }}
              </label>
              <div class="mt-1 flex items-center space-x-3">
                <input
                  v-model="settingsValues[setting.key]"
                  type="color"
                  class="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
                <input
                  v-model="settingsValues[setting.key]"
                  type="text"
                  class="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
                />
              </div>
              <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
                {{ setting.description }}
              </p>
            </div>
            
            <!-- 范围类型 -->
            <div v-else-if="setting.type === 'range'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ setting.label || setting.name }}: {{ settingsValues[setting.key] }}
              </label>
              <input
                v-model.number="settingsValues[setting.key]"
                type="range"
                :min="setting.min"
                :max="setting.max"
                :step="setting.step"
                class="mt-1 block w-full"
              />
              <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
                {{ setting.description }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- 无设置项提示 -->
        <div v-else class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400">此插件没有可配置的设置</p>
        </div>
      </div>
    </div>
    
    <!-- 插件未找到 -->
    <div v-else class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <div class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">未找到指定的插件</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { usePluginsStore } from '../../stores/plugins';
import type { PluginSettingItem } from '../../plugins/types';

const props = defineProps<{
  pluginId: string;
}>();

const pluginsStore = usePluginsStore();

// 插件数据
const plugin = computed(() => {
  return pluginsStore.enabledPluginsList.find(p => p.manifest.id === props.pluginId);
});

// 设置项
const settingsItems = ref<PluginSettingItem[]>([]);
const settingsValues = ref<Record<string, any>>({});

// 获取类型标签
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    theme: '主题',
    tool: '工具',
    extension: '扩展',
    integration: '集成',
    page: '页面'
  };
  return labels[type] || type;
}

// 加载插件设置
function loadPluginSettings() {
  if (!plugin.value) {
    settingsItems.value = [];
    settingsValues.value = {};
    return;
  }
  
  try {
    // 获取插件设置项
    const items = plugin.value.plugin.getSettings();
    settingsItems.value = items || [];
    
    // 初始化设置值
    const values: Record<string, any> = {};
    (items || []).forEach(item => {
      const currentValue = plugin.value?.settings[item.key] ?? item.value ?? item.default;
      values[item.key] = currentValue;
    });
    settingsValues.value = values;
    
  } catch (error) {
    console.error('加载插件设置失败:', error);
    settingsItems.value = [];
    settingsValues.value = {};
  }
}

// 保存设置
async function saveSettings() {
  if (!plugin.value) return;
  
  try {
    // 保存每个设置项
    for (const [key, value] of Object.entries(settingsValues.value)) {
      if (plugin.value.api) {
        await plugin.value.api.settings.set(key, value);
      }
    }
    
    // 通知插件设置已更改
    for (const [key, value] of Object.entries(settingsValues.value)) {
      try {
        await plugin.value.plugin.onSettingChange(key, value);
      } catch (error) {
        console.error(`通知插件设置变更失败 [${key}]:`, error);
      }
    }
    
    console.log('插件设置已保存:', props.pluginId);
    
  } catch (error) {
    console.error('保存插件设置失败:', error);
    throw error;
  }
}

// 重置设置
function resetSettings() {
  if (!plugin.value) return;
  
  const values: Record<string, any> = {};
  settingsItems.value.forEach(item => {
    values[item.key] = item.default;
  });
  settingsValues.value = values;
}

// 监听插件变化
watch(() => props.pluginId, () => {
  loadPluginSettings();
}, { immediate: true });

watch(() => plugin.value, () => {
  loadPluginSettings();
});

onMounted(() => {
  loadPluginSettings();
});

// 暴露方法给父组件
defineExpose({
  saveSettings,
  resetSettings
});
</script>


