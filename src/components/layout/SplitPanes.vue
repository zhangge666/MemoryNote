<template>
  <div class="split-panes-container h-full flex flex-col">
    <!-- 分屏标签栏 -->
    <div class="split-tabs-header flex-shrink-0 border-b border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">
      <div class="flex items-center justify-between px-4 py-2">
        <!-- 分屏控制按钮 -->
        <div class="flex items-center space-x-2">
          <button
            v-if="!splitPanesStore.splitEnabled"
            @click="enableSplit('horizontal')"
            class="split-control-btn"
            title="左右分屏"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h8v18H3V3zm10 0h8v18h-8V3z"/>
            </svg>
          </button>
          
          <button
            v-if="!splitPanesStore.splitEnabled"
            @click="enableSplit('vertical')"
            class="split-control-btn"
            title="上下分屏"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h18v8H3V3zm0 10h18v8H3v-8z"/>
            </svg>
          </button>
          
          <button
            v-if="splitPanesStore.splitEnabled"
            @click="addPane()"
            class="split-control-btn"
            title="添加面板"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4"/>
            </svg>
          </button>
          
          <button
            v-if="splitPanesStore.splitEnabled"
            @click="toggleOrientation()"
            class="split-control-btn"
            :title="splitPanesStore.layout.orientation === 'horizontal' ? '切换到上下分屏' : '切换到左右分屏'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path v-if="splitPanesStore.layout.orientation === 'horizontal'" d="M3 3h18v8H3V3zm0 10h18v8H3v-8z"/>
              <path v-else d="M3 3h8v18H3V3zm10 0h8v18h-8V3z"/>
            </svg>
          </button>
          
          <button
            v-if="splitPanesStore.splitEnabled"
            @click="disableSplit()"
            class="split-control-btn"
            title="关闭分屏"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- 分屏信息 -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          <span v-if="splitPanesStore.splitEnabled">
            {{ splitPanesStore.layout.panes.length }} 个面板 
            ({{ splitPanesStore.layout.orientation === 'horizontal' ? '左右' : '上下' }}分屏)
          </span>
          <span v-else>单面板模式</span>
        </div>
      </div>
    </div>
    
    <!-- 分屏内容区域 -->
    <div class="split-panes-content flex-1 overflow-hidden">
      <div
        v-if="!splitPanesStore.splitEnabled"
        class="single-pane h-full"
      >
        <SplitPane
          :pane="splitPanesStore.layout.panes[0]"
          :is-active="true"
          @tab-close="handleTabClose"
          @tab-select="handleTabSelect"
          @pane-close="handlePaneClose"
        />
      </div>
      
      <div
        v-else
        class="split-container h-full"
        :class="{
          'split-horizontal': splitPanesStore.layout.orientation === 'horizontal',
          'split-vertical': splitPanesStore.layout.orientation === 'vertical'
        }"
      >
        <template v-for="(pane, index) in splitPanesStore.layout.panes" :key="pane.id">
          <SplitPane
            :pane="pane"
            :is-active="splitPanesStore.activePaneId === pane.id"
            :style="getPaneStyle(index)"
            @tab-close="handleTabClose"
            @tab-select="handleTabSelect"
            @pane-close="handlePaneClose"
            @pane-focus="handlePaneFocus"
          />
          
          <!-- 分隔器 -->
          <div
            v-if="index < splitPanesStore.layout.panes.length - 1"
            class="split-divider"
            :class="{
              'split-divider-horizontal': splitPanesStore.layout.orientation === 'horizontal',
              'split-divider-vertical': splitPanesStore.layout.orientation === 'vertical'
            }"
            @mousedown="startResize(index, $event)"
          >
            <div class="split-divider-handle">
              <div class="split-divider-line"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSplitPanesStore } from '../../stores/splitPanes';
import SplitPane from './SplitPane.vue';

const splitPanesStore = useSplitPanesStore();

// 拖拽调整大小相关
const isResizing = ref(false);
const resizingIndex = ref(-1);
const startX = ref(0);
const startY = ref(0);
const startSizes = ref<number[]>([]);

// 方法
function enableSplit(orientation: 'horizontal' | 'vertical') {
  splitPanesStore.enableSplit(orientation);
}

function disableSplit() {
  splitPanesStore.disableSplit();
}

function addPane() {
  splitPanesStore.addPane();
}

function toggleOrientation() {
  const newOrientation = splitPanesStore.layout.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  splitPanesStore.setOrientation(newOrientation);
}

function handleTabClose(paneId: string, tabKey: string) {
  splitPanesStore.closeTabInPane(paneId, tabKey);
  // 清理空面板
  splitPanesStore.cleanupEmptyPanes();
}

function handleTabSelect(paneId: string, tabKey: string) {
  splitPanesStore.setActiveTabInPane(paneId, tabKey);
}

function handlePaneClose(paneId: string) {
  splitPanesStore.removePane(paneId);
}

function handlePaneFocus(paneId: string) {
  splitPanesStore.activePaneId = paneId;
}

function getPaneStyle(index: number): any {
  const size = splitPanesStore.layout.sizes[index] || 0;
  
  if (splitPanesStore.layout.orientation === 'horizontal') {
    return { width: `${size}%` };
  } else {
    return { height: `${size}%` };
  }
}

// 拖拽调整大小
function startResize(index: number, event: MouseEvent) {
  isResizing.value = true;
  resizingIndex.value = index;
  startX.value = event.clientX;
  startY.value = event.clientY;
  startSizes.value = [...splitPanesStore.layout.sizes];
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = splitPanesStore.layout.orientation === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return;
  
  const container = document.querySelector('.split-container') as HTMLElement;
  if (!container) return;
  
  const containerRect = container.getBoundingClientRect();
  const isHorizontal = splitPanesStore.layout.orientation === 'horizontal';
  
  let delta: number;
  let containerSize: number;
  
  if (isHorizontal) {
    delta = event.clientX - startX.value;
    containerSize = containerRect.width;
  } else {
    delta = event.clientY - startY.value;
    containerSize = containerRect.height;
  }
  
  const deltaPercent = (delta / containerSize) * 100;
  const newSizes = [...startSizes.value];
  
  // 调整相邻两个面板的大小
  const leftIndex = resizingIndex.value;
  const rightIndex = resizingIndex.value + 1;
  
  newSizes[leftIndex] = Math.max(10, Math.min(90, startSizes.value[leftIndex] + deltaPercent));
  newSizes[rightIndex] = Math.max(10, Math.min(90, startSizes.value[rightIndex] - deltaPercent));
  
  splitPanesStore.updatePaneSizes(newSizes);
}

function stopResize() {
  isResizing.value = false;
  resizingIndex.value = -1;
  
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // 保存布局
  splitPanesStore.saveLayout();
}

onMounted(() => {
  // 恢复布局
  splitPanesStore.restoreLayout();
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.split-control-btn {
  @apply p-2 rounded-md text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
  @apply border border-transparent;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

.split-control-btn:hover {
  @apply border-gray-300 dark:border-gray-600;
}

.split-container {
  @apply flex;
}

.split-horizontal {
  @apply flex-row;
}

.split-vertical {
  @apply flex-col;
}

.split-divider {
  @apply flex-shrink-0 bg-gray-200 dark:bg-dark-600;
  @apply relative cursor-col-resize;
  @apply hover:bg-primary-200 dark:hover:bg-primary-700;
  @apply transition-colors duration-200;
}

.split-divider-horizontal {
  @apply w-1 cursor-col-resize;
}

.split-divider-vertical {
  @apply h-1 cursor-row-resize;
}

.split-divider-handle {
  @apply absolute inset-0 flex items-center justify-center;
}

.split-divider-line {
  @apply bg-gray-400 dark:bg-gray-500 rounded;
}

.split-divider-horizontal .split-divider-line {
  @apply w-0.5 h-8;
}

.split-divider-vertical .split-divider-line {
  @apply h-0.5 w-8;
}

/* 拖拽时的视觉反馈 */
.split-divider:active {
  @apply bg-primary-300 dark:bg-primary-600;
}

/* 分屏面板样式 */
.single-pane {
  @apply border border-gray-200 dark:border-dark-600 rounded-lg;
}
</style>
