<template>
  <div id="app" class="h-screen flex flex-col overflow-hidden">
    <!-- 自定义标题栏 -->
    <TitleBar />
    
    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden">
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
        <FilePanel v-if="appStore.showFilePanel" class="file-panel-content" />
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
        <!-- 标签页 -->
        <TabBar />
        
        <!-- 路由视图 -->
        <div class="flex-1 overflow-hidden">
          <router-view />
        </div>
      </main>
    </div>
    
    <!-- 状态栏 -->
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TitleBar from './components/layout/TitleBar.vue';
import Sidebar from './components/layout/Sidebar.vue';
import FilePanel from './components/layout/FilePanel.vue';
import StatusBar from './components/layout/StatusBar.vue';
import TabBar from './components/layout/TabBar.vue';
import ResizeHandle from './components/ui/ResizeHandle.vue';
import { useSettingsStore } from './stores/settings';
import { useAppStore } from './stores/app';

const settingsStore = useSettingsStore();
const appStore = useAppStore();

// 面板大小控制
const filePanelWidth = ref(320); // 文件面板默认宽度
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

// 从本地存储恢复面板大小
function restorePanelSizes() {
  const savedFilePanelWidth = localStorage.getItem('filePanelWidth');
  
  if (savedFilePanelWidth) {
    filePanelWidth.value = parseInt(savedFilePanelWidth);
  }
}

onMounted(async () => {
  // 初始化应用设置
  await settingsStore.loadSettings();
  
  // 恢复面板大小
  restorePanelSizes();
  
  // 应用主题
  applyTheme();
  
  // 应用语言
  // TODO: 实现国际化
});

function applyTheme() {
  const theme = settingsStore.theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// 监听设置变化
settingsStore.$subscribe(() => {
  applyTheme();
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
</style>
