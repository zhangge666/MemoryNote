<template>
  <div ref="containerRef" class="split-pane-container h-full flex" :class="containerClass">
    <!-- 渲染每个面板 -->
    <template v-for="(pane, index) in layout.panes" :key="pane.id">
      <!-- 面板内容 -->
      <div 
        class="split-pane"
        :class="{ 'split-pane-active': activePaneId === pane.id }"
        :style="{ [sizeProperty]: layout.sizes[index] + '%' }"
        @click="handlePaneClick(pane.id)"
        @dragover="handleDragOver"
        @drop="(e) => handleDrop(e, pane.id)"
      >
        <!-- 标签栏 -->
        <TabBarEnhanced 
          :pane-id="pane.id"
          :tabs="pane.tabs"
          :active-tab-id="pane.activeTabId"
          @tab-click="(tabId) => $emit('tabClick', tabId, pane.id)"
          @tab-close="(tabId) => $emit('tabClose', tabId, pane.id)"
          @tab-context-menu="(e, tab) => $emit('tabContextMenu', e, tab, pane.id)"
          @create-new-tab="handleCreateNewTab"
          @split-horizontal="() => handleAddPane('horizontal')"
          @split-vertical="() => handleAddPane('vertical')"
          @tab-drag-start="(tab) => $emit('tabDragStart', tab, pane.id)"
          @tab-drag-end="$emit('tabDragEnd')"
        />
        
        <!-- 内容区域 -->
        <div class="pane-content">
          <router-view v-if="pane.activeTabId" :key="getRouteKey(pane)" />
          <div v-else class="pane-empty">
            <div class="text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
              </svg>
              <p class="text-sm">空面板</p>
              <p class="text-xs text-gray-400 mt-1">拖拽标签页到这里</p>
            </div>
          </div>
        </div>

        <!-- 拖拽放置指示器 -->
        <div 
          v-if="showDropIndicator === pane.id"
          class="drop-overlay"
        >
          <div class="drop-overlay-content">
            <svg class="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            <p class="text-primary-600 font-medium mt-2">放置标签页</p>
          </div>
        </div>
      </div>
      
      <!-- 分割条 -->
      <div 
        v-if="index < layout.panes.length - 1"
        class="split-divider"
        :class="dividerClass"
        @mousedown="(e) => startResize(e, index)"
      >
        <div class="split-divider-handle">
          <svg v-if="layout.type === 'horizontal'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            <path fill-rule="evenodd" d="M3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            <path fill-rule="evenodd" d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
          </svg>
          <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 01-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            <path fill-rule="evenodd" d="M6 3a1 1 0 01-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            <path fill-rule="evenodd" d="M14 3a1 1 0 01-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import type { SplitLayout, TabPane } from '../../stores/tabManager';
import TabBarEnhanced from './TabBarEnhanced.vue';

// Props
interface Props {
  layout: SplitLayout;
  activePaneId: string;
}

const props = defineProps<Props>();
const route = useRoute();

// Emits
const emit = defineEmits<{
  tabClick: [tabId: string, paneId: string];
  tabClose: [tabId: string, paneId: string];
  tabContextMenu: [event: MouseEvent, tab: any, paneId: string];
  paneResize: [sizes: number[]];
  tabDragStart: [tab: any, paneId: string];
  tabDragEnd: [];
  tabDrop: [targetPaneId: string];
}>();

// 状态
const showDropIndicator = ref<string | null>(null);
const isResizing = ref(false);
const resizeIndex = ref<number | null>(null);
const startPosition = ref({ x: 0, y: 0 });
const startSizes = ref<number[]>([]);
const containerRef = ref<HTMLElement>();

// 计算属性
const containerClass = computed(() => ({
  'flex-row': props.layout.type === 'horizontal',
  'flex-col': props.layout.type === 'vertical'
}));

const dividerClass = computed(() => ({
  'split-divider-horizontal': props.layout.type === 'horizontal',
  'split-divider-vertical': props.layout.type === 'vertical'
}));

const sizeProperty = computed(() => 
  props.layout.type === 'horizontal' ? 'width' : 'height'
);

// 生成路由键
function getRouteKey(pane: TabPane) {
  return route.fullPath + '_' + pane.activeTabId;
}

// 面板点击处理
function handlePaneClick(paneId: string) {
  // 激活面板但不触发其他事件
}

function handleCreateNewTab() {
  // 在当前活动面板创建新标签页
  emit('tabClick', 'new-tab', props.activePaneId);
}

function handleAddPane(orientation: 'horizontal' | 'vertical') {
  // 添加新面板的逻辑需要在父组件中实现
  console.log('Add new pane with orientation:', orientation);
}

// 拖拽处理
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleDrop(event: DragEvent, targetPaneId: string) {
  event.preventDefault();
  showDropIndicator.value = null;
  
  if (!event.dataTransfer) return;
  
  try {
    const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
    const { paneId: sourcePaneId } = dragData;
    
    if (sourcePaneId !== targetPaneId) {
      emit('tabDrop', targetPaneId);
    }
  } catch (error) {
    console.error('Failed to parse drag data:', error);
  }
}

// 分割条拖拽调整大小
function startResize(event: MouseEvent, index: number) {
  console.log('🔧 开始调整分区大小:', index, props.layout.type);
  event.preventDefault();
  
  isResizing.value = true;
  resizeIndex.value = index;
  startPosition.value = { x: event.clientX, y: event.clientY };
  startSizes.value = [...props.layout.sizes];
  
  console.log('🔧 初始大小:', startSizes.value);
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = props.layout.type === 'horizontal' ? 'col-resize' : 'row-resize';
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value || resizeIndex.value === null || !containerRef.value) return;
  
  const containerRect = containerRef.value.getBoundingClientRect();
  const isHorizontal = props.layout.type === 'horizontal';
  
  const delta = isHorizontal 
    ? ((event.clientX - startPosition.value.x) / containerRect.width) * 100
    : ((event.clientY - startPosition.value.y) / containerRect.height) * 100;
  
  const newSizes = [...startSizes.value];
  const leftIndex = resizeIndex.value;
  const rightIndex = leftIndex + 1;
  
  // 确保不会调整到负值或超过100%
  const minSize = 10; // 最小10%
  const maxLeftSize = startSizes.value[leftIndex] + startSizes.value[rightIndex] - minSize;
  
  const newLeftSize = Math.max(minSize, Math.min(maxLeftSize, startSizes.value[leftIndex] + delta));
  const newRightSize = startSizes.value[leftIndex] + startSizes.value[rightIndex] - newLeftSize;
  
  if (newRightSize >= minSize) {
    newSizes[leftIndex] = newLeftSize;
    newSizes[rightIndex] = newRightSize;
    
    console.log('🔧 调整分区大小:', newSizes);
    emit('paneResize', newSizes);
  }
}

function stopResize() {
  isResizing.value = false;
  resizeIndex.value = null;
  
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
}

// 拖拽进入面板时显示指示器
function handleDragEnter(paneId: string) {
  showDropIndicator.value = paneId;
}

function handleDragLeave() {
  showDropIndicator.value = null;
}

// 生命周期
onMounted(() => {
  // 添加拖拽事件监听器
  const panes = document.querySelectorAll('.split-pane');
  panes.forEach((pane, index) => {
    const paneId = props.layout.panes[index].id;
    pane.addEventListener('dragenter', () => handleDragEnter(paneId));
    pane.addEventListener('dragleave', handleDragLeave);
  });
});

onUnmounted(() => {
  if (isResizing.value) {
    stopResize();
  }
});
</script>

<style scoped>
.split-pane-container {
  @apply bg-white dark:bg-dark-900;
}

.split-pane {
  @apply relative flex flex-col;
  @apply border border-gray-200 dark:border-dark-600;
  @apply bg-white dark:bg-dark-800;
  min-width: 200px;
  min-height: 200px;
}

.split-pane-active {
  @apply ring-2 ring-primary-500 ring-opacity-50;
}

.pane-content {
  @apply flex-1 overflow-hidden;
}

.pane-empty {
  @apply h-full flex items-center justify-center;
  @apply bg-gray-50 dark:bg-dark-900;
}

.split-divider {
  @apply bg-gray-200 dark:bg-dark-600;
  @apply hover:bg-gray-300 dark:hover:bg-dark-500;
  @apply transition-colors duration-200;
  @apply flex items-center justify-center;
  @apply relative;
  @apply flex-shrink-0;
}

.split-divider-horizontal {
  @apply cursor-col-resize;
  width: 4px;
}

.split-divider-vertical {
  @apply cursor-row-resize;
  height: 4px;
}

.split-divider-handle {
  @apply text-gray-400 dark:text-gray-500;
  @apply opacity-0 hover:opacity-100;
  @apply transition-opacity duration-200;
  @apply absolute;
}

.split-divider:hover .split-divider-handle {
  @apply opacity-100;
}

.drop-overlay {
  @apply absolute inset-0 z-10;
  @apply bg-primary-100 dark:bg-primary-900/20;
  @apply border-2 border-dashed border-primary-400;
  @apply flex items-center justify-center;
  @apply backdrop-blur-sm;
}

.drop-overlay-content {
  @apply text-center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .split-pane {
    min-width: 150px;
    min-height: 150px;
  }
  
  .split-divider-horizontal {
    width: 6px;
  }
  
  .split-divider-vertical {
    height: 6px;
  }
}
</style>



