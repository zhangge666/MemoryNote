<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-48"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
    >
      <!-- 文件夹特有选项 -->
      <template v-if="target?.isDirectory">
        <div class="menu-item" @click="$emit('new-file')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>新建笔记</span>
          <kbd class="kbd">Ctrl+N</kbd>
        </div>
        
        <div class="menu-item" @click="$emit('new-folder')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>新建文件夹</span>
          <kbd class="kbd">Ctrl+Shift+N</kbd>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-item" @click="$emit('collapse-all')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
          <span>折叠所有</span>
        </div>
        
        <div class="menu-item" @click="$emit('expand-all')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
          <span>展开所有</span>
        </div>
      </template>
      
      <!-- 文件特有选项 -->
      <template v-if="target?.isFile">
        <div class="menu-item" @click="$emit('open')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
          <span>打开</span>
          <kbd class="kbd">Enter</kbd>
        </div>
        
        <div class="menu-item" @click="$emit('open-new-tab')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          <span>在新标签中打开</span>
          <kbd class="kbd">Ctrl+Enter</kbd>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-item" @click="$emit('copy-path')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
          </svg>
          <span>复制路径</span>
          <kbd class="kbd">Ctrl+Shift+C</kbd>
        </div>
        
        <div class="menu-item" @click="$emit('copy-link')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <span>复制内部链接</span>
          <kbd class="kbd">Ctrl+Shift+L</kbd>
        </div>
      </template>
      
      <!-- 通用选项 -->
      <div class="menu-divider"></div>
      
      <div class="menu-item" @click="$emit('rename')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        <span>重命名</span>
        <kbd class="kbd">F2</kbd>
      </div>
      
      <div class="menu-item" @click="$emit('duplicate')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>复制</span>
        <kbd class="kbd">Ctrl+D</kbd>
      </div>
      
      <div class="menu-item text-red-600 dark:text-red-400" @click="$emit('delete')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        <span>删除</span>
        <kbd class="kbd">Del</kbd>
      </div>
      
      <div class="menu-divider"></div>
      
      <div class="menu-item" @click="$emit('reveal-in-explorer')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        <span>在文件管理器中显示</span>
        <kbd class="kbd">Ctrl+Shift+E</kbd>
      </div>
      
      <div class="menu-item" @click="$emit('properties')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>属性</span>
        <kbd class="kbd">Alt+Enter</kbd>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import type { FileItem } from '../../stores/files';

interface Props {
  visible: boolean;
  x: number;
  y: number;
  target?: FileItem | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'new-file'): void;
  (e: 'new-folder'): void;
  (e: 'open'): void;
  (e: 'open-new-tab'): void;
  (e: 'rename'): void;
  (e: 'duplicate'): void;
  (e: 'delete'): void;
  (e: 'copy-path'): void;
  (e: 'copy-link'): void;
  (e: 'collapse-all'): void;
  (e: 'expand-all'): void;
  (e: 'reveal-in-explorer'): void;
  (e: 'properties'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const menuRef = ref<HTMLElement>();

// 监听可见性变化，调整菜单位置
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick();
    adjustMenuPosition();
  }
});

function adjustMenuPosition() {
  if (!menuRef.value) return;
  
  const menu = menuRef.value;
  const rect = menu.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // 调整水平位置
  if (props.x + rect.width > viewport.width) {
    menu.style.left = (viewport.width - rect.width - 10) + 'px';
  }
  
  // 调整垂直位置
  if (props.y + rect.height > viewport.height) {
    menu.style.top = (viewport.height - rect.height - 10) + 'px';
  }
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close');
  }
}

// 监听全局点击事件
watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('contextmenu', handleClickOutside);
  }
});
</script>

<style scoped>
.context-menu {
  animation: fadeIn 0.15s ease-out;
  max-height: 80vh;
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  @apply flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150;
}

.menu-item svg {
  @apply mr-3 flex-shrink-0;
}

.menu-item:hover {
  @apply text-gray-900 dark:text-gray-100;
}

.menu-item:active {
  @apply bg-gray-200 dark:bg-gray-600;
}

.menu-divider {
  @apply border-t border-gray-200 dark:border-gray-600 my-1;
}

.kbd {
  @apply ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded;
}
</style>


