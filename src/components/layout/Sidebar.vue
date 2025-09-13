<template>
  <div class="sidebar w-64 h-full flex flex-col">
    <!-- 导航菜单 -->
    <nav class="flex-1 p-4">
      <div class="space-y-2">
        <!-- 文档 -->
        <router-link
          to="/"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'Dashboard' }"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5zM7.5 10a.5.5 0 01.5-.5h4a.5.5 0 010 1H8a.5.5 0 01-.5-.5zm.5-2.5a.5.5 0 000 1h4a.5.5 0 000-1H8z" clip-rule="evenodd"/>
          </svg>
          <span>文档</span>
          <span v-if="notesCount > 0" class="nav-badge">{{ notesCount }}</span>
        </router-link>
        
        <!-- 订阅 -->
        <button class="nav-item" @click="showSubscriptions">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>订阅</span>
        </button>
        
        <!-- 复习计划 -->
        <router-link
          to="/review"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'ReviewCenter' }"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <span>复习计划</span>
          <span v-if="dueReviewsCount > 0" class="nav-badge bg-red-500">{{ dueReviewsCount }}</span>
        </router-link>
        
        <!-- 日记 -->
        <button class="nav-item" @click="showDiary">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
          </svg>
          <span>日记</span>
        </button>
      </div>
      
      <!-- 分隔线 -->
      <div class="border-t border-gray-200 dark:border-dark-600 my-4"></div>
      
      <!-- 快速操作 -->
      <div class="space-y-2">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
          快速操作
        </div>
        
        <button
          @click="createNewNote"
          class="nav-item"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          <span>新建笔记</span>
        </button>
        
        <button
          @click="importFiles"
          class="nav-item"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
          <span>导入文件</span>
        </button>
      </div>
    </nav>
    
    <!-- 底部设置按钮 -->
    <div class="p-4 border-t border-gray-200 dark:border-dark-600">
      <router-link
        to="/settings"
        class="nav-item"
        :class="{ 'nav-item-active': $route.name === 'Settings' }"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
        </svg>
        <span>设置</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '../../stores/notes';
import { useReviewsStore } from '../../stores/reviews';
import { useAppStore } from '../../stores/app';

const router = useRouter();
const notesStore = useNotesStore();
const reviewsStore = useReviewsStore();
const appStore = useAppStore();

// 计算属性
const notesCount = computed(() => notesStore.notes.length);
const dueReviewsCount = computed(() => reviewsStore.dueReviews.length);

// 方法
async function createNewNote() {
  try {
    const newNote = await notesStore.createNote({
      title: '新建笔记',
      content: '',
      category: '',
      tags: '',
    });
    
    // 打开新笔记
    appStore.openTab({
      id: newNote.id!.toString(),
      title: newNote.title,
      type: 'note'
    });
    
    router.push(`/note/${newNote.id}`);
  } catch (error) {
    console.error('创建笔记失败:', error);
  }
}

async function importFiles() {
  try {
    const result = await window.electronAPI.fs.showOpenDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      // TODO: 实现文件导入逻辑
      console.log('导入文件:', result.filePaths);
    }
  } catch (error) {
    console.error('导入文件失败:', error);
  }
}

function showSubscriptions() {
  // TODO: 实现订阅功能
  console.log('显示订阅');
}

function showDiary() {
  // TODO: 实现日记功能
  console.log('显示日记');
}

onMounted(() => {
  // 加载数据
  notesStore.loadNotes();
  reviewsStore.loadDueReviews();
});
</script>

<style scoped>
.nav-item {
  @apply flex items-center w-full px-3 py-2 text-sm font-medium rounded-md;
  @apply text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
  @apply space-x-3;
}

.nav-item-active {
  @apply bg-primary-100 dark:bg-primary-900/20;
  @apply text-primary-700 dark:text-primary-300;
}

.nav-badge {
  @apply inline-flex items-center justify-center px-2 py-1 text-xs font-bold;
  @apply bg-primary-100 text-primary-800 rounded-full;
  @apply dark:bg-primary-900/20 dark:text-primary-300;
  @apply ml-auto;
}
</style>
