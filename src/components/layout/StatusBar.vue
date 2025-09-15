<template>
  <div class="h-6 bg-gray-100 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between px-4 text-xs text-gray-600 dark:text-gray-400">
    <!-- 左侧：应用状态 -->
    <div class="flex items-center space-x-4">
      <!-- 同步状态 -->
      <div class="flex items-center space-x-1">
        <div
          class="w-2 h-2 rounded-full"
          :class="{
            'bg-green-500': syncStatus === 'synced',
            'bg-yellow-500': syncStatus === 'syncing',
            'bg-red-500': syncStatus === 'error',
            'bg-gray-400': syncStatus === 'offline'
          }"
        ></div>
        <span>{{ syncStatusText }}</span>
      </div>
      
      <!-- 复习提醒 (非笔记页面时显示) -->
      <div v-if="dueReviewsCount > 0 && !isInNoteEditor" class="flex items-center space-x-1 text-red-600 dark:text-red-400">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <span>{{ dueReviewsCount }} 篇待复习</span>
      </div>
      
      <!-- 工作区信息 (非笔记页面时显示) -->
      <div v-if="!isInNoteEditor" class="flex items-center space-x-1">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
        </svg>
        <span>{{ workspaceStatus }}</span>
      </div>
    </div>
    
    <!-- 右侧：动态信息 -->
    <div class="flex items-center space-x-4">
      <!-- 笔记编辑器状态 (当在笔记页面时显示) -->
      <div v-if="isInNoteEditor && currentFile" class="flex items-center space-x-4">
        <!-- 文件名 -->
        <span class="font-medium text-gray-800 dark:text-gray-200" :title="currentFile.path">
          {{ currentFile.name }}
        </span>
        
        <!-- 文档统计 -->
        <span>{{ wordCount }} 字</span>
        <span>{{ charCount }} 字符</span>
        <span>{{ lineCount }} 行</span>
        
        <!-- 光标位置 -->
        <span v-if="currentLine > 0">{{ currentLine }}:{{ currentColumn }}</span>
        
        <!-- 编辑器模式 -->
        <span v-if="editorMode" class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded">
          {{ editorModeText }}
        </span>
        
        <!-- 保存状态 -->
        <span :class="{
          'text-green-600 dark:text-green-400': syncStatus === 'synced',
          'text-yellow-600 dark:text-yellow-400': syncStatus === 'syncing',
          'text-red-600 dark:text-red-400': syncStatus === 'error'
        }">
          {{ lastSavedText }}
        </span>
      </div>
      
      <!-- 总览信息 (非笔记页面时显示) -->
      <div v-else class="flex items-center space-x-4">
        <!-- 笔记总数 -->
        <div class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
          </svg>
          <span>共 {{ totalNotes }} 篇笔记</span>
        </div>
        
        <!-- 文件总数 -->
        <div class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clip-rule="evenodd"/>
          </svg>
          <span>{{ totalFiles }} 个文件</span>
        </div>
        
        <!-- 打开的标签页数 -->
        <div v-if="openTabsCount > 0" class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
          </svg>
          <span>{{ openTabsCount }} 个标签页</span>
        </div>
      </div>
      
      <!-- 当前时间 -->
      <span class="text-gray-500">{{ currentTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNotesStore } from '../../stores/notes';
import { useReviewsStore } from '../../stores/reviews';
import { useTabManagerStore } from '../../stores/tabManager';
import { useAppStore } from '../../stores/app';
import { useFilesStore } from '../../stores/files';
import { useSettingsStore } from '../../stores/settings';

const { t } = useI18n();
const route = useRoute();
const notesStore = useNotesStore();
const reviewsStore = useReviewsStore();
const tabManager = useTabManagerStore();
const filesStore = useFilesStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();

// 响应式状态
const syncStatus = ref<'synced' | 'syncing' | 'error' | 'offline'>('synced');
const currentTime = ref('');
const currentLine = ref(1);
const currentColumn = ref(1);
const timeInterval = ref<number | null>(null);
const editorMode = ref<'wysiwyg' | 'source' | 'preview' | null>(null);

// 计算属性 - 页面状态
const isInNoteEditor = computed(() => {
  return route.name === 'NoteEditor' && appStore.currentFile !== null;
});

const currentFile = computed(() => appStore.currentFile);

// 计算属性 - 数据统计
const totalNotes = computed(() => notesStore.notes.length);
const totalFiles = computed(() => {
  return filesStore.flattenedTree.filter(node => !node.isDirectory).length;
});
const dueReviewsCount = computed(() => reviewsStore.dueReviews.length);
const openTabsCount = computed(() => tabManager.totalTabCount);

// 计算属性 - 工作区状态
const workspaceStatus = computed(() => {
  const dirName = settingsStore.workspaceDirectory
    ? settingsStore.workspaceDirectory.split(/[/\\]/).pop()
    : 'Warehouse';
  return `工作区: ${dirName}`;
});

// 计算属性 - 同步状态文本
const syncStatusText = computed(() => {
  switch (syncStatus.value) {
    case 'synced':
      return '已保存';
    case 'syncing':
      return '保存中...';
    case 'error':
      return '错误';
    case 'offline':
      return '就绪';
    default:
      return '';
  }
});

// 计算属性 - 编辑器模式文本
const editorModeText = computed(() => {
  if (!editorMode.value) return '';
  switch (editorMode.value) {
    case 'wysiwyg':
      return '所见即所得';
    case 'source':
      return '源码模式';
    case 'preview':
      return '预览模式';
    default:
      return '';
  }
});

// 计算属性 - 文档统计
const wordCount = computed(() => {
  if (!currentFile.value?.content) return 0;
  
  // 简单的中文字数统计
  const content = currentFile.value.content;
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = content.match(/[a-zA-Z]+/g) || [];
  
  return chineseChars.length + englishWords.length;
});

const charCount = computed(() => {
  if (!currentFile.value?.content) return 0;
  return currentFile.value.content.length;
});

const lineCount = computed(() => {
  if (!currentFile.value?.content) return 0;
  return currentFile.value.content.split('\n').length;
});

const lastSavedText = computed(() => {
  if (!isInNoteEditor.value) return '';
  
  // 这里可以根据实际的保存时间来显示
  switch (syncStatus.value) {
    case 'synced':
      return '已保存';
    case 'syncing':
      return '保存中...';
    case 'error':
      return '保存失败';
    default:
      return '';
  }
});

// 方法
function updateCurrentTime() {
  currentTime.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function updateCursorPosition(line: number, column: number) {
  currentLine.value = line;
  currentColumn.value = column;
}

function updateEditorMode(mode: 'wysiwyg' | 'source' | 'preview' | null) {
  editorMode.value = mode;
}

function updateSyncStatus(status: 'synced' | 'syncing' | 'error' | 'offline') {
  syncStatus.value = status;
}

// 监听路由变化，重置状态
watch(() => route.name, (newRouteName) => {
  if (newRouteName !== 'NoteEditor') {
    currentLine.value = 1;
    currentColumn.value = 1;
    editorMode.value = null;
  }
});

onMounted(async () => {
  // 更新当前时间
  updateCurrentTime();
  timeInterval.value = window.setInterval(updateCurrentTime, 1000);
  
  // 初始化数据
  try {
    await notesStore.loadNotes();
    await reviewsStore.loadDueReviews();
    await filesStore.initialize();
  } catch (error) {
    console.error('初始化状态栏数据失败:', error);
  }
});

onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value);
  }
});

// 暴露方法给父组件使用
defineExpose({
  updateCursorPosition,
  updateEditorMode,
  updateSyncStatus,
});
</script>

<style scoped>
/* 状态栏特定样式 */
</style>