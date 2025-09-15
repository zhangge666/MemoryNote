<template>
  <div class="multi-tab-manager h-full flex flex-col">
    <!-- 单面板模式 -->
    <template v-if="!tabManager.isSplitMode">
      <TabBarEnhanced 
        :pane-id="tabManager.activePaneId"
        :tabs="activePane?.tabs || []"
        :active-tab-id="activePane?.activeTabId || null"
        @tab-click="handleTabClick"
        @tab-close="handleTabClose"
        @tab-context-menu="handleTabContextMenu"
        @create-new-tab="handleCreateNewTab"
        @split-horizontal="handleSplitHorizontal"
        @split-vertical="handleSplitVertical"
        @tab-drag-start="handleTabDragStart"
        @tab-drag-end="handleTabDragEnd"
      />
      <div class="flex-1 overflow-hidden">
        <router-view v-if="activeTab" :key="$route.fullPath + '_' + activeTab.id" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
            </svg>
            <p class="text-lg mb-2">没有打开的标签页</p>
            <p class="text-sm">点击侧边栏开始使用</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 分屏模式 -->
    <template v-else>
      <SplitPaneContainer
        :layout="tabManager.currentLayout"
        :active-pane-id="tabManager.activePaneId"
        @tab-click="handleTabClick"
        @tab-close="handleTabClose"
        @tab-context-menu="handleTabContextMenu"
        @pane-resize="handlePaneResize"
        @tab-drag-start="handleTabDragStart"
        @tab-drag-end="handleTabDragEnd"
        @tab-drop="handleTabDrop"
      />
    </template>

    <!-- 右键上下文菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :tab="contextMenu.tab"
      @close="hideContextMenu"
      @close-tab="handleCloseTab"
      @close-others="handleCloseOthers"
      @close-to-left="handleCloseToLeft"
      @close-to-right="handleCloseToRight"
      @duplicate-tab="handleDuplicateTab"
      @pin-tab="handlePinTab"
      @move-to-new-horizontal="handleMoveToNewHorizontal"
      @move-to-new-vertical="handleMoveToNewVertical"
      @close-all="handleCloseAll"
      @reopen-closed="handleReopenClosed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTabManagerStore, type Tab } from '../../stores/tabManager';
import TabBarEnhanced from './TabBarEnhanced.vue';
import SplitPaneContainer from './SplitPaneContainer.vue';
import ContextMenu from './ContextMenu.vue';

const router = useRouter();
const route = useRoute();
const tabManager = useTabManagerStore();

// 计算属性
const activePane = computed(() => {
  try {
    const pane = tabManager.activePane;
    console.log('🔧 activePane:', pane);
    return pane;
  } catch (error) {
    console.error('Error accessing activePane:', error);
    return null;
  }
});

const activeTab = computed(() => {
  try {
    const tab = tabManager.activeTab;
    console.log('🔧 activeTab:', tab);
    console.log('🔧 totalTabCount:', tabManager.totalTabCount);
    console.log('🔧 allTabs:', tabManager.allTabs);
    return tab;
  } catch (error) {
    console.error('Error accessing activeTab:', error);
    return null;
  }
});

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  tab: null as Tab | null
});

// 标签页事件处理
function handleTabClick(tabId: string, paneId: string) {
  console.log('🔧 标签页点击:', { tabId, paneId });
  
  const setResult = tabManager.setActiveTab(tabId, paneId);
  console.log('🔧 设置活动标签结果:', setResult);
  console.log('🔧 当前活动标签:', tabManager.activeTab);
  console.log('🔧 当前活动面板:', tabManager.activePane);
  
  // 导航到对应路由
  const tab = tabManager.allTabs.find(t => t.id === tabId);
  console.log('🔧 找到的标签:', tab);
  
  if (tab?.route) {
    console.log('🔧 导航到路由:', tab.route);
    
    // 对于笔记类型，需要传递文件路径作为查询参数
    if (tab.type === 'note' && tab.filePath) {
      const fileName = tab.title + '.md'; // 从标题生成文件名
      router.push({
        path: tab.route,
        query: { 
          filePath: tab.filePath,
          fileName: fileName
        }
      });
    } else {
      router.push(tab.route);
    }
  } else {
    console.log('🔧 标签没有路由信息');
  }
}

function handleTabClose(tabId: string, paneId: string) {
  tabManager.closeTab(tabId, paneId);
}

function handleTabContextMenu(event: MouseEvent, tab: Tab, paneId: string) {
  console.log('🔧 右键菜单被触发:', { event, tab, paneId });
  event.preventDefault();
  event.stopPropagation();
  
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    tab
  };
  
  console.log('🔧 右键菜单状态:', contextMenu.value);
}

function hideContextMenu() {
  contextMenu.value.visible = false;
  contextMenu.value.tab = null;
}

function handleCreateNewTab() {
  // 创建新笔记标签页
  const timestamp = Date.now();
  const newTab = tabManager.openTab({
    title: `新建笔记-${timestamp}`,
    type: 'note',
    filePath: `新建笔记-${timestamp}.md`,
    route: '/note-editor'
  });
  
  router.push('/note-editor');
}

// 分屏操作
function handleSplitHorizontal() {
  tabManager.enableSplit('horizontal');
}

function handleSplitVertical() {
  tabManager.enableSplit('vertical');
}

function handlePaneResize(sizes: number[]) {
  tabManager.currentLayout.sizes = sizes;
  tabManager.saveLayout();
}

// 拖拽操作
function handleTabDragStart(tab: Tab, paneId: string) {
  tabManager.startDragTab(tab, paneId);
}

function handleTabDragEnd() {
  tabManager.draggedTab = null;
}

function handleTabDrop(targetPaneId: string) {
  tabManager.dropTabToPane(targetPaneId);
}

// 右键菜单操作
function handleCloseTab() {
  if (!contextMenu.value.tab) return;
  const paneId = tabManager.findTabPane(contextMenu.value.tab.id);
  if (paneId) {
    tabManager.closeTab(contextMenu.value.tab.id, paneId);
  }
  hideContextMenu();
}

function handleCloseOthers() {
  if (!contextMenu.value.tab) return;
  tabManager.closeOtherTabs(contextMenu.value.tab.id);
  hideContextMenu();
}

function handleCloseToLeft() {
  if (!contextMenu.value.tab) return;
  const paneId = tabManager.findTabPane(contextMenu.value.tab.id);
  if (!paneId) return;
  
  const pane = tabManager.activePane;
  if (!pane) return;
  
  const tabIndex = pane.tabs.findIndex(t => t.id === contextMenu.value.tab!.id);
  if (tabIndex > 0) {
    const tabsToClose = pane.tabs.slice(0, tabIndex);
    tabsToClose.forEach(tab => {
      tabManager.closeTab(tab.id, paneId);
    });
  }
  hideContextMenu();
}

function handleCloseToRight() {
  if (!contextMenu.value.tab) return;
  const paneId = tabManager.findTabPane(contextMenu.value.tab.id);
  if (!paneId) return;
  
  const pane = tabManager.activePane;
  if (!pane) return;
  
  const tabIndex = pane.tabs.findIndex(t => t.id === contextMenu.value.tab!.id);
  if (tabIndex < pane.tabs.length - 1) {
    const tabsToClose = pane.tabs.slice(tabIndex + 1);
    tabsToClose.forEach(tab => {
      tabManager.closeTab(tab.id, paneId);
    });
  }
  hideContextMenu();
}

function handleDuplicateTab() {
  if (!contextMenu.value.tab) return;
  const tab = contextMenu.value.tab;
  
  tabManager.openTab({
    title: `${tab.title} (副本)`,
    type: tab.type,
    filePath: tab.filePath,
    route: tab.route,
    pluginId: tab.pluginId
  });
  hideContextMenu();
}

function handlePinTab() {
  if (!contextMenu.value.tab) return;
  // TODO: 实现标签页固定功能
  hideContextMenu();
}

function handleMoveToNewHorizontal() {
  if (!contextMenu.value.tab) return;
  tabManager.moveTabToNewPane(contextMenu.value.tab.id, 'horizontal');
  hideContextMenu();
}

function handleMoveToNewVertical() {
  if (!contextMenu.value.tab) return;
  tabManager.moveTabToNewPane(contextMenu.value.tab.id, 'vertical');
  hideContextMenu();
}

function handleCloseAll() {
  tabManager.closeAllTabs();
  hideContextMenu();
}

function handleReopenClosed() {
  tabManager.reopenLastClosedTab();
  hideContextMenu();
}

// 全局点击处理
function handleGlobalClick(event: MouseEvent) {
  if (contextMenu.value.visible) {
    hideContextMenu();
  }
}

// 生命周期
onMounted(() => {
  try {
    // 确保 tabManager 正确初始化
    console.log('🔧 MultiTabManager 挂载，当前布局:', tabManager.currentLayout);
    console.log('🔧 活动面板ID:', tabManager.activePaneId);
    console.log('🔧 活动面板:', tabManager.activePane);
    
    tabManager.loadLayout();
    document.addEventListener('click', handleGlobalClick);
  } catch (error) {
    console.error('MultiTabManager 初始化失败:', error);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
});
</script>

<style scoped>
.multi-tab-manager {
  @apply bg-white dark:bg-dark-900;
}
</style>

