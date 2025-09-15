<template>
  <div class="sidebar w-16 h-full flex flex-col">
    <!-- 导航菜单 -->
    <nav class="flex-1 p-2">
      <div class="space-y-1">
        <!-- 文档 -->
        <router-link
          to="/"
          class="nav-icon-item"
          :class="{ 'nav-icon-item-active': isDocumentSection }"
          :title="t('nav.documents')"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5zM7.5 10a.5.5 0 01.5-.5h4a.5.5 0 010 1H8a.5.5 0 01-.5-.5zm.5-2.5a.5.5 0 000 1h4a.5.5 0 000-1H8z" clip-rule="evenodd"/>
          </svg>
          <span v-if="notesCount > 0" class="nav-icon-badge">{{ notesCount }}</span>
        </router-link>
        
        <!-- 订阅 -->
        <button class="nav-icon-item" @click="showSubscriptions" :title="t('nav.subscriptions')">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
        </button>
        
        <!-- 复习计划 -->
        <router-link
          to="/review"
          class="nav-icon-item"
          :class="{ 'nav-icon-item-active': $route.name === 'ReviewCenter' }"
          :title="t('nav.review')"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <span v-if="dueReviewsCount > 0" class="nav-icon-badge bg-red-500 text-white">{{ dueReviewsCount }}</span>
        </router-link>
        
        <!-- 日记 -->
        <button class="nav-icon-item" @click="showDiary" :title="t('nav.diary')">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        
        <!-- 插件页面 -->
        <template v-if="pluginPages.length > 0">
          <router-link
            v-for="page in pluginPages"
            :key="page.id"
            :to="`/plugin/${page.id}`"
            class="nav-icon-item"
            :class="{ 'nav-icon-item-active': $route.params.pageId === page.id }"
            :title="page.title"
          >
            <div v-if="page.icon" v-html="page.icon" class="w-5 h-5"></div>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
            </svg>
          </router-link>
        </template>

        <!-- 插件功能按钮 -->
        <template v-if="visiblePluginButtons.length > 0">
          <button
            v-for="button in visiblePluginButtons"
            :key="`plugin-btn-${button.pluginId}`"
            @click="handlePluginButtonClick(button)"
            class="nav-icon-item"
            :title="button.tooltip || button.title"
          >
            <div v-if="button.icon" v-html="button.icon" class="w-5 h-5"></div>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
            </svg>
          </button>
        </template>
        
      </div>
      
      <!-- 分隔线 -->
      <div class="border-t border-gray-200 dark:border-dark-600 my-4"></div>
      
      <!-- 快速操作 -->
      <div class="space-y-1">
        <button
          @click="createNewNote"
          class="nav-icon-item"
          :title="t('sidebar.newNote')"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <button
          @click="importFiles"
          class="nav-icon-item"
          :title="t('sidebar.importFiles')"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </nav>
    
    <!-- 底部设置按钮 -->
    <div class="p-2 border-t border-gray-200 dark:border-dark-600">
      <router-link
        to="/settings"
        class="nav-icon-item"
        :class="{ 'nav-icon-item-active': $route.name === 'Settings' }"
        :title="t('nav.settings')"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
        </svg>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNotesStore } from '../../stores/notes';
import { useReviewsStore } from '../../stores/reviews';
import { usePluginsStore } from '../../stores/plugins';
import { useAppStore } from '../../stores/app';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const notesStore = useNotesStore();
const reviewsStore = useReviewsStore();
const appStore = useAppStore();
const pluginsStore = usePluginsStore();

// 计算属性
const notesCount = computed(() => notesStore.notes.length);
const dueReviewsCount = computed(() => reviewsStore.dueReviews.length);
const pluginsCount = computed(() => pluginsStore.enabledPluginsList.length);

// 判断是否在文档相关的页面（Dashboard 或 NoteEditor）
const isDocumentSection = computed(() => {
  return route.name === 'Dashboard' || route.name === 'NoteEditor';
});

// 插件图标显示控制
const showPluginIcon = ref(true);


// 插件页面
const pluginPagesUpdateTrigger = ref(0);
const pluginPages = computed(() => {
  // 依赖更新触发器以确保响应式更新
  pluginPagesUpdateTrigger.value;
  
  // 检查插件管理器是否就绪
  if (!pluginsStore.isManagerReady) {
    return [];
  }
  
  const manager = pluginsStore.pluginManager;
  if (!manager) {
    return [];
  }
  
  try {
    return manager.getRegisteredPages().filter(page => page.showInSidebar !== false);
  } catch (error) {
    console.error('获取插件页面失败:', error);
    return [];
  }
});

// 可见的插件侧边栏按钮
const visiblePluginButtons = computed(() => {
  // 依赖更新触发器以确保响应式更新
  pluginPagesUpdateTrigger.value;
  
  if (!pluginsStore.isManagerReady) {
    return [];
  }
  
  try {
    const manager = pluginsStore.pluginManager;
    if (!manager) return [];
    
    // 从插件管理器获取注册的侧边栏按钮
    const registeredButtons = manager.getRegisteredSidebarButtons?.() || [];
    const sidebarSettings = JSON.parse(localStorage.getItem('plugin-sidebar-settings') || '{}');
    
    return registeredButtons
      .filter(button => {
        // 安全检查：只显示启用插件的按钮
        const pluginInstance = manager.getPlugin(button.pluginId);
        if (!pluginInstance || pluginInstance.status !== 'enabled') {
          console.log(`🔒 过滤掉未启用插件的按钮: ${button.pluginId} (状态: ${pluginInstance?.status || 'not found'})`);
          return false;
        }
        
        // 检查设置中是否允许显示（默认为true）
        return sidebarSettings[button.pluginId] !== false;
      })
      .sort((a, b) => (a.position || 999) - (b.position || 999));
  } catch (error) {
    console.error('获取插件侧边栏按钮失败:', error);
    return [];
  }
});

// 方法
async function createNewNote() {
  try {
    const newNote = await notesStore.createNote({
      title: '新建笔记',
      content: '',
      category: '',
      tags: '',
    });
    
    // 打开新笔记
    appStore.openTab({
      id: newNote.id!.toString(),
      title: newNote.title,
      type: 'note'
    });
    
    router.push(`/note/${newNote.id}`);
  } catch (error) {
    console.error('创建笔记失败:', error);
  }
}

async function importFiles() {
  try {
    const result = await window.electronAPI.fs.showOpenDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      // TODO: 实现文件导入逻辑
      console.log('导入文件:', result.filePaths);
    }
  } catch (error) {
    console.error('导入文件失败:', error);
  }
}

function showSubscriptions() {
  // TODO: 实现订阅功能
  console.log('显示订阅');
}

// 处理插件按钮点击
function handlePluginButtonClick(button: any) {
  try {
    console.log('插件按钮点击:', button.title, button);
    
    const manager = pluginsStore.pluginManager;
    if (!manager) {
      console.warn('插件管理器不可用');
      return;
    }
    
    // 安全检查：确认插件仍然是启用状态
    const pluginInstance = manager.getPlugin(button.pluginId);
    if (!pluginInstance) {
      console.error(`🚫 插件 ${button.pluginId} 不存在，拒绝执行按钮操作`);
      return;
    }
    
    if (pluginInstance.status !== 'enabled') {
      console.error(`🚫 插件 ${button.pluginId} 未启用 (状态: ${pluginInstance.status})，拒绝执行按钮操作`);
      // 触发UI更新以移除过时的按钮
      pluginPagesUpdateTrigger.value++;
      return;
    }
    
    // 验证API实例存在
    if (!pluginInstance.api) {
      console.error(`🚫 插件 ${button.pluginId} API实例不存在，拒绝执行按钮操作`);
      return;
    }
    
    // 执行按钮的点击处理函数
    if (button.onClick && typeof button.onClick === 'function') {
      button.onClick();
    } else {
      console.warn('按钮没有定义点击处理函数:', button);
    }
  } catch (error) {
    console.error('处理插件按钮点击失败:', error);
  }
}

function showDiary() {
  // TODO: 实现日记功能
  console.log('显示日记');
}


onMounted(() => {
  // 加载数据
  notesStore.loadNotes();
  reviewsStore.loadDueReviews();
  
  // 加载插件图标显示设置
  try {
    const savedPluginSettings = localStorage.getItem('plugin-settings');
    if (savedPluginSettings) {
      const settings = JSON.parse(savedPluginSettings);
      showPluginIcon.value = settings.showPluginIcon ?? true;
    }
  } catch (error) {
    console.error('加载插件设置失败:', error);
  }

  // 监听侧边栏设置变化
  window.addEventListener('plugin-sidebar-settings-changed', () => {
    // 触发响应式更新
    pluginPagesUpdateTrigger.value++;
  });
});

// 监听插件管理器就绪状态
watch(() => pluginsStore.isManagerReady, (isReady) => {
  if (isReady && pluginsStore.pluginManager) {
    // 设置插件页面事件监听器
    const manager = pluginsStore.pluginManager;
    
    manager.on('page:registered', () => {
      pluginPagesUpdateTrigger.value++;
    });
    
    manager.on('page:unregistered', () => {
      pluginPagesUpdateTrigger.value++;
    });
    
    // 监听插件启用/禁用事件
    manager.on('plugin:enabled', () => {
      setTimeout(() => {
        pluginPagesUpdateTrigger.value++;
      }, 100); // 短暂延时确保页面已注册
    });
    
    manager.on('plugin:disabled', () => {
      pluginPagesUpdateTrigger.value++;
    });
    
    // 监听侧边栏按钮注册/注销事件
    manager.on('sidebar-button:registered', () => {
      pluginPagesUpdateTrigger.value++;
    });
    
    manager.on('sidebar-button:unregistered', () => {
      pluginPagesUpdateTrigger.value++;
    });
    
    manager.on('sidebar-button:updated', () => {
      pluginPagesUpdateTrigger.value++;
    });
    
    // 监听插件UI更新事件
    manager.on('plugin:ui-update', (event) => {
      console.log('🔄 插件UI更新事件:', event);
      pluginPagesUpdateTrigger.value++;
    });
    
    // 立即触发一次更新以显示已注册的页面
    pluginPagesUpdateTrigger.value++;
  }
}, { immediate: true });
</script>

<style scoped>
.nav-icon-item {
  @apply relative flex items-center justify-center w-12 h-12 rounded-lg;
  @apply text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
  @apply cursor-pointer;
}

.nav-icon-item-active {
  @apply bg-primary-100 dark:bg-primary-900/20;
  @apply text-primary-700 dark:text-primary-300;
}

.nav-icon-badge {
  @apply absolute -top-1 -right-1 inline-flex items-center justify-center;
  @apply min-w-[18px] h-[18px] px-1 text-xs font-bold;
  @apply bg-primary-100 text-primary-800 rounded-full;
  @apply dark:bg-primary-900/20 dark:text-primary-300;
  @apply border-2 border-white dark:border-dark-800;
}

/* 悬浮提示样式增强 */
.nav-icon-item[title]:hover::after {
  content: attr(title);
  @apply absolute left-full ml-2 px-2 py-1 text-xs;
  @apply bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900;
  @apply rounded whitespace-nowrap z-50;
  @apply opacity-0 animate-fade-in;
  animation-delay: 0.5s;
  animation-fill-mode: forwards;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-in-out;
}
</style>
