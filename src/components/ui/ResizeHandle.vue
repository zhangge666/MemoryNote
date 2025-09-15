<template>
  <div
    class="resize-handle"
    :class="[
      direction === 'horizontal' ? 'resize-handle-horizontal' : 'resize-handle-vertical',
      { 'resizing': isResizing }
    ]"
    @mousedown="startResize"
    @dblclick="resetSize"
  >
    <div v-if="showGrip" class="resize-grip">
      <div class="grip-dot"></div>
      <div class="grip-dot"></div>
      <div class="grip-dot"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

interface Props {
  direction: 'horizontal' | 'vertical';
  showGrip?: boolean;
  minSize?: number;
  maxSize?: number;
  currentSize?: number;
  reverse?: boolean; // 反向拖拽，用于右侧栏
}

interface Emits {
  (e: 'resize', size: number): void;
  (e: 'resizeStart'): void;
  (e: 'resizeEnd'): void;
  (e: 'reset'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showGrip: true,
  minSize: 100,
  maxSize: 800,
  currentSize: 320,
  reverse: false,
});

const emit = defineEmits<Emits>();

const isResizing = ref(false);
let startPos = 0;
let startSize = 0;
let rafId: number | null = null;

function startResize(event: MouseEvent) {
  isResizing.value = true;
  startPos = props.direction === 'horizontal' ? event.clientX : event.clientY;
  
  // 使用传入的当前尺寸，而不是查询DOM
  startSize = props.currentSize;
  
  emit('resizeStart');
  
  // 使用 passive: false 确保能够 preventDefault
  document.addEventListener('mousemove', handleResize, { passive: false });
  document.addEventListener('mouseup', stopResize, { passive: false });
  document.addEventListener('selectstart', preventSelection, { passive: false });
  
  // 添加全局样式防止选择和改善用户体验
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
  document.body.style.pointerEvents = 'none';
  
  // 确保拖拽手柄保持可交互
  const handle = event.target as HTMLElement;
  handle.style.pointerEvents = 'auto';
  
  event.preventDefault();
  event.stopPropagation();
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return;
  
  // 取消之前的 RAF 请求
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  
  // 使用 requestAnimationFrame 优化性能
  rafId = requestAnimationFrame(() => {
    const currentPos = props.direction === 'horizontal' ? event.clientX : event.clientY;
    let delta = currentPos - startPos;
    
    // 如果是反向拖拽（右侧栏），反转delta值
    if (props.reverse) {
      delta = -delta;
    }
    
    const newSize = startSize + delta;
    
    // 限制大小范围
    const clampedSize = Math.max(props.minSize, Math.min(props.maxSize, newSize));
    
    emit('resize', clampedSize);
  });
  
  event.preventDefault();
  event.stopPropagation();
}

function stopResize(event?: MouseEvent) {
  if (!isResizing.value) return;
  
  isResizing.value = false;
  
  // 清理事件监听器
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('selectstart', preventSelection);
  
  // 恢复全局样式
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  document.body.style.pointerEvents = '';
  
  // 清理 RAF
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  
  emit('resizeEnd');
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function preventSelection(event: Event) {
  event.preventDefault();
  return false;
}

function resetSize() {
  emit('reset');
}

// 组件卸载时清理
onUnmounted(() => {
  if (isResizing.value) {
    stopResize();
  }
});
</script>

<style scoped>
.resize-handle {
  position: relative;
  z-index: 10;
  background-color: transparent;
  transition: background-color 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;
  user-select: none;
  touch-action: none;
}

.resize-handle:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.resize-handle-horizontal {
  width: 6px;
  height: 100%;
  cursor: col-resize;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.dark .resize-handle-horizontal {
  border-left: 1px solid #4b5563;
  border-right: 1px solid #4b5563;
}

.resize-handle-vertical {
  height: 4px;
  width: 100%;
  cursor: row-resize;
  border-top: 1px solid transparent;
  border-bottom: 1px solid #e5e7eb;
}

.dark .resize-handle-vertical {
  border-bottom: 1px solid #4b5563;
}

.resize-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.resize-handle:hover .resize-grip {
  opacity: 1;
}

.resize-handle-horizontal .resize-grip {
  flex-direction: column;
  gap: 2px;
}

.resize-handle-vertical .resize-grip {
  flex-direction: row;
  gap: 2px;
}

.grip-dot {
  width: 3px;
  height: 3px;
  background-color: #9ca3af;
  border-radius: 50%;
}

.dark .grip-dot {
  background-color: #6b7280;
}

/* 拖拽时的状态 */
.resize-handle:active {
  background-color: rgba(59, 130, 246, 0.2);
  transform: scale(1.1);
}

.resize-handle:active .resize-grip {
  opacity: 1;
}

.resize-handle:active .grip-dot {
  background-color: #3b82f6;
}

/* 拖拽中的状态 - 通过动态类控制 */
.resize-handle.resizing {
  background-color: rgba(59, 130, 246, 0.25) !important;
  transform: scale(1.05) !important;
  transition: none !important;
}

.resize-handle.resizing .resize-grip {
  opacity: 1 !important;
}

.resize-handle.resizing .grip-dot {
  background-color: #2563eb !important;
}
</style>
