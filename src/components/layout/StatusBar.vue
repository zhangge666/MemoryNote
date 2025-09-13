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
      
      <!-- 复习提醒 -->
      <div v-if="dueReviewsCount > 0" class="flex items-center space-x-1 text-red-600 dark:text-red-400">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <span>{{ t('filePanel.noteCount', { count: dueReviewsCount }) }}</span>
      </div>
    </div>
    
    <!-- 右侧：文档信息 -->
    <div class="flex items-center space-x-4">
      <!-- 当前笔记信息 -->
      <div v-if="currentNote" class="flex items-center space-x-4">
        <!-- 字数统计 -->
        <span>{{ wordCount }} {{ t('statusBar.wordCount') }}</span>
        
        <!-- 字符数统计 -->
        <span>{{ charCount }} {{ t('statusBar.characterCount') }}</span>
        
        <!-- 行数统计 -->
        <span>{{ t('statusBar.lineCount') }} {{ currentLine }}</span>
        
        <!-- 列数统计 -->
        <span>{{ t('statusBar.position') }} {{ currentColumn }}</span>
        
        <!-- 文件路径 -->
        <span v-if="currentNote.file_path" :title="currentNote.file_path">
          {{ getFileName(currentNote.file_path) }}
        </span>
        
        <!-- 最后保存时间 -->
        <span>{{ lastSavedText }}</span>
      </div>
      
      <!-- 笔记总数 -->
      <span>共 {{ totalNotes }} 篇笔记</span>
      
      <!-- 当前时间 -->
      <span>{{ currentTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotesStore } from '../../stores/notes';
import { useReviewsStore } from '../../stores/reviews';

const { t } = useI18n();
const notesStore = useNotesStore();
const reviewsStore = useReviewsStore();

// 响应式状态
const syncStatus = ref<'synced' | 'syncing' | 'error' | 'offline'>('synced');
const currentTime = ref('');
const currentLine = ref(1);
const currentColumn = ref(1);
const timeInterval = ref<number | null>(null);

// 计算属性
const currentNote = computed(() => notesStore.currentNote);
const totalNotes = computed(() => notesStore.notes.length);
const dueReviewsCount = computed(() => reviewsStore.dueReviews.length);

const syncStatusText = computed(() => {
  switch (syncStatus.value) {
    case 'synced':
      return t('statusBar.saved');
    case 'syncing':
      return t('statusBar.saving');
    case 'error':
      return t('common.error');
    case 'offline':
      return t('statusBar.ready');
    default:
      return '';
  }
});

const wordCount = computed(() => {
  if (!currentNote.value) return 0;
  
  // 简单的中文字数统计
  const content = currentNote.value.content;
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = content.match(/[a-zA-Z]+/g) || [];
  
  return chineseChars.length + englishWords.length;
});

const charCount = computed(() => {
  if (!currentNote.value) return 0;
  return currentNote.value.content.length;
});

const lastSavedText = computed(() => {
  if (!currentNote.value?.updated_at) return '';
  
  const date = new Date(currentNote.value.updated_at);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
  
  if (diffInMinutes < 1) {
    return t('time.now');
  } else if (diffInMinutes < 60) {
    return t('time.minutesAgo', { n: Math.floor(diffInMinutes) });
  } else {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) + ' ' + t('statusBar.saved');
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

function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
}

function updateCursorPosition(line: number, column: number) {
  currentLine.value = line;
  currentColumn.value = column;
}

// 模拟同步状态变化
function simulateSyncStatus() {
  // 这里可以根据实际的同步逻辑来更新状态
  // 暂时保持为已同步状态
  syncStatus.value = 'synced';
}

onMounted(() => {
  // 更新当前时间
  updateCurrentTime();
  timeInterval.value = window.setInterval(updateCurrentTime, 1000);
  
  // 初始化同步状态
  simulateSyncStatus();
  
  // 监听编辑器光标位置变化（如果需要的话）
  // 这里可以添加编辑器的事件监听
});

onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value);
  }
});

// 暴露方法给父组件使用
defineExpose({
  updateCursorPosition,
});
</script>

<style scoped>
/* 状态栏特定样式 */
</style>
