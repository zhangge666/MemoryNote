<template>
  <div 
    class="resizable-sidebar bg-background flex-shrink-0 relative"
    :class="[
      `sidebar-${props.side}`,
      { 'no-transition': isResizing }
    ]"
    :style="{ width: `${currentWidth}px`, minWidth: `${currentWidth}px` }"
  >
    <!-- 内容区域 -->
    <div 
      class="sidebar-content h-full overflow-hidden" 
      :style="{ 
        width: `${props.width}px`, 
        opacity: props.visible ? 1 : 0,
        padding: contentPadding 
      }"
    >
      <slot>
        <!-- 默认占位内容 -->
        <div class="flex flex-col items-center justify-center h-full text-text-muted">
          <span class="text-sm">{{ props.side === 'left' ? 'Left' : 'Right' }} Panel</span>
        </div>
      </slot>
    </div>

    <!-- 拖拽调整宽度的分隔条 -->
    <ResizeHandle
      v-show="props.visible"
      :position="props.side === 'left' ? 'right' : 'left'"
      :current-width="currentWidth"
      :min-width="props.minWidth"
      :max-width="props.maxWidth"
      @resize-start="handleResizeStart"
      @resize="handleResize"
      @resize-end="handleResizeEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ResizeHandle from './ResizeHandle.vue';

export interface SidebarProps {
  side: 'left' | 'right';
  visible: boolean;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  contentPadding?: string;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  minWidth: 200,
  maxWidth: 600,
  contentPadding: '0',
});

const emit = defineEmits<{
  (e: 'resize-start'): void;
  (e: 'resize', width: number): void;
  (e: 'resize-end'): void;
  (e: 'update:width', width: number): void;
}>();

// 是否正在调整大小
const isResizing = ref(false);

// 拖拽时的临时宽度
const dragWidth = ref<number | null>(null);

// 声明式计算当前宽度：visible ? (拖拽中用dragWidth否则用props.width) : 0
const currentWidth = computed(() => {
  if (!props.visible) return 0;
  return dragWidth.value ?? props.width;
});

// 拖拽事件处理
const handleResizeStart = () => {
  isResizing.value = true;
  dragWidth.value = props.width;
  emit('resize-start');
};

const handleResize = (width: number) => {
  dragWidth.value = width;
  emit('resize', width);
  emit('update:width', width);
};

const handleResizeEnd = () => {
  isResizing.value = false;
  dragWidth.value = null;
  emit('resize-end');
};
</script>

<style scoped>
.resizable-sidebar {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-md);
  will-change: width;
}

.sidebar-content {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 拖动时禁用过渡动画 */
.no-transition,
.no-transition .sidebar-content {
  transition: none !important;
}

/* 左侧栏样式 */
.sidebar-left {
  border-right: 1px solid var(--theme-border);
}

/* 右侧栏样式 */
.sidebar-right {
  border-left: 1px solid var(--theme-border);
}
</style>
