<template>
  <div class="space-y-6">
    <!-- 外观设置 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">外观设置</h3>
      
      <div class="space-y-4">
        <!-- 主题选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            主题模式
          </label>
          <div class="grid grid-cols-3 gap-3">
            <label
              v-for="option in themeOptions"
              :key="option.value"
              class="relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-dark-700"
              :class="{
                'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': theme === option.value,
                'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300': theme !== option.value
              }"
            >
              <input
                v-model="theme"
                type="radio"
                :value="option.value"
                @change="onThemeChange"
                class="sr-only"
              />
              <div class="flex flex-col items-center space-y-1">
                <!-- 主题图标 -->
                <div class="w-6 h-6 flex items-center justify-center">
                  <svg v-if="option.value === 'light'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                  </svg>
                  <svg v-else-if="option.value === 'dark'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-xs font-medium">{{ option.label }}</span>
              </div>
              <!-- 选中指示器 -->
              <div v-if="theme === option.value" class="absolute top-1 right-1">
                <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
              </div>
            </label>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            当前主题: {{ theme }}
          </p>
        </div>
        
        <!-- 字体大小 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            字体大小: <span class="text-primary-600 dark:text-primary-400">{{ fontSize }}px</span>
          </label>
          <div class="relative">
            <input
              v-model="fontSize"
              type="range"
              min="12"
              max="24"
              @input="onFontSizeChange"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <!-- 滑块标记 -->
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>12px</span>
              <span>18px</span>
              <span>24px</span>
            </div>
          </div>
        </div>
        
        <!-- 语言选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            界面语言
          </label>
          <div class="relative">
            <select
              v-model="language"
              class="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg dark:bg-dark-700 bg-white shadow-sm hover:border-gray-300 dark:hover:border-gray-500 transition-colors appearance-none"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
            <!-- 自定义下拉箭头 -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 用户信息 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">用户信息</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            用户名
          </label>
          <input
            v-model="userName"
            type="text"
            class="mt-1 block w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 bg-white hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            placeholder="请输入用户名"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            邮箱
          </label>
          <input
            v-model="userEmail"
            type="email"
            class="mt-1 block w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 bg-white hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            placeholder="请输入邮箱地址"
          />
        </div>
      </div>
    </div>
    
    <!-- 工作目录设置 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">工作目录</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            笔记存储目录
          </label>
          <div class="flex items-center space-x-3">
            <input
              v-model="workspaceDirectory"
              type="text"
              readonly
              class="flex-1 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              :placeholder="workspaceDirectory || '请选择工作目录'"
            />
            <button
              @click="selectWorkspaceDirectory"
              class="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
              <span>选择目录</span>
            </button>
            <button
              @click="resetWorkspaceDirectory"
              class="px-4 py-2.5 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>重置</span>
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            选择您的笔记和文档存储位置。更改后需要重启应用以生效。
          </p>
          
          <!-- 目录信息 -->
          <div v-if="workspaceDirectory" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="flex items-start space-x-2">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <div class="flex-1 text-sm">
                <p class="text-blue-800 dark:text-blue-200 font-medium">当前工作目录</p>
                <p class="text-blue-600 dark:text-blue-300 font-mono text-xs break-all">{{ workspaceDirectory }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 应用行为 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">应用行为</h3>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              启动时恢复上次的窗口大小
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              应用启动时自动恢复上次关闭时的窗口尺寸
            </p>
          </div>
          <ToggleSwitch v-model="restoreWindowSize" />
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              自动保存
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              编辑时自动保存文档内容
            </p>
          </div>
          <ToggleSwitch v-model="autoSave" />
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              开机自启动
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              系统启动时自动启动应用
            </p>
          </div>
          <ToggleSwitch v-model="autoStart" />
        </div>
      </div>
    </div>
    
    <!-- 开发者选项 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">开发者选项</h3>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              开发者模式
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              启用详细的日志输出和调试功能
            </p>
          </div>
          <ToggleSwitch 
            v-model="developerMode" 
            @update:modelValue="toggleDeveloperMode"
          />
        </div>
        
        <div v-if="developerMode" class="ml-4 space-y-3 border-l-2 border-primary-200 dark:border-primary-800 pl-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                控制台日志
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                在浏览器控制台显示详细日志
              </p>
            </div>
            <ToggleSwitch 
              v-model="consoleLogging" 
              @update:modelValue="toggleConsoleLogging"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                插件调试
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                显示插件加载和运行的详细信息
              </p>
            </div>
            <ToggleSwitch 
              v-model="pluginDebugging" 
              @update:modelValue="togglePluginDebugging"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                性能监控
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                监控应用性能并输出性能指标
              </p>
            </div>
            <ToggleSwitch 
              v-model="performanceMonitoring" 
              @update:modelValue="togglePerformanceMonitoring"
            />
          </div>
          
          <!-- 日志级别选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              日志级别
            </label>
            <div class="relative">
              <select
                v-model="logLevel"
                @change="updateLogLevel"
                class="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg dark:bg-dark-700 bg-white shadow-sm hover:border-gray-300 dark:hover:border-gray-500 transition-colors appearance-none"
              >
                <option value="error">错误</option>
                <option value="warn">警告</option>
                <option value="info">信息</option>
                <option value="debug">调试</option>
                <option value="verbose">详细</option>
              </select>
              <!-- 自定义下拉箭头 -->
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useFilesStore } from '../../stores/files';
import { useAppStore } from '../../stores/app';
import { useTabManagerStore } from '../../stores/tabManager';
import ToggleSwitch from '../ui/ToggleSwitch.vue';

const settingsStore = useSettingsStore();
const filesStore = useFilesStore();
const appStore = useAppStore();
const tabManager = useTabManagerStore();

// 设置项
const theme = ref('auto');
const fontSize = ref(14);
const language = ref('zh-CN');
const userName = ref('');
const userEmail = ref('');
const workspaceDirectory = ref('');
const restoreWindowSize = ref(true);
const autoSave = ref(true);
const autoStart = ref(false);

// 开发者模式相关
const developerMode = ref(false);
const consoleLogging = ref(true);
const pluginDebugging = ref(false);
const performanceMonitoring = ref(false);
const logLevel = ref('info');

// 主题选项
const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统' }
];

// 加载设置
function loadSettings() {
  theme.value = settingsStore.theme;
  fontSize.value = settingsStore.fontSize;
  language.value = settingsStore.language;
  userName.value = settingsStore.userName;
  userEmail.value = settingsStore.userEmail;
  workspaceDirectory.value = settingsStore.workspaceDirectory;
  
  // 从localStorage加载其他设置
  try {
    const generalSettings = localStorage.getItem('general-settings');
    if (generalSettings) {
      const settings = JSON.parse(generalSettings);
      restoreWindowSize.value = settings.restoreWindowSize ?? true;
      autoSave.value = settings.autoSave ?? true;
      autoStart.value = settings.autoStart ?? false;
    }
    
    // 加载开发者模式设置
    const devSettings = localStorage.getItem('developer-settings');
    if (devSettings) {
      const settings = JSON.parse(devSettings);
      developerMode.value = settings.developerMode ?? false;
      consoleLogging.value = settings.consoleLogging ?? true;
      pluginDebugging.value = settings.pluginDebugging ?? false;
      performanceMonitoring.value = settings.performanceMonitoring ?? false;
      logLevel.value = settings.logLevel ?? 'info';
    }
  } catch (error) {
    console.error('加载通用设置失败:', error);
  }
}

// 保存设置
function saveSettings() {
  // 保存到settings store
  settingsStore.setTheme(theme.value);
  settingsStore.setFontSize(fontSize.value);
  settingsStore.setLanguage(language.value);
  settingsStore.setUserName(userName.value);
  settingsStore.userEmail = userEmail.value;
  settingsStore.setWorkspaceDirectory(workspaceDirectory.value);
  
  // 保存其他设置到localStorage
  const generalSettings = {
    restoreWindowSize: restoreWindowSize.value,
    autoSave: autoSave.value,
    autoStart: autoStart.value
  };
  localStorage.setItem('general-settings', JSON.stringify(generalSettings));
  
  // 保存开发者模式设置
  saveDeveloperSettings();
  
  console.log('通用设置已保存');
}

// 保存开发者模式设置
function saveDeveloperSettings() {
  const devSettings = {
    developerMode: developerMode.value,
    consoleLogging: consoleLogging.value,
    pluginDebugging: pluginDebugging.value,
    performanceMonitoring: performanceMonitoring.value,
    logLevel: logLevel.value
  };
  localStorage.setItem('developer-settings', JSON.stringify(devSettings));
}

// 重置设置
function resetSettings() {
  theme.value = 'auto';
  fontSize.value = 14;
  language.value = 'zh-CN';
  userName.value = '';
  userEmail.value = '';
  workspaceDirectory.value = '';
  restoreWindowSize.value = true;
  autoSave.value = true;
  autoStart.value = false;
  
  // 重置开发者模式设置
  developerMode.value = false;
  consoleLogging.value = true;
  pluginDebugging.value = false;
  performanceMonitoring.value = false;
  logLevel.value = 'info';
}

// 开发者模式相关方法
function toggleDeveloperMode() {
  saveDeveloperSettings();
  applyDeveloperSettings();
  
  if (developerMode.value) {
    console.log('🔧 开发者模式已启用');
    console.log('📊 当前日志级别:', logLevel.value);
  } else {
    console.log('🔧 开发者模式已禁用');
  }
}

function toggleConsoleLogging() {
  saveDeveloperSettings();
  applyDeveloperSettings();
  console.log('📝 控制台日志:', consoleLogging.value ? '已启用' : '已禁用');
}

function togglePluginDebugging() {
  saveDeveloperSettings();
  applyDeveloperSettings();
  console.log('🔌 插件调试:', pluginDebugging.value ? '已启用' : '已禁用');
}

function togglePerformanceMonitoring() {
  saveDeveloperSettings();
  applyDeveloperSettings();
  
  if (performanceMonitoring.value) {
    console.log('⚡ 性能监控已启用');
    // 开始性能监控
    startPerformanceMonitoring();
  } else {
    console.log('⚡ 性能监控已禁用');
    stopPerformanceMonitoring();
  }
}

function updateLogLevel() {
  saveDeveloperSettings();
  applyDeveloperSettings();
  console.log('📊 日志级别已更新为:', logLevel.value);
}

// 应用开发者模式设置
function applyDeveloperSettings() {
  // 设置全局开发者模式标志
  (window as any).__DEVELOPER_MODE__ = {
    enabled: developerMode.value,
    consoleLogging: consoleLogging.value,
    pluginDebugging: pluginDebugging.value,
    performanceMonitoring: performanceMonitoring.value,
    logLevel: logLevel.value
  };
}

// 开始性能监控
function startPerformanceMonitoring() {
  if (!performanceMonitoring.value) return;
  
  // 监控页面加载性能
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`⚡ [Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
    }
  });
  
  observer.observe({ entryTypes: ['measure', 'navigation'] });
  
  // 定期输出内存使用情况
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory;
      console.log(`🧠 [Memory] Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB, Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }, 10000); // 每10秒输出一次
  }
}

// 停止性能监控
function stopPerformanceMonitoring() {
  // 这里可以添加停止性能监控的逻辑
  console.log('⚡ 性能监控已停止');
}

// 主题变更处理
function onThemeChange() {
  console.log('🎨 主题按钮被点击，当前值:', theme.value);
  settingsStore.setTheme(theme.value);
}

// 字体大小变更处理
function onFontSizeChange() {
  console.log('📏 字体大小变更:', fontSize.value);
  settingsStore.setFontSize(fontSize.value);
}

// 更新全局状态的方法
async function updateGlobalStatesAfterWorkspaceChange() {
  try {
    console.log('🔄 开始更新全局状态...');
    
    // 1. 清理应用状态
    console.log('🧹 清理应用状态...');
    
    // 关闭所有打开的标签页
    tabManager.closeAllTabs();
    
    // 清理当前文件和错误状态
    appStore.setCurrentFile(null);
    appStore.setError(null);
    
    // 2. 重新初始化文件系统状态
    console.log('📁 重新初始化文件系统...');
    
    // 使用 $patch 批量更新状态以提高性能
    filesStore.$patch((state) => {
      // 重置基本状态
      state.currentPath = '';
      state.selectedFile = null;
      state.error = '';
      state.currentWorkingDirectory = '';
      
      // 清空数组（保持响应性）
      if (state.files) {
        state.files.length = 0;
      }
      if (state.treeData) {
        state.treeData.length = 0;
      }
      if (state.expandedNodes) {
        state.expandedNodes.clear();
      }
    });
    
    // 等待一个微任务，确保状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 重新初始化文件系统
    console.log('🔄 重新加载文件系统...');
    await filesStore.initialize();
    
    // 3. 触发相关组件的更新
    console.log('📡 触发界面更新...');
    
    // 可以在这里触发其他需要更新的组件
    // 例如：重新加载面包屑导航、刷新文件面板等
    
    console.log('✅ 全局状态更新完成');
    
    return true;
  } catch (error) {
    console.error('❌ 更新全局状态失败:', error);
    
    // 记录详细错误信息
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return false;
  }
}

// 工作目录相关方法
async function selectWorkspaceDirectory() {
  try {
    const result = await window.electronAPI.fs.showOpenDirectoryDialog();
    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      
      // 确认对话框
      const confirmed = confirm(
        `确定要将工作目录更改为：\n${selectedPath}\n\n这将会：\n• 关闭所有已打开的文件\n• 重新加载文件树\n• 清理当前工作状态\n\n是否继续？`
      );
      
      if (!confirmed) {
        return;
      }
      
      console.log('🔄 开始更改工作目录...');
      
      // 更新工作目录设置
      workspaceDirectory.value = selectedPath;
      settingsStore.setWorkspaceDirectory(selectedPath);
      
      // 更新全局状态
      const updateSuccess = await updateGlobalStatesAfterWorkspaceChange();
      
      if (updateSuccess) {
        console.log('✅ 工作目录更改完成:', selectedPath);
        alert('工作目录已成功更改并重新加载！');
      } else {
        console.warn('⚠️ 工作目录已更改，但部分状态更新失败');
        alert('工作目录已更改，但建议重启应用以确保所有功能正常。');
      }
    }
  } catch (error) {
    console.error('❌ 选择工作目录失败:', error);
    alert('选择工作目录失败，请重试。');
  }
}

async function resetWorkspaceDirectory() {
  try {
    // 确认对话框
    const confirmed = confirm(
      '确定要重置工作目录为默认位置吗？\n\n这将会：\n• 关闭所有已打开的文件\n• 重新加载文件树\n• 清理当前工作状态\n\n是否继续？'
    );
    
    if (!confirmed) {
      return;
    }
    
    console.log('🔄 开始重置工作目录...');
    
    const defaultDir = await window.electronAPI.fs.getWarehouseDir();
    
    // 更新工作目录设置
    workspaceDirectory.value = defaultDir;
    settingsStore.setWorkspaceDirectory(defaultDir);
    
    // 更新全局状态
    const updateSuccess = await updateGlobalStatesAfterWorkspaceChange();
    
    if (updateSuccess) {
      console.log('✅ 工作目录重置完成:', defaultDir);
      alert('工作目录已重置为默认位置并重新加载！');
    } else {
      console.warn('⚠️ 工作目录已重置，但部分状态更新失败');
      alert('工作目录已重置，但建议重启应用以确保所有功能正常。');
    }
  } catch (error) {
    console.error('❌ 重置工作目录失败:', error);
    alert('重置工作目录失败，请重试。');
  }
}

// 监听设置变化并自动保存
function watchSettings() {
  // 监听主题变化
  watch(theme, (newValue) => {
    console.log('📊 watch监听到主题变更:', newValue);
    // 不在这里调用setTheme，避免重复调用
  });
  
  // 监听字体大小变化
  watch(fontSize, (newValue) => {
    console.log('字体大小变更:', newValue);
    settingsStore.setFontSize(newValue);
  });
  
  // 监听语言变化
  watch(language, (newValue) => {
    console.log('语言变更:', newValue);
    settingsStore.setLanguage(newValue);
  });
  
  // 监听用户信息变化
  watch(userName, (newValue) => {
    console.log('用户名变更:', newValue);
    settingsStore.setUserName(newValue);
  });
  
  watch(userEmail, (newValue) => {
    console.log('邮箱变更:', newValue);
    settingsStore.userEmail = newValue;
  });
  
  // 监听工作目录变化
  watch(workspaceDirectory, (newValue) => {
    console.log('工作目录变更:', newValue);
    // 注意：工作目录变更通过按钮操作，这里只是记录
  });
  
  // 监听其他设置变化并保存到localStorage
  watch([restoreWindowSize, autoSave, autoStart], () => {
    const generalSettings = {
      restoreWindowSize: restoreWindowSize.value,
      autoSave: autoSave.value,
      autoStart: autoStart.value
    };
    localStorage.setItem('general-settings', JSON.stringify(generalSettings));
    console.log('通用设置已自动保存');
  });
}

onMounted(() => {
  loadSettings();
  watchSettings();
  applyDeveloperSettings();
});

// 暴露方法给父组件
defineExpose({
  saveSettings,
  resetSettings
});
</script>

<style scoped>
/* 自定义滑块样式 */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb:hover {
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* 深色模式下的滑块 */
.dark .slider::-webkit-slider-thumb {
  border: 2px solid #374151;
}

.dark .slider::-moz-range-thumb {
  border: 2px solid #374151;
}
</style>
