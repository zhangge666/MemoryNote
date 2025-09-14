<template>
  <div v-if="visible" class="plugin-settings-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeModal">
    <div class="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" @click.stop>
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {{ plugin?.manifest.name }} 设置
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ plugin?.manifest.description }}
          </p>
        </div>
        <button
          @click.stop="closeModal"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 设置内容 -->
      <div class="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
        <div v-if="settingItems.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-2">
            <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">此插件没有可配置的设置</p>
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="item in settingItems"
            :key="item.key"
            class="setting-item"
          >
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ item.label }}
            </label>
            
            <div class="setting-control">
              <!-- 文本输入 -->
              <input
                v-if="item.type === 'string'"
                v-model="settings[item.key]"
                type="text"
                class="input"
                :placeholder="item.placeholder"
              />
              
              <!-- 数字输入 -->
              <input
                v-else-if="item.type === 'number'"
                v-model="settings[item.key]"
                type="number"
                class="input"
                :min="item.min"
                :max="item.max"
                :step="item.step || 1"
              />
              
              <!-- 布尔值开关 -->
              <div v-else-if="item.type === 'boolean'" class="flex items-center">
                <div class="toggle-switch">
                  <input
                    v-model="settings[item.key]"
                    type="checkbox"
                  />
                  <span class="toggle-slider"></span>
                </div>
                <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">
                  {{ settings[item.key] ? '已启用' : '已禁用' }}
                </span>
              </div>
              
              <!-- 选择器 -->
              <select
                v-else-if="item.type === 'select'"
                v-model="settings[item.key]"
                class="input"
              >
                <option
                  v-for="option in item.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              
              <!-- 颜色选择器 -->
              <div v-else-if="item.type === 'color'" class="flex items-center space-x-3">
                <input
                  v-model="settings[item.key]"
                  type="color"
                  class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  v-model="settings[item.key]"
                  type="text"
                  class="input flex-1"
                  :placeholder="item.placeholder || '#000000'"
                />
              </div>
              
              <!-- 范围滑块 -->
              <div v-else-if="item.type === 'range'" class="space-y-2">
                <input
                  v-model="settings[item.key]"
                  type="range"
                  class="w-full"
                  :min="item.min || 0"
                  :max="item.max || 100"
                  :step="item.step || 1"
                />
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ item.min || 0 }}</span>
                  <span class="font-medium">{{ settings[item.key] }}</span>
                  <span>{{ item.max || 100 }}</span>
                </div>
              </div>
            </div>
            
            <p v-if="item.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-dark-600">
        <button
          @click.stop="resetToDefaults"
          class="btn btn-ghost"
          :disabled="!hasChanges"
        >
          重置为默认值
        </button>
        <button
          @click.stop="closeModal"
          class="btn btn-secondary"
        >
          取消
        </button>
        <button
          @click.stop="saveSettings"
          class="btn btn-primary"
          :disabled="!hasChanges"
        >
          保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { PluginInstance, PluginSettingItem } from '../../plugins/types';

interface Props {
  plugin: PluginInstance | null;
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'save', settings: Record<string, any>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 设置项和当前值
const settingItems = ref<PluginSettingItem[]>([]);
const settings = ref<Record<string, any>>({});
const originalSettings = ref<Record<string, any>>({});

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value);
});

// 方法
function closeModal() {
  console.log('关闭插件设置弹窗');
  emit('close');
}

async function loadSettings() {
  if (!props.plugin) return;
  
  try {
    // 获取插件的设置配置
    const pluginInstance = props.plugin.instance;
    if (pluginInstance && typeof pluginInstance.getSettings === 'function') {
      settingItems.value = pluginInstance.getSettings() || [];
    } else {
      settingItems.value = [];
    }
    
    // 加载当前设置值
    const savedSettings = await window.electronAPI.plugins.getSettings(props.plugin.manifest.id);
    
    // 初始化设置对象
    const initialSettings: Record<string, any> = {};
    settingItems.value.forEach(item => {
      initialSettings[item.key] = savedSettings[item.key] !== undefined 
        ? savedSettings[item.key] 
        : item.default;
    });
    
    settings.value = { ...initialSettings };
    originalSettings.value = { ...initialSettings };
  } catch (error) {
    console.error('加载插件设置失败:', error);
  }
}

async function saveSettings() {
  if (!props.plugin) return;
  
  try {
    // 保存设置到主进程
    await window.electronAPI.plugins.saveSettings(props.plugin.manifest.id, settings.value);
    
    // 通知插件设置已更新
    const pluginInstance = props.plugin.instance;
    if (pluginInstance && typeof pluginInstance.onSettingChange === 'function') {
      // 逐个通知每个设置项的变化
      Object.entries(settings.value).forEach(([key, value]) => {
        pluginInstance.onSettingChange(key, value);
      });
    }
    
    originalSettings.value = { ...settings.value };
    emit('save', settings.value);
    emit('close');
  } catch (error) {
    console.error('保存插件设置失败:', error);
    alert('保存设置失败，请重试');
  }
}

function resetToDefaults() {
  const defaultSettings: Record<string, any> = {};
  settingItems.value.forEach(item => {
    defaultSettings[item.key] = item.default;
  });
  settings.value = { ...defaultSettings };
}

// 监听插件变化
watch(() => props.plugin, (newPlugin, oldPlugin) => {
  console.log('插件变化:', oldPlugin?.manifest?.name, '->', newPlugin?.manifest?.name);
  if (newPlugin && props.visible) {
    loadSettings();
  }
}, { immediate: true });

watch(() => props.visible, (visible, oldVisible) => {
  console.log('可见性变化:', oldVisible, '->', visible);
  if (visible && props.plugin) {
    loadSettings();
  }
});

// 处理ESC键关闭
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.visible) {
    closeModal();
  }
}

onMounted(() => {
  if (props.visible && props.plugin) {
    loadSettings();
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown);
});

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.plugin-settings-modal {
  backdrop-filter: blur(4px);
}

.setting-item:not(:last-child) {
  @apply border-b border-gray-100 dark:border-dark-700 pb-6;
}

.setting-control {
  @apply relative;
}

/* 切换开关样式 */
.toggle-switch {
  @apply relative inline-block w-12 h-6;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0;
  @apply bg-gray-300 dark:bg-gray-600 rounded-full transition-colors;
}

.toggle-slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5;
  @apply bg-white rounded-full transition-transform;
}

.toggle-switch input:checked + .toggle-slider {
  @apply bg-primary-600;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* 范围滑块样式 */
input[type="range"] {
  @apply appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg h-2;
}

input[type="range"]::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-primary-600 rounded-full cursor-pointer;
}

input[type="range"]::-moz-range-thumb {
  @apply w-4 h-4 bg-primary-600 rounded-full cursor-pointer border-none;
}
</style>
