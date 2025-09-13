<template>
  <div class="h-full bg-gray-50 dark:bg-dark-900 overflow-auto">
    <div class="max-w-4xl mx-auto p-6">
      <!-- 设置页面头部 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ t('settings.title') }}</h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('settings.subtitle') }}
        </p>
      </div>
      
      <!-- 设置选项卡 -->
      <div class="mb-6">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="py-2 px-1 border-b-2 font-medium text-sm"
            :class="{
              'border-primary-500 text-primary-600 dark:text-primary-400': activeTab === tab.id,
              'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== tab.id
            }"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>
      
      <!-- 通用设置 -->
      <div v-if="activeTab === 'general'" class="space-y-6">
        <!-- 主题设置 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.appearance.title') }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.appearance.theme') }}
              </label>
              <div class="flex space-x-4">
                <label
                  v-for="themeOption in themeOptions"
                  :key="themeOption.value"
                  class="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    v-model="selectedTheme"
                    type="radio"
                    :value="themeOption.value"
                    class="text-primary-600 focus:ring-primary-500"
                    @change="updateTheme"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ themeOption.label }}</span>
                </label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.appearance.fontSize') }}
              </label>
              <div class="flex items-center space-x-4">
                <input
                  v-model="fontSize"
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  class="flex-1"
                  @change="updateFontSize"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300 w-12">{{ fontSize }}px</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 语言设置 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.language.title') }}</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('settings.language.interface') }}
            </label>
            <select
              v-model="selectedLanguage"
              class="input w-48"
              @change="updateLanguage"
            >
              <option value="zh-CN">{{ t('settings.language.chinese') }}</option>
              <option value="en-US">{{ t('settings.language.english') }}</option>
            </select>
          </div>
        </div>
        
        <!-- 工作目录设置 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">工作目录</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                当前工作目录
              </label>
              <div class="flex items-center space-x-3">
                <input
                  v-model="settingsStore.workspaceDirectory"
                  type="text"
                  class="input flex-1"
                  readonly
                  placeholder="选择工作目录..."
                />
                <button
                  @click="selectWorkspaceDirectory"
                  class="btn btn-secondary px-4 py-2"
                >
                  选择目录
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                工作目录是存储所有笔记文件的位置
              </p>
            </div>
          </div>
        </div>
        
        <!-- 用户信息 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.user.title') }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.user.username') }}
              </label>
              <input
                v-model="userName"
                type="text"
                class="input w-64"
                @blur="updateUserName"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.user.email') }}
              </label>
              <input
                v-model="userEmail"
                type="email"
                class="input w-64"
                @blur="updateUserEmail"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 编辑器设置 -->
      <div v-if="activeTab === 'editor'" class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.editor.title') }}</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('settings.editor.autoSave') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('settings.editor.autoSaveDesc') }}
                </p>
              </div>
              <div class="toggle-switch">
                <input
                  v-model="autoSave"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </div>
            </div>
            
            <div v-if="autoSave">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.editor.autoSaveInterval') }}
              </label>
              <input
                v-model="autoSaveInterval"
                type="number"
                min="5"
                max="300"
                class="input w-24"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('settings.editor.showLineNumbers') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('settings.editor.showLineNumbersDesc') }}
                </p>
              </div>
              <div class="toggle-switch">
                <input
                  v-model="showLineNumbers"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('settings.editor.wordWrap') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('settings.editor.wordWrapDesc') }}
                </p>
              </div>
              <div class="toggle-switch">
                <input
                  v-model="wordWrap"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 复习设置 -->
      <div v-if="activeTab === 'review'" class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.review.title') }}</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('settings.review.notifications') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('settings.review.notificationsDesc') }}
                </p>
              </div>
              <div class="toggle-switch">
                <input
                  v-model="reviewNotifications"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('settings.review.sound') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('settings.review.soundDesc') }}
                </p>
              </div>
              <div class="toggle-switch">
                <input
                  v-model="reviewSound"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.review.dailyGoal') }}
              </label>
              <input
                v-model="dailyReviewGoal"
                type="number"
                min="1"
                max="100"
                class="input w-24"
              />
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">{{ t('settings.review.notes') }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 关于 -->
      <div v-if="activeTab === 'about'" class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.about.title') }}</h3>
          
          <div class="space-y-4">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-xl font-semibold text-gray-900 dark:text-gray-100">MemoryNote</h4>
                <p class="text-gray-600 dark:text-gray-400">{{ t('settings.about.version') }}</p>
              </div>
            </div>
            
            <p class="text-gray-700 dark:text-gray-300">
              {{ t('settings.about.description') }}
            </p>
            
            <div class="pt-4 border-t border-gray-200 dark:border-dark-600">
              <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">{{ t('settings.about.techStack') }}</h5>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs">
                  Electron
                </span>
                <span class="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded text-xs">
                  Vue 3
                </span>
                <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded text-xs">
                  TypeScript
                </span>
                <span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded text-xs">
                  SQLite
                </span>
                <span class="px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300 rounded text-xs">
                  Tailwind CSS
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 重置设置 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('settings.reset.title') }}</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ t('settings.reset.description') }}
          </p>
          <button
            @click="resetAllSettings"
            class="btn btn-secondary"
          >
            {{ t('settings.reset.button') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../stores/settings';
import type { Theme, Language } from '../stores/settings';

const { t } = useI18n();
const settingsStore = useSettingsStore();

// 响应式状态
const activeTab = ref('general');

const tabs = computed(() => [
  { id: 'general', name: t('settings.tabs.general') },
  { id: 'editor', name: t('settings.tabs.editor') },
  { id: 'review', name: t('settings.tabs.review') },
  { id: 'about', name: t('settings.tabs.about') },
]);

const themeOptions = computed(() => [
  { value: 'light', label: t('settings.theme.light') },
  { value: 'dark', label: t('settings.theme.dark') },
  { value: 'auto', label: t('settings.theme.auto') },
]);

// 计算属性
const selectedTheme = computed({
  get: () => settingsStore.theme,
  set: (value: Theme) => settingsStore.setTheme(value)
});

const selectedLanguage = computed({
  get: () => settingsStore.language,
  set: (value: Language) => settingsStore.setLanguage(value)
});

const fontSize = computed({
  get: () => settingsStore.fontSize,
  set: (value: number) => settingsStore.setFontSize(value)
});

const userName = computed({
  get: () => settingsStore.userName,
  set: (value: string) => settingsStore.setUserName(value)
});

const userEmail = computed({
  get: () => settingsStore.userEmail,
  set: (value: string) => settingsStore.userEmail = value
});

const autoSave = computed({
  get: () => settingsStore.autoSave,
  set: (value: boolean) => settingsStore.autoSave = value
});

const autoSaveInterval = computed({
  get: () => settingsStore.autoSaveInterval,
  set: (value: number) => settingsStore.autoSaveInterval = value
});

const showLineNumbers = computed({
  get: () => settingsStore.showLineNumbers,
  set: (value: boolean) => settingsStore.showLineNumbers = value
});

const wordWrap = computed({
  get: () => settingsStore.wordWrap,
  set: (value: boolean) => settingsStore.wordWrap = value
});

const reviewNotifications = computed({
  get: () => settingsStore.reviewNotifications,
  set: (value: boolean) => settingsStore.reviewNotifications = value
});

const reviewSound = computed({
  get: () => settingsStore.reviewSound,
  set: (value: boolean) => settingsStore.reviewSound = value
});

const dailyReviewGoal = computed({
  get: () => settingsStore.dailyReviewGoal,
  set: (value: number) => settingsStore.dailyReviewGoal = value
});

// 方法
function updateTheme() {
  settingsStore.saveSettings();
}

function updateLanguage() {
  settingsStore.saveSettings();
}

function updateFontSize() {
  settingsStore.saveSettings();
}

function updateUserName() {
  settingsStore.saveSettings();
}

function updateUserEmail() {
  settingsStore.saveSettings();
}

function resetAllSettings() {
  if (confirm(t('settings.reset.confirm'))) {
    settingsStore.resetSettings();
  }
}

async function selectWorkspaceDirectory() {
  try {
    const result = await window.electronAPI.fs.showOpenDirectoryDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      settingsStore.setWorkspaceDirectory(selectedPath);
      
      // 提示用户重启应用以应用更改
      alert('工作目录已更改。为了确保所有功能正常工作，建议重启应用程序。');
    }
  } catch (error) {
    console.error('选择工作目录失败:', error);
    alert('选择工作目录失败，请重试。');
  }
}

onMounted(() => {
  settingsStore.loadSettings();
});
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  cursor: pointer;
  z-index: 1;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 24px;
  border: 2px solid transparent;
  z-index: 0;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #3b82f6;
  border-color: #2563eb;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-switch input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.toggle-switch:hover .toggle-slider {
  background-color: #94a3b8;
}

.toggle-switch input:checked:hover + .toggle-slider {
  background-color: #2563eb;
}

/* Dark mode styles */
.dark .toggle-slider {
  background-color: #4b5563;
}

.dark .toggle-switch:hover .toggle-slider {
  background-color: #6b7280;
}

.dark .toggle-switch input:checked + .toggle-slider {
  background-color: #3b82f6;
  border-color: #2563eb;
}

.dark .toggle-switch input:checked:hover + .toggle-slider {
  background-color: #2563eb;
}
</style>
