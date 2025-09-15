<template>
  <div id="app" class="h-screen flex flex-col">
    <!-- 自定义标题栏 -->
    <TitleBar />
    
    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden" style="min-height: 0;">
      <!-- 侧边栏 - 固定宽度，不需要拖拽 -->
      <Sidebar v-if="appStore.showSidebar" />
      
      <!-- 文件列表/搜索面板 -->
      <div 
        class="file-panel-wrapper"
        :class="{ 
          'file-panel-hidden': !appStore.showFilePanel,
          'file-panel-no-transition': isResizing
        }"
        :style="{ width: appStore.showFilePanel ? `${filePanelWidth}px` : '0px' }"
      >
        <div v-if="appStore.showFilePanel" class="file-panel-content h-full flex flex-col">
          <!-- 文件面板主要内容 -->
          <FilePanel class="flex-1" />
          
          <!-- 左侧栏插件挂载区域 -->
          <div class="border-t border-gray-200 dark:border-gray-700">
            <PluginMountArea location="left_sidebar" />
          </div>
        </div>
      </div>
      
      <!-- 拖拽栏 - 独立于文件面板 -->
      <ResizeHandle 
        v-if="appStore.showFilePanel"
        direction="horizontal" 
        :min-size="200" 
        :max-size="600"
        :current-size="filePanelWidth"
        @resize="handleFilePanelResize"
        @resizeStart="handleResizeStart"
        @resizeEnd="handleResizeEnd"
        @reset="resetFilePanelSize"
      />
      
      <!-- 主编辑区域 -->
      <main class="main-work-area flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- 主内容容器 -->
        <div class="flex-1 flex overflow-hidden">
          <!-- 多标签页管理器 -->
          <div class="flex-1 overflow-hidden">
            <MultiTabManager ref="tabManagerRef" />
          </div>
          
          <!-- 主工作区插件挂载区域 -->
          <div v-if="hasMainAreaPlugins" class="main-area-plugins border-l border-gray-200 dark:border-gray-700 w-80">
            <PluginMountArea location="main_area" />
          </div>
        </div>
      </main>
      
      <!-- 右侧拖拽栏 -->
      <ResizeHandle 
        v-if="appStore.showRightSidebar"
        direction="horizontal" 
        :min-size="200" 
        :max-size="600"
        :current-size="rightSidebarWidth"
        :reverse="true"
        @resize="handleRightSidebarResize"
        @resizeStart="handleResizeStart"
        @resizeEnd="handleResizeEnd"
        @reset="resetRightSidebarSize"
      />
      
      <!-- 右侧栏 -->
      <div 
        class="right-sidebar-wrapper"
        :class="{ 
          'right-sidebar-hidden': !appStore.showRightSidebar,
          'right-sidebar-no-transition': isResizing
        }"
        :style="{ width: appStore.showRightSidebar ? `${rightSidebarWidth}px` : '0px' }"
      >
        <RightSidebar 
          v-if="appStore.showRightSidebar" 
          class="right-sidebar-content"
          @close="appStore.toggleRightSidebar"
        />
      </div>
    </div>
    
    <!-- 状态栏 -->
    <StatusBar ref="statusBarRef" class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue';
import TitleBar from './components/layout/TitleBar.vue';
import Sidebar from './components/layout/Sidebar.vue';
import FilePanel from './components/layout/FilePanel.vue';
import StatusBar from './components/layout/StatusBar.vue';
import MultiTabManager from './components/layout/MultiTabManager.vue';
import ResizeHandle from './components/ui/ResizeHandle.vue';
import RightSidebar from './components/layout/RightSidebar.vue';
import PluginMountArea from './components/plugins/PluginMountArea.vue';
import { useSettingsStore } from './stores/settings';
import { useAppStore } from './stores/app';
import { usePluginsStore } from './stores/plugins';
import { useTabManagerStore } from './stores/tabManager';
import { useRouter } from 'vue-router';

const settingsStore = useSettingsStore();
const appStore = useAppStore();
const pluginsStore = usePluginsStore();
const tabManager = useTabManagerStore();
const router = useRouter();

// 检查是否有主工作区插件
const hasMainAreaPlugins = computed(() => {
  if (!pluginsStore.pluginManager) return false;
  
  return pluginsStore.enabledPluginsList.some(plugin => {
    const mountLocation = plugin.manifest.mount_preferences?.default_location;
    return mountLocation === 'main_area';
  });
});

// StatusBar交互接口
const statusBarRef = ref<InstanceType<typeof StatusBar>>();
const tabManagerRef = ref<InstanceType<typeof UniversalTabManager>>();

// 提供StatusBar控制方法给子组件
const statusBarController = {
  updateCursorPosition: (line: number, column: number) => {
    statusBarRef.value?.updateCursorPosition(line, column);
  },
  updateEditorMode: (mode: 'wysiwyg' | 'source' | 'preview' | null) => {
    statusBarRef.value?.updateEditorMode(mode);
  },
  updateSyncStatus: (status: 'synced' | 'syncing' | 'error' | 'offline') => {
    statusBarRef.value?.updateSyncStatus(status);
  }
};

provide('statusBarController', statusBarController);

// 提供标签页管理器访问方法
provide('getTabManager', () => tabManagerRef.value);

// 面板大小控制
const filePanelWidth = ref(320); // 文件面板默认宽度
const rightSidebarWidth = ref(320); // 右侧栏默认宽度
const isResizing = ref(false); // 拖拽状态

// 调整大小处理函数
function handleFilePanelResize(size: number) {
  filePanelWidth.value = size;
}

// 节流保存到本地存储
let saveTimer: number | null = null;
function saveFilePanelWidth(size: number) {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    localStorage.setItem('filePanelWidth', size.toString());
  }, 300);
}

function handleResizeStart() {
  isResizing.value = true;
}

function handleResizeEnd() {
  isResizing.value = false;
  // 拖拽结束时保存尺寸
  saveFilePanelWidth(filePanelWidth.value);
}

function resetFilePanelSize() {
  filePanelWidth.value = 320;
  localStorage.setItem('filePanelWidth', '320');
}

// 右侧栏大小控制
function handleRightSidebarResize(size: number) {
  rightSidebarWidth.value = size;
}

function resetRightSidebarSize() {
  rightSidebarWidth.value = 320;
  localStorage.setItem('rightSidebarWidth', '320');
}

// 从本地存储恢复面板大小
function restorePanelSizes() {
  const savedFilePanelWidth = localStorage.getItem('filePanelWidth');
  const savedRightSidebarWidth = localStorage.getItem('rightSidebarWidth');
  
  if (savedFilePanelWidth) {
    filePanelWidth.value = parseInt(savedFilePanelWidth);
  }
  
  if (savedRightSidebarWidth) {
    rightSidebarWidth.value = parseInt(savedRightSidebarWidth);
  }
}

onMounted(async () => {
  // 初始化应用设置
  await settingsStore.loadSettings();
  
  // 恢复面板大小
  restorePanelSizes();
  
  // 应用主题
  applyTheme();
  
  // 恢复标签页布局
  await restoreTabsOnStartup();
  
  // 初始化插件系统
  try {
    await pluginsStore.initialize();
    console.log('✅ 插件系统初始化完成');
    
    // 监听插件主题重置事件
    const pluginManager = pluginsStore.pluginManager;
    if (pluginManager) {
      pluginManager.on('theme:reset', () => {
        console.log('🔄 收到主题重置事件，重新应用系统主题');
        applyTheme();
      });
    }
  } catch (error) {
    console.error('❌ 插件系统初始化失败:', error);
    
    // 延时重试一次
    setTimeout(async () => {
      console.log('🔄 尝试重新初始化插件系统...');
      try {
        await pluginsStore.reinitialize();
        console.log('✅ 插件系统重新初始化成功');
        
        // 重新设置主题重置事件监听
        const pluginManager = pluginsStore.pluginManager;
        if (pluginManager) {
          pluginManager.on('theme:reset', () => {
            console.log('🔄 收到主题重置事件，重新应用系统主题');
            applyTheme();
          });
        }
      } catch (retryError) {
        console.error('❌ 插件系统重新初始化失败:', retryError);
      }
    }, 2000);
  }
  
  // 应用语言
  // TODO: 实现国际化
});

function applyTheme() {
  const theme = settingsStore.theme;
  const htmlElement = document.documentElement;
  
  if (theme === 'dark') {
    htmlElement.classList.add('dark');
  } else if (theme === 'light') {
    htmlElement.classList.remove('dark');
  } else if (theme === 'auto') {
    // 自动模式：根据系统偏好设置
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }
}

// 恢复标签页布局并导航到活动标签页
async function restoreTabsOnStartup() {
  try {
    console.log('🔄 开始恢复标签页布局...');
    
    // 加载保存的标签页布局
    tabManager.loadLayout();
    
    // 检查是否有活动的标签页
    const activeTab = tabManager.activeTab;
    const totalTabs = tabManager.totalTabCount;
    
    console.log('📊 标签页恢复状态:', {
      totalTabs,
      activeTab: activeTab?.title,
      activeTabRoute: activeTab?.route
    });
    
    if (activeTab && activeTab.route) {
      // 如果有活动标签页，导航到该标签页
      console.log('✅ 恢复到活动标签页:', activeTab.title);
      
      // 根据标签页类型构造路由参数
      if (activeTab.type === 'note' && activeTab.filePath) {
        const fileName = activeTab.title + '.md';
        await router.push({
          path: activeTab.route,
          query: { 
            filePath: activeTab.filePath,
            fileName: fileName
          }
        });
      } else {
        await router.push(activeTab.route);
      }
    } else if (totalTabs === 0) {
      // 如果没有任何标签页，导航到仪表盘并创建仪表盘标签页
      console.log('📋 没有标签页，创建仪表盘标签页');
      
      tabManager.openTab({
        title: '仪表盘',
        type: 'dashboard',
        route: '/'
      });
      
      await router.push('/');
    } else {
      // 有标签页但没有活动标签页，激活第一个标签页
      const firstTabWithPane = tabManager.allTabs[0];
      if (firstTabWithPane) {
        console.log('🔄 激活第一个标签页:', firstTabWithPane.title);
        tabManager.setActiveTab(firstTabWithPane.id, firstTabWithPane.paneId);
        
        if (firstTabWithPane.type === 'note' && firstTabWithPane.filePath) {
          const fileName = firstTabWithPane.title + '.md';
          await router.push({
            path: firstTabWithPane.route,
            query: { 
              filePath: firstTabWithPane.filePath,
              fileName: fileName
            }
          });
        } else if (firstTabWithPane.route) {
          await router.push(firstTabWithPane.route);
        }
      }
    }
  } catch (error) {
    console.error('❌ 标签页恢复失败:', error);
    // 恢复失败时，默认导航到仪表盘
    await router.push('/');
  }
}

// 监听设置变化
settingsStore.$subscribe(() => {
  applyTheme();
});

// 监听系统主题变化（仅在 auto 模式下）
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', () => {
  if (settingsStore.theme === 'auto') {
    applyTheme();
  }
});
</script>

<style scoped>
/* 文件面板包装器 - 负责动画 */
.file-panel-wrapper {
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

/* 拖拽时禁用动画 */
.file-panel-no-transition {
  transition: none !important;
}

/* 文件面板内容 - 实际内容容器 */
.file-panel-content {
  width: 100%;
  height: 100%;
  background: white;
}

.dark .file-panel-content {
  background: rgb(31 41 55);
}

/* 隐藏状态 */
.file-panel-hidden {
  border-right: none;
}

/* 主工作区动画 */
.main-work-area {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 400px;
}

/* 右侧栏包装器 - 负责动画 */
.right-sidebar-wrapper {
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

/* 拖拽时禁用动画 */
.right-sidebar-no-transition {
  transition: none !important;
}

/* 右侧栏内容 - 实际内容容器 */
.right-sidebar-content {
  width: 100%;
  height: 100%;
  background: white;
}

.dark .right-sidebar-content {
  background: rgb(31 41 55);
}

/* 隐藏状态 */
.right-sidebar-hidden {
  border-left: none;
}
</style>
