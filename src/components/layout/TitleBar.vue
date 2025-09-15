<template>
  <div class="titlebar h-12 flex items-center justify-between px-4 select-none" style="-webkit-app-region: drag">
    <!-- 左侧：应用图标和控制按钮 -->
    <div class="flex items-center space-x-3" style="-webkit-app-region: no-drag">
      <!-- 应用图标 -->
      <div class="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      
      <!-- 文件列表切换按钮 -->
      <button
        @click="toggleFilePanel"
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        :title="t('titleBar.toggleFilePanel')"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
        </svg>
      </button>
      
      <!-- 搜索按钮 -->
      <button
        @click="toggleSearch"
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        :title="t('titleBar.search')"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
      </button>
      
      <!-- 分屏模式切换按钮 -->
      <button
        @click="toggleSplitMode"
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        :class="{ 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': isSplitModeEnabled }"
        :title="isSplitModeEnabled ? '关闭分屏模式' : '启用分屏模式'"
      >
        <svg v-if="!isSplitModeEnabled" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h8v18H3V3zm10 0h8v18h-8V3z"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h18v18H3V3z"/>
        </svg>
      </button>
    </div>
    
    <!-- 中间：标题 -->
    <div class="flex-1 text-center">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ currentTitle }}
      </span>
    </div>
    
    <!-- 右侧：用户头像和窗口控制 -->
    <div class="flex items-center space-x-2" style="-webkit-app-region: no-drag">
      <!-- 右侧栏切换按钮 -->
      <button
        @click="toggleRightSidebar"
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        :class="{ 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': appStore.showRightSidebar }"
        :title="t('titleBar.toggleRightSidebar')"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 16a1 1 0 01-1-1v-5a1 1 0 011-1h6a1 1 0 110 2h-6v4a1 1 0 01-1 1z" clip-rule="evenodd"/>
        </svg>
      </button>
      
      <!-- 用户头像 -->
      <div class="relative">
        <button
          @click="showUserMenu = !showUserMenu"
          class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
          :title="t('titleBar.userMenu')"
        >
          <span class="text-sm font-medium">{{ userInitial }}</span>
        </button>
        
        <!-- 用户菜单 -->
        <transition name="fade">
          <div
            v-if="showUserMenu"
            class="absolute right-0 top-10 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 py-2 z-50"
          >
            <div class="px-4 py-2 border-b border-gray-200 dark:border-dark-600">
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ settingsStore.userName }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ settingsStore.userEmail || t('user.notSetEmail') }}</div>
            </div>
            <button
              @click="goToPersonalSpace"
              class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
            >
              {{ t('nav.personalSpace') }}
            </button>
            <button
              @click="goToReviewReminder"
              class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
            >
              {{ t('nav.studyReminder') }}
            </button>
          </div>
        </transition>
      </div>
      
      <!-- 窗口控制按钮 -->
      <div class="flex items-center">
        <button
          @click="minimizeWindow"
          class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
          :title="t('titleBar.minimize')"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z"/>
          </svg>
        </button>
        
        <button
          @click="maximizeWindow"
          class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
          :title="t('titleBar.maximize')"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 10 10">
            <path d="M0 0v10h10V0H0zm1 1h8v8H1V1z"/>
          </svg>
        </button>
        
        <button
          @click="closeWindow"
          class="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded transition-colors"
          :title="t('titleBar.close')"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 10 10">
            <path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../../stores/app';
import { useSettingsStore } from '../../stores/settings';
import { useSplitPanesStore } from '../../stores/splitPanes';

const route = useRoute();
const { t } = useI18n();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
const splitPanesStore = useSplitPanesStore();

const showUserMenu = ref(false);

// 获取标签页管理器引用（从父组件注入）
const getTabManager = inject<() => any>('getTabManager', () => null);

// 计算属性
const currentTitle = computed(() => {
  switch (route.name) {
    case 'Dashboard':
      return t('app.title');
    case 'NoteEditor':
      return t('editor.title');
    case 'ReviewCenter':
      return t('review.title');
    case 'Settings':
      return t('settings.title');
    default:
      return 'MemoryNote';
  }
});

const userInitial = computed(() => {
  return settingsStore.userName.charAt(0).toUpperCase();
});

const isSplitModeEnabled = computed(() => {
  return splitPanesStore.splitEnabled;
});

// 方法
function toggleFilePanel() {
  appStore.toggleFilePanel();
}

function toggleRightSidebar() {
  appStore.toggleRightSidebar();
}

function toggleSearch() {
  // TODO: 实现搜索面板切换
  console.log('切换搜索面板');
}

function toggleSplitMode() {
  const tabManager = getTabManager();
  if (tabManager) {
    if (isSplitModeEnabled.value) {
      tabManager.disableSplitMode();
    } else {
      tabManager.enableSplitMode();
    }
  } else {
    // 直接使用store
    if (isSplitModeEnabled.value) {
      splitPanesStore.disableSplit();
    } else {
      splitPanesStore.enableSplit();
    }
  }
}

function goToPersonalSpace() {
  showUserMenu.value = false;
  // TODO: 导航到个人空间
  console.log('打开个人空间');
}

function goToReviewReminder() {
  showUserMenu.value = false;
  // TODO: 导航到学习提醒
  console.log('打开学习提醒');
}

async function minimizeWindow() {
  try {
    await window.electronAPI.window.minimize();
  } catch (error) {
    console.error('最小化窗口失败:', error);
  }
}

async function maximizeWindow() {
  try {
    await window.electronAPI.window.maximize();
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
}

async function closeWindow() {
  try {
    await window.electronAPI.window.close();
  } catch (error) {
    console.error('关闭窗口失败:', error);
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Element;
  if (!target.closest('.relative')) {
    showUserMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
