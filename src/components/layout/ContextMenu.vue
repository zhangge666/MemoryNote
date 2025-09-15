<template>
  <div
    ref="menuRef"
    class="context-menu"
    :style="{ top: y + 'px', left: x + 'px' }"
    @click.stop
  >
    <!-- 标签信息 -->
    <div class="menu-header">
      <div class="flex items-center space-x-2">
        <component v-if="tab?.icon" :is="tab.icon" class="w-4 h-4" />
        <svg v-else-if="tab?.type === 'note'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium text-sm truncate">{{ tab?.title }}</span>
      </div>
    </div>
    
    <div class="menu-divider"></div>
    
    <!-- 基本操作 -->
    <div class="menu-section">
      <div class="menu-item" @click="$emit('closeTab')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭标签页</span>
        <span class="menu-shortcut">Ctrl+W</span>
      </div>
      
      <div class="menu-item" @click="$emit('closeOthers')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm-8 8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clip-rule="evenodd"/>
        </svg>
        <span>关闭其他标签页</span>
      </div>
      
      <div class="menu-item" @click="$emit('closeToLeft')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭左侧标签页</span>
      </div>
      
      <div class="menu-item" @click="$emit('closeToRight')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭右侧标签页</span>
      </div>
    </div>
    
    <div class="menu-divider"></div>
    
    <!-- 标签页操作 -->
    <div class="menu-section">
      <div class="menu-item" @click="$emit('duplicateTab')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
        </svg>
        <span>复制标签页</span>
        <span class="menu-shortcut">Ctrl+Shift+K</span>
      </div>
      
      <div class="menu-item" @click="$emit('pinTab')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8zM9 5a2 2 0 00-2 2v6h10V7a2 2 0 00-2-2H9z" clip-rule="evenodd"/>
        </svg>
        <span>{{ tab?.isPinned ? '取消固定' : '固定标签页' }}</span>
      </div>
    </div>
    
    <div class="menu-divider"></div>
    
    <!-- 分屏操作 -->
    <div class="menu-section">
      <div class="menu-title">分屏操作</div>
      
      <div class="menu-item" @click="$emit('moveToNewHorizontal')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h8v18H3V3zm10 0h8v18h-8V3z"/>
        </svg>
        <span>移至新左右分屏</span>
      </div>
      
      <div class="menu-item" @click="$emit('moveToNewVertical')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h18v8H3V3zm0 10h18v8H3v-8z"/>
        </svg>
        <span>移至新上下分屏</span>
      </div>
    </div>
    
    <div class="menu-divider"></div>
    
    <!-- 全局操作 -->
    <div class="menu-section">
      <div class="menu-title">全局操作</div>
      
      <div class="menu-item" @click="$emit('closeAll')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
        <span>关闭所有标签页</span>
        <span class="menu-shortcut">Ctrl+Shift+W</span>
      </div>
      
      <div class="menu-item" @click="$emit('reopenClosed')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
        </svg>
        <span>重新打开已关闭</span>
        <span class="menu-shortcut">Ctrl+Shift+T</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import type { Tab } from '../../stores/tabManager';

// Props
interface Props {
  x: number;
  y: number;
  tab: Tab | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  closeTab: [];
  closeOthers: [];
  closeToLeft: [];
  closeToRight: [];
  duplicateTab: [];
  pinTab: [];
  moveToNewHorizontal: [];
  moveToNewVertical: [];
  closeAll: [];
  reopenClosed: [];
}>();

const menuRef = ref<HTMLElement>();

// 调整菜单位置防止超出屏幕
onMounted(() => {
  nextTick(() => {
    if (!menuRef.value) return;
    
    const menuRect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newX = props.x;
    let newY = props.y;
    
    // 防止右侧超出
    if (props.x + menuRect.width > viewportWidth) {
      newX = viewportWidth - menuRect.width - 8;
    }
    
    // 防止底部超出
    if (props.y + menuRect.height > viewportHeight) {
      newY = viewportHeight - menuRect.height - 8;
    }
    
    // 防止左侧超出
    if (newX < 8) {
      newX = 8;
    }
    
    // 防止顶部超出
    if (newY < 8) {
      newY = 8;
    }
    
    menuRef.value.style.left = newX + 'px';
    menuRef.value.style.top = newY + 'px';
  });
});
</script>

<style scoped>
.context-menu {
  @apply fixed z-50 min-w-56 max-w-80;
  @apply bg-white dark:bg-dark-800;
  @apply border border-gray-200 dark:border-dark-600;
  @apply rounded-lg shadow-xl;
  @apply py-2;
  animation: contextMenuFadeIn 0.15s ease-out;
}

.menu-header {
  @apply px-3 py-2;
  @apply bg-gray-50 dark:bg-dark-700/50;
  @apply border-b border-gray-200 dark:border-dark-600;
  @apply mx-2 mb-1 rounded;
}

.menu-section {
  @apply px-1;
}

.menu-title {
  @apply px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400;
  @apply uppercase tracking-wider;
}

.menu-item {
  @apply flex items-center space-x-3 px-3 py-2;
  @apply text-sm text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700;
  @apply cursor-pointer;
  @apply transition-colors duration-150;
  @apply rounded mx-1;
  @apply relative;
}

.menu-item:hover {
  @apply text-gray-900 dark:text-gray-100;
}

.menu-item svg {
  @apply flex-shrink-0;
}

.menu-shortcut {
  @apply ml-auto text-xs text-gray-400 dark:text-gray-500;
  @apply font-mono;
}

.menu-divider {
  @apply h-px bg-gray-200 dark:bg-dark-600 my-1 mx-2;
}

/* 动画效果 */
@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .context-menu {
    @apply min-w-48 max-w-64;
  }
  
  .menu-item {
    @apply px-2 py-1.5 text-sm;
  }
  
  .menu-shortcut {
    @apply hidden;
  }
}

/* 可访问性 */
.menu-item:focus {
  @apply outline-none bg-gray-100 dark:bg-dark-700;
}

/* 特殊状态 */
.menu-item[data-danger="true"] {
  @apply text-red-600 dark:text-red-400;
}

.menu-item[data-danger="true"]:hover {
  @apply bg-red-50 dark:bg-red-900/20;
  @apply text-red-700 dark:text-red-300;
}

.menu-item[data-disabled="true"] {
  @apply text-gray-400 dark:text-gray-600;
  @apply cursor-not-allowed;
}

.menu-item[data-disabled="true"]:hover {
  @apply bg-transparent;
  @apply text-gray-400 dark:text-gray-600;
}
</style>




