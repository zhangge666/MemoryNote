<template>
  <div 
    class="split-pane h-full flex flex-col bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg overflow-hidden"
    :class="{ 'split-pane-active': isActive }"
    @click="handlePaneFocus"
  >
    <!-- 面板标题栏 -->
    <div class="split-pane-header flex-shrink-0 border-b border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700">
      <div class="flex items-center justify-between px-3 py-2">
        <div class="flex items-center space-x-2">
          <!-- 面板标识 -->
          <div class="w-2 h-2 rounded-full" :class="isActive ? 'bg-primary-500' : 'bg-gray-400'"></div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            面板 {{ paneIndex + 1 }}
          </span>
          <span v-if="pane.tabs.length > 0" class="text-xs text-gray-500 dark:text-gray-400">
            ({{ pane.tabs.length }} 个标签)
          </span>
        </div>
        
        <!-- 面板操作按钮 -->
        <div class="flex items-center space-x-1">
          <button
            v-if="canClosePane"
            @click.stop="handlePaneClose"
            class="pane-action-btn"
            title="关闭面板"
          >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 标签页栏 -->
      <div v-if="pane.tabs.length > 0" class="tabs-container">
        <div class="flex items-center overflow-x-auto px-2 pb-2">
          <div
            v-for="tab in pane.tabs"
            :key="`${tab.type}-${tab.id}`"
            class="tab-item group flex-shrink-0"
            :class="{ 
              'tab-active': pane.activeTab === `${tab.type}-${tab.id}`,
              'tab-dragging': draggingTab === `${tab.type}-${tab.id}`
            }"
            @click="handleTabSelect(tab)"
            @mousedown="startTabDrag(tab, $event)"
            draggable="true"
            @dragstart="handleDragStart(tab, $event)"
            @dragover.prevent
            @drop="handleDrop($event)"
          >
            <!-- 标签图标 -->
            <div class="tab-icon">
              <svg v-if="tab.type === 'note'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="tab.type === 'review'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="tab.type === 'settings'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="tab.type === 'plugin'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
            </div>
            
            <!-- 标签标题 -->
            <span class="tab-title">{{ tab.title }}</span>
            
            <!-- 关闭按钮 -->
            <button
              @click.stop="handleTabClose(tab)"
              class="tab-close-btn opacity-0 group-hover:opacity-100"
              title="关闭标签"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 面板内容区域 -->
    <div class="split-pane-content flex-1 overflow-hidden">
      <div v-if="pane.tabs.length === 0" class="empty-pane h-full flex items-center justify-center">
        <div class="text-center text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
          </svg>
          <p class="text-sm">没有打开的标签页</p>
          <p class="text-xs mt-1">拖拽标签页到此处或点击侧边栏打开内容</p>
        </div>
      </div>
      
      <div v-else class="h-full">
        <!-- 这里会显示当前活动标签页的内容 -->
        <component 
          :is="currentTabComponent" 
          v-bind="currentTabProps"
          class="h-full"
        />
      </div>
    </div>
    
    <!-- 拖拽放置区域指示器 -->
    <div
      v-if="isDragOver"
      class="drag-overlay absolute inset-0 bg-primary-500 bg-opacity-20 border-2 border-primary-500 border-dashed rounded-lg flex items-center justify-center z-50"
    >
      <div class="text-primary-700 dark:text-primary-300 text-center">
        <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
        </svg>
        <p class="text-sm font-medium">放置标签页到此面板</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import type { SplitPane } from '../../stores/splitPanes';
import { useSplitPanesStore } from '../../stores/splitPanes';

// 引入页面组件
import Dashboard from '../../views/Dashboard.vue';
import NoteEditor from '../../views/NoteEditor.vue';
import ReviewCenter from '../../views/ReviewCenter.vue';
import SettingsWindow from '../../views/SettingsWindow.vue';

interface Props {
  pane: SplitPane;
  isActive: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'tab-close': [paneId: string, tabKey: string];
  'tab-select': [paneId: string, tabKey: string];
  'pane-close': [paneId: string];
  'pane-focus': [paneId: string];
}>();

const router = useRouter();
const splitPanesStore = useSplitPanesStore();

// 拖拽相关状态
const draggingTab = ref<string | null>(null);
const isDragOver = ref(false);

// 计算属性
const paneIndex = computed(() => {
  return splitPanesStore.layout.panes.findIndex(p => p.id === props.pane.id);
});

const canClosePane = computed(() => {
  return splitPanesStore.layout.panes.length > 1;
});

const currentTab = computed(() => {
  if (!props.pane.activeTab) return null;
  return props.pane.tabs.find(tab => `${tab.type}-${tab.id}` === props.pane.activeTab);
});

const currentTabComponent = computed(() => {
  if (!currentTab.value) return null;
  
  switch (currentTab.value.type) {
    case 'note':
      return NoteEditor;
    case 'review':
      return ReviewCenter;
    case 'settings':
      return SettingsWindow;
    case 'dashboard':
      return Dashboard;
    default:
      return null;
  }
});

const currentTabProps = computed(() => {
  if (!currentTab.value) return {};
  
  // 根据标签页类型返回相应的props
  switch (currentTab.value.type) {
    case 'note':
      return {
        filePath: currentTab.value.filePath || currentTab.value.id,
        fileName: currentTab.value.title + '.md'
      };
    default:
      return {};
  }
});

// 方法
function handlePaneFocus() {
  emit('pane-focus', props.pane.id);
}

function handleTabSelect(tab: any) {
  const tabKey = `${tab.type}-${tab.id}`;
  emit('tab-select', props.pane.id, tabKey);
  
  // 同时更新路由
  updateRouteForTab(tab);
}

function handleTabClose(tab: any) {
  const tabKey = `${tab.type}-${tab.id}`;
  emit('tab-close', props.pane.id, tabKey);
}

function handlePaneClose() {
  emit('pane-close', props.pane.id);
}

function updateRouteForTab(tab: any) {
  switch (tab.type) {
    case 'note':
      router.push({
        name: 'NoteEditor',
        query: {
          filePath: tab.filePath || tab.id,
          fileName: tab.title + '.md'
        }
      });
      break;
    case 'review':
      router.push('/review');
      break;
    case 'settings':
      router.push('/settings');
      break;
    case 'dashboard':
      router.push('/');
      break;
    default:
      if (tab.route) {
        router.push(tab.route);
      }
      break;
  }
}

// 拖拽相关方法
function startTabDrag(tab: any, event: MouseEvent) {
  draggingTab.value = `${tab.type}-${tab.id}`;
}

function handleDragStart(tab: any, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      tabKey: `${tab.type}-${tab.id}`,
      fromPaneId: props.pane.id,
      tab: tab
    }));
    event.dataTransfer.effectAllowed = 'move';
  }
  draggingTab.value = `${tab.type}-${tab.id}`;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
  
  const data = event.dataTransfer?.getData('text/plain');
  if (!data) return;
  
  try {
    const dragData = JSON.parse(data);
    const { tabKey, fromPaneId, tab } = dragData;
    
    if (fromPaneId !== props.pane.id) {
      // 移动标签页到此面板
      splitPanesStore.moveTabToPane(fromPaneId, props.pane.id, tabKey);
    }
  } catch (error) {
    console.error('处理标签页拖拽失败:', error);
  }
  
  draggingTab.value = null;
}
</script>

<style scoped>
.split-pane {
  @apply relative;
  min-width: 200px;
  min-height: 150px;
}

.split-pane-active {
  @apply ring-2 ring-primary-500 ring-opacity-50;
}

.pane-action-btn {
  @apply p-1 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-dark-600;
  @apply transition-colors duration-200;
}

.tab-item {
  @apply flex items-center space-x-2 px-3 py-1.5 mr-1 rounded-md;
  @apply text-sm text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-600;
  @apply cursor-pointer select-none;
  @apply transition-all duration-200;
  @apply border border-transparent;
  min-width: 120px;
  max-width: 200px;
}

.tab-active {
  @apply bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100;
  @apply border-gray-200 dark:border-dark-500;
  @apply shadow-sm;
}

.tab-dragging {
  @apply opacity-50;
}

.tab-icon {
  @apply flex-shrink-0;
}

.tab-title {
  @apply flex-1 truncate text-xs;
}

.tab-close-btn {
  @apply flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-dark-600;
  @apply transition-all duration-200;
}

.tabs-container {
  @apply border-t border-gray-200 dark:border-dark-600;
}

.empty-pane {
  @apply border-2 border-dashed border-gray-200 dark:border-dark-600 rounded-lg m-4;
}

.drag-overlay {
  @apply pointer-events-none;
}

/* 拖拽放置区域 */
.split-pane:not(.split-pane-active):hover {
  @apply ring-1 ring-gray-300 dark:ring-gray-600;
}

/* 滚动条样式 */
.tabs-container::-webkit-scrollbar {
  height: 4px;
}

.tabs-container::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-dark-700;
}

.tabs-container::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded;
}

.tabs-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
