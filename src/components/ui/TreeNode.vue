<template>
  <div class="tree-node">
    <div
      class="tree-node-content group relative flex items-center py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-150"
      :class="{
        'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500': isSelected,
        'text-blue-600 dark:text-blue-400': isSelected,
        'pl-2': level === 0,
        'pl-6': level === 1,
        'pl-10': level === 2,
        'pl-14': level === 3,
        'pl-18': level === 4,
        'pl-22': level >= 5
      }"
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
      @dblclick="handleDoubleClick"
    >
      <!-- 连接线 -->
      <div 
        v-if="level > 0"
        class="absolute left-0 top-0 bottom-0 border-l border-gray-200 dark:border-gray-600"
        :style="{ left: (level * 16 - 8) + 'px' }"
      ></div>
      
      <!-- 展开/收缩按钮 -->
      <div class="w-4 h-4 mr-1 flex items-center justify-center flex-shrink-0">
        <button
          v-if="node.isDirectory"
          @click.stop="$emit('toggle', node)"
          class="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group-hover:opacity-100"
          :class="{ 'opacity-60': !hasChildren && !node.isExpanded }"
        >
          <svg
            class="w-3 h-3 text-gray-600 dark:text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-90': node.isExpanded }"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
      
      <!-- 文件类型图标 -->
      <div class="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
        <!-- 文件夹图标 -->
        <svg 
          v-if="node.isDirectory" 
          class="w-4 h-4 transition-colors"
          :class="node.isExpanded ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'"
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path v-if="node.isExpanded" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
          <path v-else d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
        </svg>
        
        <!-- Markdown文件图标 -->
        <svg 
          v-else-if="isMarkdownFile" 
          class="w-4 h-4 text-gray-600 dark:text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
        </svg>
        
        <!-- 其他文件图标 -->
        <svg 
          v-else 
          class="w-4 h-4 text-gray-400 dark:text-gray-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
        </svg>
      </div>
      
      <!-- 文件名 -->
      <div class="flex-1 min-w-0 mr-2">
        <div 
          class="text-sm font-medium truncate transition-colors"
          :class="isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'"
        >
          {{ displayName }}
        </div>
        <div 
          v-if="!node.isDirectory && showDetails" 
          class="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2"
        >
          <span>{{ formatDate(node.modified) }}</span>
          <span>{{ formatFileSize(node.size) }}</span>
        </div>
      </div>
      
      <!-- 操作按钮组 -->
      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- 快速创建按钮（仅文件夹） -->
        <button
          v-if="node.isDirectory"
          @click.stop="$emit('quick-create', node)"
          class="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
          title="快速新建笔记"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        
        <!-- 更多操作按钮 -->
        <button
          @click.stop="handleMoreActions"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
          title="更多操作"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </button>
      </div>
      
      <!-- 拖拽指示器 -->
      <div
        v-if="isDragOver"
        class="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 border-dashed rounded"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TreeNode } from '../../stores/files';

interface Props {
  node: TreeNode;
  selectedPath?: string;
  showDetails?: boolean;
}

interface Emits {
  (e: 'toggle', node: TreeNode): void;
  (e: 'select', node: TreeNode): void;
  (e: 'context-menu', node: TreeNode, event: MouseEvent): void;
  (e: 'double-click', node: TreeNode): void;
  (e: 'quick-create', node: TreeNode): void;
  (e: 'more-actions', node: TreeNode, event: MouseEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false
});

const emit = defineEmits<Emits>();

// 状态
const isDragOver = ref(false);

// 计算属性
const level = computed(() => props.node.level || 0);

const isSelected = computed(() => props.selectedPath === props.node.path);

const isMarkdownFile = computed(() => 
  props.node.isFile && /\.(md|markdown)$/i.test(props.node.name)
);

const hasChildren = computed(() => 
  props.node.children && props.node.children.length > 0
);

const displayName = computed(() => {
  if (props.node.isDirectory) {
    return props.node.name;
  }
  // 去掉文件扩展名
  return props.node.name.replace(/\.(md|markdown)$/i, '');
});

// 方法
function handleClick() {
  if (props.node.isDirectory) {
    emit('toggle', props.node);
  } else {
    emit('select', props.node);
  }
}

function handleContextMenu(event: MouseEvent) {
  emit('context-menu', props.node, event);
}

function handleDoubleClick() {
  emit('double-click', props.node);
}

function handleMoreActions(event: MouseEvent) {
  emit('more-actions', props.node, event);
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 拖拽功能（预留）
function handleDragOver(event: DragEvent) {
  if (props.node.isDirectory) {
    event.preventDefault();
    isDragOver.value = true;
  }
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
  // TODO: 实现拖拽文件到文件夹功能
}
</script>

<style scoped>
.tree-node {
  user-select: none;
  position: relative;
}

.tree-node-content:hover .opacity-0 {
  opacity: 1;
}

.rotate-90 {
  transform: rotate(90deg);
}

/* 连接线样式 */
.tree-node::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 8px;
  height: 1px;
  background-color: theme('colors.gray.300');
}

.dark .tree-node::before {
  background-color: theme('colors.gray.600');
}

/* 选中状态的特殊样式 */
.tree-node-content.bg-blue-50 {
  position: relative;
}

.tree-node-content.bg-blue-50::after {
  content: '';
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background-color: theme('colors.blue.500');
  border-radius: 50%;
}

.dark .tree-node-content.bg-blue-50::after {
  background-color: theme('colors.blue.400');
}
</style>