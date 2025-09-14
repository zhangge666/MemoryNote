<template>
  <div v-if="tabs.length > 0" class="tab-bar border-b border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">

    <!-- 标签页滚动区域 -->
    <div class="tab-scroll-container">
      <div class="flex items-center overflow-x-auto">
        <div
          v-for="tab in tabs"
          :key="`${tab.type}-${tab.id}`"
          class="tab-item group"
          :class="{ 
            'tab-active': activeTab === `${tab.type}-${tab.id}`,
            'tab-has-changes': hasUnsavedChanges(tab)
          }"
          @click="setActiveTab(`${tab.type}-${tab.id}`)"
          @contextmenu.prevent="showContextMenu($event, tab)"
        >
          <!-- 标签图标 -->
          <div class="tab-icon">
            <svg v-if="tab.type === 'note'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="tab.type === 'review'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="tab.type === 'settings'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
            
            <!-- 未保存更改指示器 -->
            <div v-if="hasUnsavedChanges(tab)" class="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          
          <!-- 标签标题 -->
          <span class="tab-title">{{ tab.title }}</span>
          
          <!-- 关闭按钮 -->
          <button
            @click.stop="closeTab(`${tab.type}-${tab.id}`)"
            class="tab-close"
          >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <!-- 新建标签按钮 -->
        <button
          @click="createNewNote"
          class="tab-new-btn"
          title="新建笔记"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 右击上下文菜单 -->
    <div
      v-if="contextMenu.visible"
      ref="contextMenuRef"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="closeCurrentTab">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭</span>
        <span class="context-menu-shortcut">Ctrl+W</span>
      </div>
      
      <div class="context-menu-item" @click="closeOtherTabs">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm-8 8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clip-rule="evenodd"/>
        </svg>
        <span>关闭其他</span>
      </div>
      
      <div class="context-menu-item" @click="closeTabsToTheRight">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭右侧</span>
      </div>
      
      <div class="context-menu-item" @click="closeTabsToTheLeft">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭左侧</span>
      </div>
      
      <div class="context-menu-divider"></div>
      
      <div class="context-menu-item" @click="duplicateTab">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
        </svg>
        <span>复制标签页</span>
      </div>
      
      <div class="context-menu-item" @click="pinTab">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8zM9 5a2 2 0 00-2 2v6h10V7a2 2 0 00-2-2H9z" clip-rule="evenodd"/>
        </svg>
        <span>{{ contextMenu.targetTab?.isPinned ? '取消固定' : '固定标签页' }}</span>
      </div>
      
      <div class="context-menu-divider"></div>
      
      <div class="context-menu-item" @click="openInSplitView">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V4z" clip-rule="evenodd"/>
        </svg>
        <span>在新分屏中打开</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../../stores/app';
import { useFilesStore } from '../../stores/files';

const router = useRouter();
const appStore = useAppStore();
const filesStore = useFilesStore();

// DOM引用
const contextMenuRef = ref<HTMLElement>();

// 计算属性
const tabs = computed(() => appStore.openTabs);
const activeTab = computed(() => appStore.activeTab);

// 分屏状态
const splitViewEnabled = ref(false);

// 右击菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetTab: null as any
});

// 辅助方法
function hasUnsavedChanges(tab: any): boolean {
  // 检查标签页是否有未保存的更改
  // 这里可以根据实际需求实现，比如检查编辑器内容是否已保存
  return false; // 暂时返回false，可以根据需要实现
}

// 主要方法
function setActiveTab(tabKey: string) {
  appStore.setActiveTab(tabKey);
  hideContextMenu();
  
  // 导航到对应路由
  const tab = tabs.value.find(t => `${t.type}-${t.id}` === tabKey);
  if (tab) {
    switch (tab.type) {
      case 'note':
        // 使用保存的filePath
        const filePath = tab.filePath || tab.id;
        const fileName = filePath.split(/[/\\]/).pop() || 'unknown.md';
        
        router.push({
          name: 'NoteEditor',
          query: {
            filePath: filePath,
            fileName: fileName
          }
        });
        break;
      case 'review':
        router.push('/review');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  }
}

function closeTab(tabKey: string) {
  const isClosingActiveTab = activeTab.value === tabKey;
  const currentIndex = tabs.value.findIndex(tab => `${tab.type}-${tab.id}` === tabKey);
  
  // 关闭标签页
  appStore.closeTab(tabKey);
  hideContextMenu();
  
  // 如果没有打开的标签了，导航到首页
  if (appStore.openTabs.length === 0) {
    router.push('/');
    return;
  }
  
  // 如果关闭的是当前活动标签页，需要切换到其他标签页
  if (isClosingActiveTab && appStore.openTabs.length > 0) {
    // 优先选择右边的标签页，如果没有则选择左边的
    let nextIndex = currentIndex;
    if (nextIndex >= appStore.openTabs.length) {
      nextIndex = appStore.openTabs.length - 1;
    }
    
    const nextTab = appStore.openTabs[nextIndex];
    if (nextTab) {
      const nextTabKey = `${nextTab.type}-${nextTab.id}`;
      setActiveTab(nextTabKey);
    }
  }
}

// 右击菜单相关方法
function showContextMenu(event: MouseEvent, tab: any) {
  event.preventDefault();
  
  contextMenu.targetTab = tab;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.visible = true;
  
  // 确保菜单不会超出屏幕边界
  nextTick(() => {
    if (contextMenuRef.value) {
      const menuRect = contextMenuRef.value.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      if (contextMenu.x + menuRect.width > windowWidth) {
        contextMenu.x = windowWidth - menuRect.width - 10;
      }
      
      if (contextMenu.y + menuRect.height > windowHeight) {
        contextMenu.y = windowHeight - menuRect.height - 10;
      }
    }
  });
}

function hideContextMenu() {
  contextMenu.visible = false;
  contextMenu.targetTab = null;
}

// 右击菜单操作
function closeCurrentTab() {
  if (contextMenu.targetTab) {
    const tabKey = `${contextMenu.targetTab.type}-${contextMenu.targetTab.id}`;
    closeTab(tabKey);
  }
}

function closeOtherTabs() {
  if (contextMenu.targetTab) {
    const currentTabKey = `${contextMenu.targetTab.type}-${contextMenu.targetTab.id}`;
    const tabsToClose = tabs.value.filter(tab => `${tab.type}-${tab.id}` !== currentTabKey);
    
    tabsToClose.forEach(tab => {
      appStore.closeTab(`${tab.type}-${tab.id}`);
    });
    
    // 确保当前标签页是活动的
    if (activeTab.value !== currentTabKey) {
      setActiveTab(currentTabKey);
    }
    
    hideContextMenu();
  }
}

function closeTabsToTheRight() {
  if (contextMenu.targetTab) {
    const currentTabKey = `${contextMenu.targetTab.type}-${contextMenu.targetTab.id}`;
    const currentIndex = tabs.value.findIndex(tab => `${tab.type}-${tab.id}` === currentTabKey);
    
    if (currentIndex !== -1) {
      const tabsToClose = tabs.value.slice(currentIndex + 1);
      const isActiveTabInClosingList = tabsToClose.some(tab => `${tab.type}-${tab.id}` === activeTab.value);
      
      tabsToClose.forEach(tab => {
        appStore.closeTab(`${tab.type}-${tab.id}`);
      });
      
      // 如果当前活动标签页被关闭了，切换到目标标签页
      if (isActiveTabInClosingList) {
        setActiveTab(currentTabKey);
      }
    }
    
    hideContextMenu();
  }
}

function closeTabsToTheLeft() {
  if (contextMenu.targetTab) {
    const currentTabKey = `${contextMenu.targetTab.type}-${contextMenu.targetTab.id}`;
    const currentIndex = tabs.value.findIndex(tab => `${tab.type}-${tab.id}` === currentTabKey);
    
    if (currentIndex !== -1) {
      const tabsToClose = tabs.value.slice(0, currentIndex);
      const isActiveTabInClosingList = tabsToClose.some(tab => `${tab.type}-${tab.id}` === activeTab.value);
      
      tabsToClose.forEach(tab => {
        appStore.closeTab(`${tab.type}-${tab.id}`);
      });
      
      // 如果当前活动标签页被关闭了，切换到目标标签页
      if (isActiveTabInClosingList) {
        setActiveTab(currentTabKey);
      }
    }
    
    hideContextMenu();
  }
}

function duplicateTab() {
  if (contextMenu.targetTab && contextMenu.targetTab.type === 'note') {
    // 复制标签页
    const originalTab = contextMenu.targetTab;
    const timestamp = Date.now();
    const newTabId = `duplicate-${timestamp}`;
    
    appStore.openTab({
      id: newTabId,
      title: `${originalTab.title} (副本)`,
      type: originalTab.type,
      filePath: originalTab.filePath
    });
  }
  
  hideContextMenu();
}

function pinTab() {
  if (contextMenu.targetTab) {
    // 切换固定状态
    // 这里可以在appStore中实现标签页固定功能
    console.log('Pin/Unpin tab:', contextMenu.targetTab);
  }
  
  hideContextMenu();
}

function openInSplitView() {
  if (contextMenu.targetTab) {
    // 在新分屏中打开
    splitViewEnabled.value = true;
    console.log('Open in split view:', contextMenu.targetTab);
  }
  
  hideContextMenu();
}

// 分屏和批量操作
function toggleSplitView() {
  splitViewEnabled.value = !splitViewEnabled.value;
  console.log('Split view toggled:', splitViewEnabled.value);
}

function closeAllTabs() {
  if (confirm('确定要关闭所有标签页吗？')) {
    tabs.value.forEach(tab => {
      appStore.closeTab(`${tab.type}-${tab.id}`);
    });
    router.push('/');
  }
}

async function createNewNote() {
  try {
    hideContextMenu(); // 隐藏上下文菜单
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const fileName = `新建笔记-${timestamp}.md`;
    const content = `# 新建笔记\n\n`;
    
    // 创建文件
    const filePath = await filesStore.createFile(fileName, content);
    
    // 刷新文件树
    await filesStore.refreshTree();
    
    // 创建标签页 - 使用安全的Unicode Base64编码
    const tabId = btoa(encodeURIComponent(filePath)).replace(/[+=\/]/g, '');
    appStore.openTab({
      id: tabId,
      title: `新建笔记-${timestamp}`,
      type: 'note',
      filePath: filePath
    });
    
    // 导航到编辑页面
    router.push({
      name: 'NoteEditor',
      query: {
        filePath: filePath,
        fileName: fileName
      }
    });
    
    // 更新应用状态
    appStore.setCurrentFile({
      path: filePath,
      name: fileName,
      content: content
    });
    
  } catch (error) {
    console.error('创建笔记失败:', error);
    alert('创建笔记失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
}

// 键盘快捷键处理
function handleKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'w':
        event.preventDefault();
        // 关闭当前活动标签
        if (activeTab.value) {
          closeTab(activeTab.value);
        }
        break;
      case 't':
        event.preventDefault();
        // 新建标签
        createNewNote();
        break;
      case 'Tab':
        event.preventDefault();
        // 切换到下一个标签
        switchToNextTab();
        break;
    }
  }
  
  if (event.key === 'Escape') {
    hideContextMenu();
  }
}

function switchToNextTab() {
  const currentIndex = tabs.value.findIndex(tab => `${tab.type}-${tab.id}` === activeTab.value);
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % tabs.value.length;
    const nextTab = tabs.value[nextIndex];
    if (nextTab) {
      setActiveTab(`${nextTab.type}-${nextTab.id}`);
    }
  }
}

// 全局点击处理 - 隐藏上下文菜单
function handleGlobalClick(event: MouseEvent) {
  if (contextMenu.visible && contextMenuRef.value && !contextMenuRef.value.contains(event.target as Node)) {
    hideContextMenu();
  }
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('click', handleGlobalClick);
});
</script>

<style scoped>
.tab-bar {
  @apply flex-shrink-0;
  max-height: 48px; /* 恢复原来的高度 */
}

.tab-scroll-container {
  @apply flex-1 overflow-hidden;
}

.tab-action-btn {
  @apply p-1.5 rounded hover:bg-gray-200 dark:hover:bg-dark-600;
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply transition-colors duration-200;
}

.tab-action-active {
  @apply bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.tab-item {
  @apply flex items-center space-x-2 px-4 py-2 cursor-pointer;
  @apply border-r border-gray-200 dark:border-dark-600;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
  @apply min-w-0 max-w-xs;
  @apply text-sm text-gray-600 dark:text-gray-400;
  @apply relative;
}

.tab-active {
  @apply bg-gray-50 dark:bg-dark-700;
  @apply text-primary-600 dark:text-primary-400;
  @apply border-b-2 border-primary-500;
}

.tab-has-changes {
  @apply bg-yellow-50 dark:bg-yellow-900/20;
  @apply text-yellow-700 dark:text-yellow-400;
}

.tab-icon {
  @apply flex-shrink-0 relative;
}

.tab-title {
  @apply truncate flex-1 min-w-0;
}

.tab-close {
  @apply flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-600;
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply transition-colors duration-200;
  @apply opacity-0 group-hover:opacity-100;
}

.tab-item:hover .tab-close {
  @apply opacity-100;
}

.tab-new-btn {
  @apply flex items-center justify-center w-10 h-10;
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
}

/* 右击上下文菜单样式 */
.context-menu {
  @apply fixed z-50 min-w-48;
  @apply bg-white dark:bg-dark-800;
  @apply border border-gray-200 dark:border-dark-600;
  @apply rounded-lg shadow-lg;
  @apply py-1;
}

.context-menu-item {
  @apply flex items-center space-x-3 px-3 py-2;
  @apply text-sm text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700;
  @apply cursor-pointer;
  @apply transition-colors duration-150;
}

.context-menu-item:hover {
  @apply text-gray-900 dark:text-gray-100;
}

.context-menu-item svg {
  @apply flex-shrink-0;
}

.context-menu-shortcut {
  @apply ml-auto text-xs text-gray-400 dark:text-gray-500;
}

.context-menu-divider {
  @apply h-px bg-gray-200 dark:bg-dark-600 my-1;
}

/* 动画效果 */
.tab-item {
  transform: translateY(0);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.tab-item:hover {
  transform: translateY(-1px);
}

.context-menu {
  animation: contextMenuFadeIn 0.15s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 滚动条样式 */
.tab-scroll-container::-webkit-scrollbar {
  height: 4px;
}

.tab-scroll-container::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-dark-700;
}

.tab-scroll-container::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-dark-500 rounded-full;
}

.tab-scroll-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-dark-400;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tab-item {
    @apply max-w-32;
  }
  
  .context-menu {
    @apply min-w-40;
  }
  
  .context-menu-item {
    @apply px-2 py-1.5 text-xs;
  }
}

/* 可访问性支持 */
.tab-item:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

.context-menu-item:focus {
  @apply outline-none bg-gray-100 dark:bg-dark-700;
}

/* 特殊标签类型样式 */
.tab-item[data-type="settings"] {
  @apply border-l-2 border-yellow-400;
}

.tab-item[data-type="review"] {
  @apply border-l-2 border-green-400;
}

/* 固定标签样式（预留） */
.tab-pinned {
  @apply border-t-2 border-blue-400;
}

.tab-pinned .tab-icon {
  @apply text-blue-500;
}
</style>
