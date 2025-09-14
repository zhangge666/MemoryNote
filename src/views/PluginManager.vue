<template>
  <div class="plugin-manager h-full flex flex-col bg-white dark:bg-dark-900">
    <!-- 插件管理器标题栏 -->
    <div class="titlebar bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 p-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">插件管理器</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            管理您的插件，扩展MemoryNote的功能
          </p>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- 统计信息 -->
          <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>已安装: {{ pluginStats.total }}</span>
            <span>已启用: {{ pluginStats.enabled }}</span>
            <span>主题: {{ pluginStats.themes }}</span>
          </div>
          
          <!-- 安装插件按钮 -->
          <button 
            @click="showInstallDialog"
            class="btn btn-primary"
          >
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            安装插件
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧：插件分类导航 -->
      <div class="w-64 bg-gray-50 dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600 p-4">
        <nav class="space-y-2">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectedCategory = category.id"
            class="nav-item"
            :class="{ 'nav-item-active': selectedCategory === category.id }"
          >
            <component :is="category.icon" class="w-5 h-5" />
            <span>{{ category.name }}</span>
            <span class="ml-auto text-xs bg-gray-200 dark:bg-dark-600 px-2 py-1 rounded">
              {{ category.count }}
            </span>
          </button>
        </nav>

        <!-- 筛选选项 -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">筛选</h3>
          <div class="space-y-2">
            <label class="flex items-center">
              <input 
                type="checkbox" 
                v-model="showOnlyEnabled"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              <span class="ml-2 text-sm">仅显示已启用</span>
            </label>
            <label class="flex items-center">
              <input 
                type="checkbox" 
                v-model="showOnlyVerified"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              <span class="ml-2 text-sm">仅显示已验证</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 右侧：插件列表 -->
      <div class="flex-1 flex flex-col">
        <!-- 搜索和排序 -->
        <div class="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-600 p-4">
          <div class="flex items-center space-x-4">
            <!-- 搜索框 -->
            <div class="flex-1 relative">
              <svg class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索插件..."
                class="input pl-10"
              >
            </div>

            <!-- 排序选择 -->
            <select v-model="sortBy" class="input w-40">
              <option value="name">按名称排序</option>
              <option value="author">按作者排序</option>
              <option value="updated">按更新时间</option>
              <option value="rating">按评分排序</option>
            </select>
          </div>
        </div>

        <!-- 插件列表 -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="isLoading" class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          
          <div v-else-if="error" class="text-center py-12">
            <div class="text-red-600 dark:text-red-400 mb-2">{{ error }}</div>
            <button @click="loadPlugins" class="btn btn-secondary">重试</button>
          </div>
          
          <div v-else-if="filteredPlugins.length === 0" class="text-center py-12">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clip-rule="evenodd"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400">没有找到匹配的插件</p>
          </div>
          
          <div v-else class="grid gap-4">
            <div
              v-for="plugin in filteredPlugins"
              :key="plugin.manifest.id"
              class="plugin-card"
            >
              <div class="flex items-start space-x-4">
                <!-- 插件图标 -->
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <svg v-if="!plugin.manifest.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <img v-else :src="plugin.manifest.icon" :alt="plugin.manifest.name" class="w-6 h-6">
                  </div>
                </div>

                <!-- 插件信息 -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ plugin.manifest.name }}
                    </h3>
                    <span class="plugin-type-badge" :data-type="plugin.manifest.type">
                      {{ getTypeLabel(plugin.manifest.type) }}
                    </span>
                    <span v-if="plugin.status === 'enabled'" class="status-badge status-enabled">
                      已启用
                    </span>
                    <span v-else-if="plugin.status === 'error'" class="status-badge status-error">
                      错误
                    </span>
                  </div>
                  
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {{ plugin.manifest.description }}
                  </p>
                  
                  <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>作者：{{ plugin.manifest.author }}</span>
                    <span>版本：{{ plugin.manifest.version }}</span>
                    <span v-if="plugin.loadedAt">
                      安装时间：{{ formatDate(plugin.loadedAt) }}
                    </span>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="flex-shrink-0 flex items-center space-x-2">
                  <button
                    v-if="plugin.status === 'enabled'"
                    @click="disablePlugin(plugin.manifest.id)"
                    class="btn btn-secondary btn-sm"
                  >
                    禁用
                  </button>
                  <button
                    v-else
                    @click="enablePlugin(plugin.manifest.id)"
                    class="btn btn-primary btn-sm"
                  >
                    启用
                  </button>
                  
                  <button
                    @click="showPluginSettings(plugin)"
                    class="btn btn-ghost btn-sm"
                    title="设置"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  
                  <button
                    @click="uninstallPlugin(plugin.manifest.id)"
                    class="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                    title="卸载"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 安装插件对话框 -->
    <div v-if="showInstallModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-dark-800 rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">安装插件</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              安装方式
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="installMethod = 'zip'"
                class="install-method-btn"
                :class="{ 'install-method-active': installMethod === 'zip' }"
              >
                ZIP文件
              </button>
              <button
                @click="installMethod = 'url'"
                class="install-method-btn"
                :class="{ 'install-method-active': installMethod === 'url' }"
              >
                远程地址
              </button>
            </div>
          </div>
          
          <div v-if="installMethod === 'zip'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择ZIP文件
            </label>
            <button @click="selectZipFile" class="w-full input text-left">
              {{ selectedZipFile || '点击选择文件...' }}
            </button>
          </div>
          
          <div v-if="installMethod === 'url'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              插件地址
            </label>
            <input
              v-model="installUrl"
              type="url"
              placeholder="https://example.com/plugin.zip"
              class="input"
            >
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showInstallModal = false" class="btn btn-secondary">
            取消
          </button>
          <button 
            @click="installPlugin"
            :disabled="!canInstall"
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !canInstall }"
          >
            安装
          </button>
        </div>
      </div>
    </div>

    <!-- 插件设置对话框 -->
    <PluginSettings
      :plugin="selectedPlugin"
      :visible="showSettingsModal"
      @close="showSettingsModal = false; selectedPlugin = null"
      @save="onSettingsSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePluginsStore } from '../stores/plugins';
import type { PluginInstance, PluginType } from '../plugins/types';
import PluginSettings from '../components/ui/PluginSettings.vue';

const pluginsStore = usePluginsStore();

// 响应式状态
const searchQuery = ref('');
const selectedCategory = ref('all');
const sortBy = ref('name');
const showOnlyEnabled = ref(false);
const showOnlyVerified = ref(false);
const showInstallModal = ref(false);
const installMethod = ref<'zip' | 'url'>('zip');
const selectedZipFile = ref('');
const installUrl = ref('');
const showSettingsModal = ref(false);
const selectedPlugin = ref<PluginInstance | null>(null);

// 分类定义
const categories = computed(() => [
  { id: 'all', name: '全部插件', icon: 'AllIcon', count: pluginsStore.allPlugins.length },
  { id: 'enabled', name: '已启用', icon: 'EnabledIcon', count: pluginsStore.enabledPluginsList.length },
  { id: 'theme', name: '主题', icon: 'ThemeIcon', count: pluginsStore.filterPluginsByType('theme').length },
  { id: 'command', name: '命令', icon: 'CommandIcon', count: pluginsStore.filterPluginsByType('command').length },
  { id: 'ui', name: 'UI增强', icon: 'UIIcon', count: pluginsStore.filterPluginsByType('ui').length },
  { id: 'page', name: '页面插件', icon: 'PageIcon', count: pluginsStore.filterPluginsByType('page').length },
  { id: 'utility', name: '实用工具', icon: 'UtilityIcon', count: pluginsStore.filterPluginsByType('utility').length }
]);

// 计算属性
const isLoading = computed(() => pluginsStore.isLoading);
const error = computed(() => pluginsStore.error);
const pluginStats = computed(() => pluginsStore.pluginStats);

const filteredPlugins = computed(() => {
  let plugins = pluginsStore.allPlugins;
  
  // 分类筛选
  if (selectedCategory.value !== 'all') {
    if (selectedCategory.value === 'enabled') {
      plugins = pluginsStore.enabledPluginsList;
    } else {
      plugins = pluginsStore.filterPluginsByType(selectedCategory.value);
    }
  }
  
  // 搜索筛选
  if (searchQuery.value) {
    plugins = pluginsStore.searchPlugins(searchQuery.value);
  }
  
  // 启用状态筛选
  if (showOnlyEnabled.value) {
    plugins = plugins.filter(p => p.status === 'enabled');
  }
  
  // 排序
  return plugins.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.manifest.name.localeCompare(b.manifest.name);
      case 'author':
        return a.manifest.author.localeCompare(b.manifest.author);
      case 'updated':
        return (b.loadedAt?.getTime() || 0) - (a.loadedAt?.getTime() || 0);
      default:
        return 0;
    }
  });
});

const canInstall = computed(() => {
  if (installMethod.value === 'zip') {
    return !!selectedZipFile.value;
  } else {
    return !!installUrl.value.trim();
  }
});

// 方法
async function loadPlugins() {
  if (pluginsStore.isInitialized) {
    // 如果已经初始化，刷新插件列表
    await pluginsStore.refreshPlugins();
  } else {
    // 如果未初始化，先初始化
    await pluginsStore.initialize();
  }
}

async function enablePlugin(pluginId: string) {
  await pluginsStore.enablePlugin(pluginId);
}

async function disablePlugin(pluginId: string) {
  await pluginsStore.disablePlugin(pluginId);
}

async function uninstallPlugin(pluginId: string) {
  if (confirm('确定要卸载此插件吗？此操作无法撤销。')) {
    await pluginsStore.unloadPlugin(pluginId);
  }
}

function showInstallDialog() {
  showInstallModal.value = true;
  installMethod.value = 'zip';
  selectedZipFile.value = '';
  installUrl.value = '';
}

async function selectZipFile() {
  try {
    const result = await window.electronAPI.fs.showOpenDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      selectedZipFile.value = result.filePaths[0];
    }
  } catch (error) {
    console.error('选择文件失败:', error);
  }
}

async function installPlugin() {
  const installBtn = event?.target as HTMLButtonElement;
  const originalText = installBtn?.textContent;
  
  try {
    // 显示加载状态
    if (installBtn) {
      installBtn.disabled = true;
      installBtn.textContent = '安装中...';
    }
    
    let result;
    
    if (installMethod.value === 'zip' && selectedZipFile.value) {
      console.log('开始安装ZIP插件:', selectedZipFile.value);
      result = await window.electronAPI.plugins.installFromZip(selectedZipFile.value);
    } else if (installMethod.value === 'url' && installUrl.value) {
      alert('从URL安装功能正在开发中');
      return;
    }
    
    if (result?.success) {
      console.log('插件安装成功:', result);
      
      // 显示详细的成功信息
      const message = result.manifest 
        ? `插件 "${result.manifest.name}" v${result.manifest.version} 安装成功！\n\n作者: ${result.manifest.author}\n描述: ${result.manifest.description}`
        : result.message;
        
      alert(message);
      
      showInstallModal.value = false;
      
      // 重新加载插件列表
      await loadPlugins();
      
      // 如果是主题插件，提示用户可以在插件管理器中启用
      if (result.manifest?.type === 'theme') {
        setTimeout(() => {
          alert('主题插件安装成功！您可以在插件列表中启用它，然后使用快捷键切换主题。');
        }, 500);
      }
      
    } else {
      console.error('插件安装失败:', result);
      
      // 显示详细的错误信息和诊断建议
      const errorMsg = result?.message || '未知错误';
      
      // 根据错误类型提供不同的解决建议
      let suggestions = '';
      if (errorMsg.includes('End of central directory record signature not found') || 
          errorMsg.includes('ZIP文件损坏') || 
          errorMsg.includes('不是有效的ZIP格式')) {
        suggestions = `\n\n🔧 解决建议：\n` +
                     `• 重新下载或创建ZIP文件\n` +
                     `• 确保文件完整且未损坏\n` +
                     `• 使用标准的ZIP创建工具\n` +
                     `• 检查文件扩展名是否为.zip\n\n` +
                     `📝 正确的ZIP文件结构：\n` +
                     `your-plugin.zip\n` +
                     `├── manifest.json\n` +
                     `├── index.js\n` +
                     `└── 其他文件...`;
      } else if (errorMsg.includes('manifest.json')) {
        suggestions = `\n\n🔧 解决建议：\n` +
                     `• 确保ZIP根目录包含manifest.json\n` +
                     `• 检查JSON文件格式是否正确\n` +
                     `• 验证所有必需字段是否存在`;
      } else if (errorMsg.includes('文件大小')) {
        suggestions = `\n\n🔧 解决建议：\n` +
                     `• 减少插件文件大小\n` +
                     `• 移除不必要的资源文件\n` +
                     `• 压缩图片和其他资源`;
      }
      
      alert(`插件安装失败：\n\n${errorMsg}${suggestions}`);
    }
    
  } catch (error) {
    console.error('安装插件时发生异常:', error);
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    alert(`插件安装失败：\n\n${errorMsg}\n\n请检查文件格式和网络连接`);
  } finally {
    // 恢复按钮状态
    if (installBtn) {
      installBtn.disabled = false;
      installBtn.textContent = originalText || '安装';
    }
  }
}

function showPluginSettings(plugin: PluginInstance) {
  console.log('显示插件设置:', plugin?.manifest?.name);
  if (!plugin) {
    console.warn('无效的插件对象');
    return;
  }
  selectedPlugin.value = plugin;
  showSettingsModal.value = true;
}

function onSettingsSaved(settings: Record<string, any>) {
  console.log('插件设置已保存:', settings);
  // 这里可以添加其他需要的处理逻辑
}

function getTypeLabel(type: PluginType): string {
  const labels = {
    theme: '主题',
    command: '命令',
    ui: 'UI',
    editor: '编辑器',
    utility: '工具',
    page: '页面'
  };
  return labels[type] || type;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN');
}

// 生命周期
onMounted(() => {
  loadPlugins();
});
</script>

<style scoped>
.plugin-manager {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nav-item {
  @apply w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md transition-colors;
}

.nav-item-active {
  @apply bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.plugin-card {
  @apply bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-4;
  @apply hover:shadow-md transition-shadow;
}

.plugin-type-badge {
  @apply px-2 py-1 text-xs rounded-full font-medium;
}

.plugin-type-badge[data-type="theme"] {
  @apply bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400;
}

.plugin-type-badge[data-type="command"] {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400;
}

.plugin-type-badge[data-type="ui"] {
  @apply bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400;
}

.plugin-type-badge[data-type="utility"] {
  @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.status-badge {
  @apply px-2 py-1 text-xs rounded-full font-medium;
}

.status-enabled {
  @apply bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400;
}

.status-error {
  @apply bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400;
}

.btn-sm {
  @apply px-3 py-1 text-sm;
}

.install-method-btn {
  @apply px-4 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-md;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors;
}

.install-method-active {
  @apply bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
  @apply border-primary-300 dark:border-primary-600;
}
</style>
