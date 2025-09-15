<template>
  <div class="space-y-6">
    <!-- 插件管理头部 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">插件管理</h3>
        <div class="flex items-center space-x-3">
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索插件..."
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
          />
          <button
            @click="installPlugin"
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            安装插件
          </button>
        </div>
      </div>
      
      <!-- 插件统计 -->
      <div class="grid grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ allPlugins.length }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">已安装</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ enabledPlugins.length }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">已启用</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-600">{{ disabledPlugins.length }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">已禁用</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ errorPlugins.length }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">错误</div>
        </div>
      </div>
    </div>
    
    <!-- 插件列表 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <div class="space-y-4">
        <!-- 过滤器 -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">状态:</label>
            <select
              v-model="statusFilter"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
            >
              <option value="">全部</option>
              <option value="enabled">已启用</option>
              <option value="disabled">已禁用</option>
              <option value="error">错误</option>
            </select>
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">类型:</label>
            <select
              v-model="typeFilter"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
            >
              <option value="">全部</option>
              <option value="theme">主题</option>
              <option value="tool">工具</option>
              <option value="extension">扩展</option>
              <option value="integration">集成</option>
            </select>
          </div>
        </div>
        
        <!-- 插件项目 -->
        <div class="space-y-3">
          <div
            v-for="plugin in filteredPlugins"
            :key="plugin.manifest.id"
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <div class="flex items-center space-x-4">
              <!-- 插件图标 -->
              <div class="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div v-if="plugin.manifest.icon" v-html="plugin.manifest.icon" class="w-8 h-8"></div>
                <svg v-else class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
                </svg>
              </div>
              
              <!-- 插件信息 -->
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ plugin.manifest.name }}</h4>
                  <span class="text-sm text-gray-500 dark:text-gray-400">v{{ plugin.manifest.version }}</span>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getStatusClass(plugin.status)"
                  >
                    {{ getStatusText(plugin.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ plugin.manifest.description }}</p>
                <div class="flex items-center space-x-4 mt-1">
                  <span class="text-xs text-gray-500 dark:text-gray-400">作者: {{ plugin.manifest.author }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">类型: {{ getTypeLabel(plugin.manifest.type) }}</span>
                  <span v-if="plugin.loadedAt" class="text-xs text-gray-500 dark:text-gray-400">
                    安装时间: {{ formatDate(plugin.loadedAt) }}
                  </span>
                </div>
                
                <!-- 错误信息 -->
                <div v-if="plugin.error" class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p class="text-sm text-red-600 dark:text-red-400">{{ plugin.error }}</p>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center space-x-2">
              <!-- 设置按钮 -->
              <button
                v-if="hasSettings(plugin)"
                @click="$emit('open-plugin-settings', plugin.manifest.id)"
                class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
              >
                设置
              </button>
              
              <!-- 启用/禁用按钮 -->
              <button
                v-if="plugin.status !== 'error'"
                @click="togglePlugin(plugin)"
                :disabled="!hasSettings(plugin)"
                class="px-3 py-1.5 text-sm rounded transition-colors"
                :class="plugin.status === 'enabled' 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40'
                  : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ plugin.status === 'enabled' ? '禁用' : '启用' }}
              </button>
              
              <!-- 卸载按钮 -->
              <button
                @click="uninstallPlugin(plugin)"
                class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                卸载
              </button>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredPlugins.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400">
            {{ searchText ? '没有找到匹配的插件' : '暂无已安装的插件' }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- 安装插件对话框 -->
    <div v-if="showInstallDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-dark-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">安装插件</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择插件ZIP文件
            </label>
            <input
              ref="fileInput"
              type="file"
              accept=".zip"
              @change="handleFileSelect"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
            />
          </div>
          
          <div v-if="installProgress" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">{{ installProgress.message }}</span>
              <span class="text-gray-600 dark:text-gray-400">{{ installProgress.percent }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: installProgress.percent + '%' }"
              ></div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="cancelInstall"
            :disabled="installing"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
          >
            取消
          </button>
          <button
            @click="confirmInstall"
            :disabled="!selectedFile || installing"
            class="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ installing ? '安装中...' : '安装' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePluginsStore } from '../../stores/plugins';
import type { PluginInstance } from '../../plugins/types';

const emit = defineEmits<{
  'open-plugin-settings': [pluginId: string]
}>();

const pluginsStore = usePluginsStore();

// 搜索和过滤
const searchText = ref('');
const statusFilter = ref('');
const typeFilter = ref('');

// 安装相关
const showInstallDialog = ref(false);
const selectedFile = ref<File | null>(null);
const installing = ref(false);
const installProgress = ref<{ message: string; percent: number } | null>(null);
const fileInput = ref<HTMLInputElement>();

// 计算属性
const allPlugins = computed(() => pluginsStore.allPlugins);
const enabledPlugins = computed(() => allPlugins.value.filter(p => p.status === 'enabled'));
const disabledPlugins = computed(() => allPlugins.value.filter(p => p.status === 'disabled'));
const errorPlugins = computed(() => allPlugins.value.filter(p => p.status === 'error'));

const filteredPlugins = computed(() => {
  let plugins = allPlugins.value;
  
  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    plugins = plugins.filter(plugin =>
      plugin.manifest.name.toLowerCase().includes(search) ||
      plugin.manifest.description.toLowerCase().includes(search) ||
      plugin.manifest.author.toLowerCase().includes(search)
    );
  }
  
  // 状态过滤
  if (statusFilter.value) {
    plugins = plugins.filter(plugin => plugin.status === statusFilter.value);
  }
  
  // 类型过滤
  if (typeFilter.value) {
    plugins = plugins.filter(plugin => plugin.manifest.type === typeFilter.value);
  }
  
  return plugins;
});

// 检查插件是否有设置
function hasSettings(plugin: PluginInstance): boolean {
  try {
    return plugin.plugin.getSettings && typeof plugin.plugin.getSettings === 'function';
  } catch {
    return false;
  }
}

// 获取状态样式类
function getStatusClass(status: string): string {
  switch (status) {
    case 'enabled':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
    case 'disabled':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    case 'error':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }
}

// 获取状态文本
function getStatusText(status: string): string {
  switch (status) {
    case 'enabled':
      return '已启用';
    case 'disabled':
      return '已禁用';
    case 'error':
      return '错误';
    case 'loading':
      return '加载中';
    default:
      return '未知';
  }
}

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

// 格式化日期
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// 切换插件状态
async function togglePlugin(plugin: PluginInstance) {
  if (!hasSettings(plugin)) {
    alert('此插件未实现必需的设置方法，无法启用。');
    return;
  }
  
  try {
    if (plugin.status === 'enabled') {
      await pluginsStore.disablePlugin(plugin.manifest.id);
    } else {
      await pluginsStore.enablePlugin(plugin.manifest.id);
    }
  } catch (error) {
    console.error('切换插件状态失败:', error);
    alert('操作失败，请查看控制台了解详情。');
  }
}

// 卸载插件
async function uninstallPlugin(plugin: PluginInstance) {
  if (!confirm(`确定要卸载插件 "${plugin.manifest.name}" 吗？此操作不可撤销。`)) {
    return;
  }
  
  try {
    await pluginsStore.uninstallPlugin(plugin.manifest.id);
    console.log('插件卸载成功:', plugin.manifest.name);
  } catch (error) {
    console.error('卸载插件失败:', error);
    alert('卸载失败，请查看控制台了解详情。');
  }
}

// 安装插件
function installPlugin() {
  showInstallDialog.value = true;
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
}

// 确认安装
async function confirmInstall() {
  if (!selectedFile.value) return;
  
  installing.value = true;
  installProgress.value = { message: '正在验证文件...', percent: 0 };
  
  try {
    // 模拟安装进度
    const steps = [
      { message: '正在验证文件...', percent: 10 },
      { message: '正在解压插件...', percent: 30 },
      { message: '正在验证清单...', percent: 50 },
      { message: '正在安装插件...', percent: 70 },
      { message: '正在加载插件...', percent: 90 },
      { message: '安装完成', percent: 100 }
    ];
    
    for (const step of steps) {
      installProgress.value = step;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 调用实际的安装方法
    await pluginsStore.installPluginFromFile(selectedFile.value);
    
    // 安装成功
    showInstallDialog.value = false;
    selectedFile.value = null;
    
  } catch (error) {
    console.error('安装插件失败:', error);
    alert('安装失败：' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    installing.value = false;
    installProgress.value = null;
  }
}

// 取消安装
function cancelInstall() {
  if (!installing.value) {
    showInstallDialog.value = false;
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

onMounted(() => {
  // 初始化插件系统
  if (!pluginsStore.isInitialized) {
    pluginsStore.initialize();
  }
});
</script>


