<template>
  <div class="settings-window h-full bg-gray-50 dark:bg-dark-900 flex">
    <!-- 左侧边栏 -->
    <div class="w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600 flex flex-col">
      <!-- 标题 -->
      <div class="p-6 border-b border-gray-200 dark:border-dark-600">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">设置</h1>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="flex-1 p-4 space-y-2">
        <!-- 系统设置分类 -->
        <div class="space-y-1">
          <button
            v-for="item in systemCategories"
            :key="item.id"
            @click="handleCategoryClick(item.id)"
            class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': activeCategory === item.id,
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700': activeCategory !== item.id
            }"
          >
            <div class="w-5 h-5 mr-3" v-html="item.icon"></div>
            {{ item.name }}
          </button>
        </div>
        
        <!-- 分割线 -->
        <div class="border-t border-gray-200 dark:border-dark-600 my-4"></div>
        
        <!-- 插件设置分类 -->
        <div class="space-y-1">
          <!-- 每个插件的设置 -->
          <div v-for="plugin in enabledPlugins" :key="plugin.manifest.id">
            <button
              @click="handleCategoryClick(`plugin-${plugin.manifest.id}`)"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="{
                'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': activeCategory === `plugin-${plugin.manifest.id}`,
                'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700': activeCategory !== `plugin-${plugin.manifest.id}`
              }"
            >
              <div class="w-5 h-5 mr-3 flex items-center justify-center">
                <div v-if="plugin.manifest.icon" v-html="plugin.manifest.icon" class="w-4 h-4"></div>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd"/>
                </svg>
              </div>
              {{ plugin.manifest.name }}
            </button>
          </div>
        </div>
      </nav>
      
      <!-- 底部插件管理按钮 -->
      <div class="p-4 border-t border-gray-200 dark:border-dark-600">
        <button
          @click="handleCategoryClick('plugin-manager')"
          class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="{
            'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': activeCategory === 'plugin-manager',
            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700': activeCategory !== 'plugin-manager'
          }"
        >
          <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
          </svg>
          插件管理
        </button>
      </div>
    </div>
    
    <!-- 右侧内容区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部操作栏 -->
      <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 px-6 py-4 flex items-center justify-between">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          {{ currentCategoryTitle }}
        </h2>
        <div class="flex items-center space-x-2">
          <button
            @click="resetCurrentSettings"
            class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            重置
          </button>
          <button
            @click="saveCurrentSettings"
            class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
      
      <!-- 设置内容 -->
      <div class="flex-1 overflow-auto p-6">
        <!-- 通用设置 -->
        <GeneralSettings v-if="activeCategory === 'general'" />
        
        <!-- 编辑器设置 -->
        <EditorSettings v-if="activeCategory === 'editor'" />
        
        <!-- 复习设置 -->
        <ReviewSettings v-if="activeCategory === 'review'" />
        
        <!-- 日记设置 -->
        <DiarySettings v-if="activeCategory === 'diary'" />
        
        <!-- 快捷键设置 -->
        <ShortcutSettings v-if="activeCategory === 'shortcuts'" />
        
        <!-- 插件管理 -->
        <PluginManagement 
          v-if="activeCategory === 'plugin-manager'" 
          @open-plugin-settings="handleOpenPluginSettings"
        />
        
        <!-- 单个插件设置 -->
        <PluginSettings
          v-if="activeCategory.startsWith('plugin-') && activeCategory !== 'plugin-manager'"
          :plugin-id="activeCategory.replace('plugin-', '')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePluginsStore } from '../stores/plugins';
import { useSettingsStore } from '../stores/settings';
import GeneralSettings from '../components/settings/GeneralSettings.vue';
import EditorSettings from '../components/settings/EditorSettings.vue';
import ReviewSettings from '../components/settings/ReviewSettings.vue';
import DiarySettings from '../components/settings/DiarySettings.vue';
import ShortcutSettings from '../components/settings/ShortcutSettings.vue';
import PluginManagement from '../components/settings/PluginManagement.vue';
import PluginSettings from '../components/settings/PluginSettings.vue';

const pluginsStore = usePluginsStore();
const settingsStore = useSettingsStore();

// 当前激活的设置分类
const activeCategory = ref('general');

// 系统设置分类
const systemCategories = [
  {
    id: 'general',
    name: '通用',
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
    </svg>`
  },
  {
    id: 'editor',
    name: '编辑器',
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
    </svg>`
  },
  {
    id: 'review',
    name: '复习',
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
    </svg>`
  },
  {
    id: 'diary',
    name: '日记',
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
      <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h2a2 2 0 002-2V3a2 2 0 012 2v6h-3V8a1 1 0 10-2 0v3H4V5z" clip-rule="evenodd"/>
      <path d="M15 13a1 1 0 100-2h-3v9a1 1 0 001 1h2a2 2 0 002-2v-6z"/>
    </svg>`
  },
  {
    id: 'shortcuts',
    name: '快捷键',
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
    </svg>`
  },
  {
    id: 'plugin-manager',
    name: '插件管理',
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
    </svg>`
  }
];

// 已启用的插件
const enabledPlugins = computed(() => {
  return pluginsStore.enabledPluginsList.filter(plugin => {
    // 检查插件是否实现了设置方法
    try {
      return plugin.plugin.getSettings && typeof plugin.plugin.getSettings === 'function';
    } catch {
      return false;
    }
  });
});

// 当前分类标题
const currentCategoryTitle = computed(() => {
  // 查找系统分类
  const systemCategory = systemCategories.find(cat => cat.id === activeCategory.value);
  if (systemCategory) {
    return `${systemCategory.name}设置`;
  }
  
  // 插件管理
  if (activeCategory.value === 'plugin-manager') return '插件管理';
  
  // 单个插件设置
  if (activeCategory.value.startsWith('plugin-')) {
    return '插件设置';
  }
  
  return '设置';
});

// 处理分类点击
function handleCategoryClick(categoryId: string) {
  activeCategory.value = categoryId;
}

// 处理打开插件设置
function handleOpenPluginSettings(pluginId: string) {
  activeCategory.value = `plugin-${pluginId}`;
}

// 重置当前设置
function resetCurrentSettings() {
  // TODO: 实现重置逻辑
  console.log('重置设置:', activeCategory.value);
}

// 保存当前设置
function saveCurrentSettings() {
  // TODO: 实现保存逻辑
  console.log('保存设置:', activeCategory.value);
}

onMounted(async () => {
  // 初始化插件系统
  if (!pluginsStore.isInitialized) {
    pluginsStore.initialize();
  }
});
</script>

<style scoped>
.settings-window {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
</style>
