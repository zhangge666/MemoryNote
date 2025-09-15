<template>
  <div class="tab-bar-enhanced border-b border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">
    <div class="flex items-center h-10">
      <!-- 标签页滚动区域 -->
      <div class="flex-1 overflow-hidden">
        <div class="flex items-center overflow-x-auto scrollbar-hide" ref="tabScrollContainer">
          <!-- 标签页列表 -->
          <div
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="tab-item group"
            :class="{ 
              'tab-active': activeTabId === tab.id,
              'tab-pinned': tab.isPinned,
              'tab-has-changes': tab.hasUnsavedChanges
            }"
            :draggable="true"
            @click="$emit('tabClick', tab.id, paneId)"
            @contextmenu="(e) => $emit('tabContextMenu', e, tab, paneId)"
            @dragstart="(e) => handleDragStart(e, tab, index)"
            @dragover="handleDragOver"
            @drop="(e) => handleDrop(e, index)"
          >
            <!-- 标签图标 -->
            <div class="tab-icon">
              <component v-if="tab.icon" :is="tab.icon" class="w-4 h-4" />
              <svg v-else-if="tab.type === 'note'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="tab.type === 'review'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="tab.type === 'settings'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="tab.type === 'dashboard'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
              
              <!-- 固定标识 -->
              <div v-if="tab.isPinned" class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
              
              <!-- 未保存更改指示器 -->
              <div v-if="tab.hasUnsavedChanges" class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            
            <!-- 标签标题 -->
            <span class="tab-title">{{ tab.title }}</span>
            
            <!-- 关闭按钮 -->
            <button
              v-if="!tab.isPinned"
              @click.stop="$emit('tabClose', tab.id, paneId)"
              class="tab-close opacity-0 group-hover:opacity-100"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
          
          <!-- 拖拽放置区域 -->
          <div 
            v-if="showDropZone"
            class="drop-zone"
            @dragover="handleDragOver"
            @drop="(e) => handleDrop(e, tabs.length)"
          >
            <div class="drop-indicator"></div>
          </div>
        </div>
      </div>
      
      <!-- 控制按钮区域 -->
      <div class="flex items-center ml-2 flex-shrink-0 relative">
        <!-- 新建标签按钮 -->
        <button
          @click="$emit('createNewTab')"
          class="tab-action-btn"
          title="新建标签页"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <!-- 扩展菜单按钮 -->
        <button
          @click="toggleExtensionMenu($event)"
          class="tab-action-btn tab-menu-btn"
          :class="{ 'tab-action-active': extensionMenuVisible }"
          title="扩展选项"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 扩展菜单下拉 -->
    <Teleport to="body">
      <div
        v-if="extensionMenuVisible"
        ref="extensionMenuRef"
        class="extension-menu"
        :style="{ 
          position: 'fixed',
          top: menuPosition.y + 'px',
          left: menuPosition.x + 'px',
          zIndex: 9999
        }"
        @click.stop
      >
        <div class="menu-section">
          <div class="menu-title">分屏模式</div>
          <div class="menu-item" @click="handleSplitHorizontal">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h8v18H3V3zm10 0h8v18h-8V3z"/>
            </svg>
            <span>左右分屏</span>
          </div>
          <div class="menu-item" @click="handleSplitVertical">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h18v8H3V3zm0 10h18v8H3v-8z"/>
            </svg>
            <span>上下分屏</span>
          </div>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-section">
          <div class="menu-title">标签管理</div>
          <div class="menu-item" @click="handleCloseAll">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            <span>关闭所有标签</span>
          </div>
          <div class="menu-item" @click="handleReopenClosed">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            <span>重新打开已关闭</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import type { Tab } from '../../stores/tabManager';

// Props
interface Props {
  paneId: string;
  tabs: Tab[];
  activeTabId: string | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  tabClick: [tabId: string, paneId: string];
  tabClose: [tabId: string, paneId: string];
  tabContextMenu: [event: MouseEvent, tab: Tab, paneId: string];
  createNewTab: [];
  splitHorizontal: [];
  splitVertical: [];
  tabDragStart: [tab: Tab, paneId: string];
  tabDragEnd: [];
}>();

// 状态
const extensionMenuVisible = ref(false);
const extensionMenuRef = ref<HTMLElement>();
const tabScrollContainer = ref<HTMLElement>();
const showDropZone = ref(false);
const draggedTabIndex = ref<number | null>(null);
const menuPosition = ref({ x: 0, y: 0 });

// 扩展菜单控制
function toggleExtensionMenu(event?: MouseEvent) {
  console.log('🔧 toggleExtensionMenu 被调用');
  console.log('🔧 extensionMenuVisible 当前值:', extensionMenuVisible.value);
  
  if (!extensionMenuVisible.value) {
    // 计算菜单位置
    const target = event?.target as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      menuPosition.value = {
        x: rect.right - 200, // 菜单宽度约200px，右对齐
        y: rect.bottom + 4
      };
      console.log('🔧 菜单位置:', menuPosition.value);
    }
  }
  
  extensionMenuVisible.value = !extensionMenuVisible.value;
  console.log('🔧 extensionMenuVisible 新值:', extensionMenuVisible.value);
}

function hideExtensionMenu() {
  extensionMenuVisible.value = false;
}

// 分屏操作
function handleSplitHorizontal() {
  emit('splitHorizontal');
  hideExtensionMenu();
}

function handleSplitVertical() {
  emit('splitVertical');
  hideExtensionMenu();
}

// 标签管理
function handleCloseAll() {
  // 关闭当前面板的所有标签
  props.tabs.forEach(tab => {
    emit('tabClose', tab.id, props.paneId);
  });
  hideExtensionMenu();
}

function handleReopenClosed() {
  // 重新打开最近关闭的标签
  // 这个功能需要在父组件中实现
  hideExtensionMenu();
}

// 拖拽操作
function handleDragStart(event: DragEvent, tab: Tab, index: number) {
  if (!event.dataTransfer) return;
  
  draggedTabIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify({ tab, paneId: props.paneId }));
  
  emit('tabDragStart', tab, props.paneId);
  showDropZone.value = true;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault();
  
  if (!event.dataTransfer) return;
  
  try {
    const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
    const { tab, paneId: sourcePaneId } = dragData;
    
    if (sourcePaneId === props.paneId && draggedTabIndex.value !== null) {
      // 同面板内重排序
      const sourceIndex = draggedTabIndex.value;
      if (sourceIndex !== targetIndex) {
        // 重排序逻辑需要在父组件中实现
        console.log('Reorder tab from', sourceIndex, 'to', targetIndex);
      }
    } else {
      // 跨面板移动
      console.log('Move tab from', sourcePaneId, 'to', props.paneId);
    }
  } catch (error) {
    console.error('Failed to parse drag data:', error);
  }
  
  showDropZone.value = false;
  draggedTabIndex.value = null;
  emit('tabDragEnd');
}

// 全局点击处理
function handleGlobalClick(event: MouseEvent) {
  if (extensionMenuVisible.value && extensionMenuRef.value && !extensionMenuRef.value.contains(event.target as Node)) {
    // 检查是否点击的是扩展菜单按钮
    const menuButton = (event.target as Element).closest('.tab-action-btn');
    if (!menuButton) {
      hideExtensionMenu();
    }
  }
}

// 生命周期
onMounted(() => {
  console.log('🔧 TabBarEnhanced 挂载');
  console.log('🔧 props.tabs:', props.tabs);
  console.log('🔧 props.paneId:', props.paneId);
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
});
</script>

<style scoped>
.tab-bar-enhanced {
  @apply flex-shrink-0;
}

.tab-item {
  @apply flex items-center space-x-2 px-3 py-1.5 cursor-pointer;
  @apply border-r border-gray-200 dark:border-dark-600;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
  @apply min-w-0 max-w-xs flex-shrink-0;
  @apply text-sm text-gray-600 dark:text-gray-400;
  @apply relative;
  height: 36px;
}

.tab-active {
  @apply bg-gray-50 dark:bg-dark-700;
  @apply text-primary-600 dark:text-primary-400;
  @apply border-b-2 border-primary-500;
}

.tab-pinned {
  @apply bg-blue-50 dark:bg-blue-900/20;
  @apply border-b-2 border-blue-500;
}

.tab-has-changes {
  @apply bg-yellow-50 dark:bg-yellow-900/20;
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
  @apply transition-all duration-200;
}

.tab-action-btn {
  @apply flex items-center justify-center w-8 h-8;
  @apply text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-dark-600;
  @apply transition-colors duration-200;
  @apply rounded flex-shrink-0;
}

.tab-menu-btn {
  @apply border border-gray-300 dark:border-gray-600;
  @apply bg-gray-50 dark:bg-gray-700;
}

.tab-action-active {
  @apply bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.extension-menu {
  @apply absolute top-full right-0 z-50 min-w-48;
  @apply bg-white dark:bg-dark-800;
  @apply border border-gray-200 dark:border-dark-600;
  @apply rounded-lg shadow-lg;
  @apply py-1;
  animation: menuFadeIn 0.15s ease-out;
  margin-top: 4px;
}

.menu-section {
  @apply px-1;
}

.menu-title {
  @apply px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.menu-item {
  @apply flex items-center space-x-3 px-3 py-2;
  @apply text-sm text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700;
  @apply cursor-pointer;
  @apply transition-colors duration-150;
  @apply rounded;
}

.menu-item:hover {
  @apply text-gray-900 dark:text-gray-100;
}

.menu-divider {
  @apply h-px bg-gray-200 dark:bg-dark-600 my-1;
}

.drop-zone {
  @apply flex-shrink-0 w-2 h-8;
  @apply flex items-center justify-center;
}

.drop-indicator {
  @apply w-0.5 h-6 bg-primary-500 rounded-full;
  animation: pulse 1s infinite;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>

