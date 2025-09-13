<template>
  <div
    class="resize-handle"
    :class="direction === 'horizontal' ? 'resize-handle-horizontal' : 'resize-handle-vertical'"
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
import { computed } from 'vue';

interface Props {
  direction: 'horizontal' | 'vertical';
  showGrip?: boolean;
  minSize?: number;
  maxSize?: number;
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
});

const emit = defineEmits<Emits>();

let isResizing = false;
let startPos = 0;
let startSize = 0;

function startResize(event: MouseEvent) {
  isResizing = true;
  startPos = props.direction === 'horizontal' ? event.clientX : event.clientY;
  
  // 获取父元素的当前大小
  const parentElement = (event.target as HTMLElement).parentElement;
  if (parentElement) {
    startSize = props.direction === 'horizontal' 
      ? parentElement.offsetWidth 
      : parentElement.offsetHeight;
  }
  
  emit('resizeStart');
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
  
  event.preventDefault();
}

function handleResize(event: MouseEvent) {
  if (!isResizing) return;
  
  const currentPos = props.direction === 'horizontal' ? event.clientX : event.clientY;
  const delta = currentPos - startPos;
  const newSize = startSize + delta;
  
  // 限制大小范围
  const clampedSize = Math.max(props.minSize, Math.min(props.maxSize, newSize));
  
  emit('resize', clampedSize);
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  emit('resizeEnd');
}

function resetSize() {
  emit('reset');
}
</script>

<style scoped>
.resize-handle {
  position: relative;
  z-index: 10;
  background-color: transparent;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.resize-handle:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.resize-handle-horizontal {
  width: 4px;
  height: 100%;
  cursor: col-resize;
  border-left: 1px solid transparent;
  border-right: 1px solid #e5e7eb;
}

.dark .resize-handle-horizontal {
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
}

.resize-handle:active .resize-grip {
  opacity: 1;
}

.resize-handle:active .grip-dot {
  background-color: #3b82f6;
}
</style>
