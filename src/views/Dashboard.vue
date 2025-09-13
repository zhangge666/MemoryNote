<template>
  <div class="h-full bg-gray-50 dark:bg-dark-900 overflow-auto">
    <div class="max-w-7xl mx-auto p-6">
      <!-- 欢迎区域 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          欢迎回来，{{ settingsStore.userName }}！
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          今天是 {{ formatDate(new Date()) }}，让我们开始学习吧
        </p>
      </div>
      
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- 笔记总数 -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">笔记总数</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ totalNotes }}</p>
            </div>
          </div>
        </div>
        
        <!-- 今日复习 -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">今日复习</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ todayReviews }}</p>
            </div>
          </div>
        </div>
        
        <!-- 学习连续天数 -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">连续学习</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ studyStreak }} 天</p>
            </div>
          </div>
        </div>
        
        <!-- 本周新增 -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">本周新增</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ weeklyNewNotes }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 主要内容区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 最近笔记 -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">最近笔记</h2>
              <router-link
                to="/note"
                class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                查看全部
              </router-link>
            </div>
            
            <div v-if="recentNotes.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
              <p>还没有笔记，创建第一篇笔记吧！</p>
              <button
                @click="createFirstNote"
                class="btn btn-primary mt-4"
              >
                创建笔记
              </button>
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="note in recentNotes.slice(0, 5)"
                :key="note.id"
                @click="openNote(note)"
                class="p-4 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors"
              >
                <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-1">{{ note.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {{ getPreviewText(note.content) }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>{{ formatDate(note.updated_at) }}</span>
                  <span v-if="note.category" class="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded">
                    {{ note.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧面板 -->
        <div class="space-y-6">
          <!-- 今日复习 -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">今日复习</h3>
              <router-link
                to="/review"
                class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                开始复习
              </router-link>
            </div>
            
            <div v-if="dueReviews.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
              <svg class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm">今天没有需要复习的内容</p>
            </div>
            
            <div v-else class="space-y-2">
              <div
                v-for="review in dueReviews.slice(0, 3)"
                :key="review.id"
                class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {{ (review as any).title }}
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  间隔: {{ review.interval_days }} 天
                </p>
              </div>
              
              <div v-if="dueReviews.length > 3" class="text-center">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  还有 {{ dueReviews.length - 3 }} 个待复习
                </span>
              </div>
            </div>
          </div>
          
          <!-- 快速操作 -->
          <div class="card p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">快速操作</h3>
            <div class="space-y-3">
              <button
                @click="createNewNote"
                class="w-full btn btn-primary"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                </svg>
                新建笔记
              </button>
              
              <button
                @click="importFiles"
                class="w-full btn btn-secondary"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
                导入文件
              </button>
              
              <button
                @click="startReview"
                class="w-full btn btn-ghost"
                :disabled="dueReviews.length === 0"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"/>
                </svg>
                开始复习
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '../stores/notes';
import { useReviewsStore } from '../stores/reviews';
import { useSettingsStore } from '../stores/settings';
import { useAppStore } from '../stores/app';
import type { Note } from '../database/DatabaseManager';

const router = useRouter();
const notesStore = useNotesStore();
const reviewsStore = useReviewsStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();

// 计算属性
const totalNotes = computed(() => notesStore.notes.length);
const recentNotes = computed(() => notesStore.recentNotes);
const dueReviews = computed(() => reviewsStore.dueReviews);
const todayReviews = computed(() => dueReviews.value.length);
const studyStreak = computed(() => reviewsStore.reviewStats.streak);

const weeklyNewNotes = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return notesStore.notes.filter(note => {
    if (!note.created_at) return false;
    return new Date(note.created_at) > oneWeekAgo;
  }).length;
});

// 方法
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

function getPreviewText(content: string): string {
  const plainText = content
    .replace(/#+\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
}

function openNote(note: Note) {
  notesStore.setCurrentNote(note);
  appStore.openTab({
    id: note.id!.toString(),
    title: note.title,
    type: 'note'
  });
  router.push(`/note/${note.id}`);
}

async function createNewNote() {
  try {
    const newNote = await notesStore.createNote({
      title: '新建笔记',
      content: '',
      category: '',
      tags: '',
    });
    
    openNote(newNote);
  } catch (error) {
    console.error('创建笔记失败:', error);
  }
}

async function createFirstNote() {
  await createNewNote();
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

function startReview() {
  if (dueReviews.value.length > 0) {
    router.push('/review');
  }
}

onMounted(() => {
  // 加载数据
  notesStore.loadNotes();
  reviewsStore.loadDueReviews();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
