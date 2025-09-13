<template>
  <div class="h-full bg-gray-50 dark:bg-dark-900 overflow-auto">
    <div class="max-w-4xl mx-auto p-6">
      <!-- 设置页面头部 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">设置</h1>
        <p class="text-gray-600 dark:text-gray-400">
          个性化你的知识库体验
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">外观</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                主题
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
                字体大小
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">语言</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              界面语言
            </label>
            <select
              v-model="selectedLanguage"
              class="input w-48"
              @change="updateLanguage"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
        
        <!-- 用户信息 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">用户信息</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名
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
                邮箱
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">编辑器</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  自动保存
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  编辑时自动保存笔记
                </p>
              </div>
              <input
                v-model="autoSave"
                type="checkbox"
                class="toggle"
              />
            </div>
            
            <div v-if="autoSave">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                自动保存间隔（秒）
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
                  显示行号
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  在编辑器中显示行号
                </p>
              </div>
              <input
                v-model="showLineNumbers"
                type="checkbox"
                class="toggle"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  自动换行
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  长行自动换行显示
                </p>
              </div>
              <input
                v-model="wordWrap"
                type="checkbox"
                class="toggle"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 复习设置 -->
      <div v-if="activeTab === 'review'" class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">复习提醒</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  桌面通知
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  有复习任务时显示桌面通知
                </p>
              </div>
              <input
                v-model="reviewNotifications"
                type="checkbox"
                class="toggle"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  提示音
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  复习提醒时播放提示音
                </p>
              </div>
              <input
                v-model="reviewSound"
                type="checkbox"
                class="toggle"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                每日复习目标
              </label>
              <input
                v-model="dailyReviewGoal"
                type="number"
                min="1"
                max="100"
                class="input w-24"
              />
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">个笔记</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 关于 -->
      <div v-if="activeTab === 'about'" class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">关于 MemoryNote</h3>
          
          <div class="space-y-4">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-xl font-semibold text-gray-900 dark:text-gray-100">MemoryNote</h4>
                <p class="text-gray-600 dark:text-gray-400">版本 1.0.0</p>
              </div>
            </div>
            
            <p class="text-gray-700 dark:text-gray-300">
              基于艾宾浩斯遗忘曲线的个人知识库系统，帮助你更高效地学习和记忆。
            </p>
            
            <div class="pt-4 border-t border-gray-200 dark:border-dark-600">
              <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">技术栈</h5>
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">重置设置</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            将所有设置恢复为默认值。此操作不会删除你的笔记数据。
          </p>
          <button
            @click="resetAllSettings"
            class="btn btn-secondary"
          >
            重置所有设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSettingsStore } from '../stores/settings';
import type { Theme, Language } from '../stores/settings';

const settingsStore = useSettingsStore();

// 响应式状态
const activeTab = ref('general');

const tabs = [
  { id: 'general', name: '通用' },
  { id: 'editor', name: '编辑器' },
  { id: 'review', name: '复习' },
  { id: 'about', name: '关于' },
];

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统' },
];

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
  if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
    settingsStore.resetSettings();
  }
}

onMounted(() => {
  settingsStore.loadSettings();
});
</script>

<style scoped>
.toggle {
  @apply relative inline-flex h-6 w-11 items-center rounded-full;
  @apply bg-gray-200 dark:bg-dark-600;
  @apply transition-colors duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

.toggle:checked {
  @apply bg-primary-600;
}

.toggle:before {
  @apply absolute left-1 top-1 h-4 w-4 rounded-full bg-white;
  @apply transition-transform duration-200 ease-in-out;
  content: '';
}

.toggle:checked:before {
  @apply translate-x-5;
}
</style>
