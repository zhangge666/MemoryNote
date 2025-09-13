<template>
  <div class="h-full bg-gray-50 dark:bg-dark-900 overflow-auto">
    <div class="max-w-4xl mx-auto p-6">
      <!-- 复习中心头部 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">复习中心</h1>
        <p class="text-gray-600 dark:text-gray-400">
          基于艾宾浩斯遗忘曲线的智能复习系统
        </p>
      </div>
      
      <!-- 复习统计 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            {{ dueReviews.length }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">今日待复习</div>
        </div>
        
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {{ reviewStats.todayCompleted }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">今日已完成</div>
        </div>
        
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {{ reviewStats.streak }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">连续天数</div>
        </div>
      </div>
      
      <!-- 复习进度 -->
      <div v-if="dueReviews.length > 0" class="card p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">今日进度</h2>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ reviewProgress }}% 完成
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
          <div 
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${reviewProgress}%` }"
          ></div>
        </div>
      </div>
      
      <!-- 复习内容 -->
      <div v-if="!isReviewing && dueReviews.length > 0" class="card p-6">
        <div class="text-center">
          <div class="mb-6">
            <svg class="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
            <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              准备开始复习
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              今天有 {{ dueReviews.length }} 个笔记需要复习
            </p>
          </div>
          
          <button
            @click="startReview"
            class="btn btn-primary btn-lg"
          >
            开始复习
          </button>
        </div>
      </div>
      
      <!-- 复习界面 -->
      <div v-else-if="isReviewing && currentReview" class="card p-8">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              第 {{ currentReviewIndex + 1 }} / {{ totalReviews }} 个
            </span>
            <button
              @click="exitReview"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
          
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ (currentReview as any).title }}
          </h2>
          
          <div class="prose dark:prose-invert max-w-none mb-8">
            <div v-html="getRenderedContent((currentReview as any).content)"></div>
          </div>
        </div>
        
        <!-- 复习质量选择 -->
        <div class="text-center">
          <p class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
            这个知识点你掌握得如何？
          </p>
          
          <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
            <button
              v-for="(quality, index) in qualityOptions"
              :key="index"
              @click="submitReview(index)"
              class="quality-btn"
              :class="getQualityClass(index)"
            >
              <div class="text-2xl mb-2">{{ quality.emoji }}</div>
              <div class="text-sm font-medium">{{ quality.label }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ quality.description }}
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 复习完成 -->
      <div v-else-if="dueReviews.length === 0" class="card p-8 text-center">
        <svg class="w-16 h-16 mx-auto text-green-600 dark:text-green-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          今日复习完成！
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          恭喜你完成了今天的复习任务，继续保持！
        </p>
        <router-link to="/" class="btn btn-primary">
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReviewsStore } from '../stores/reviews';
import MarkdownIt from 'markdown-it';

const reviewsStore = useReviewsStore();
const md = new MarkdownIt();

// 响应式状态
const isReviewing = ref(false);
const currentReviewIndex = ref(0);

// 复习质量选项
const qualityOptions = [
  { emoji: '😰', label: '完全不会', description: '完全忘记' },
  { emoji: '😕', label: '很困难', description: '想起来很困难' },
  { emoji: '🤔', label: '有点困难', description: '想了一会儿' },
  { emoji: '😊', label: '还可以', description: '想起来了' },
  { emoji: '😎', label: '很容易', description: '很容易想起' },
  { emoji: '🚀', label: '完全掌握', description: '瞬间想起' },
];

// 计算属性
const dueReviews = computed(() => reviewsStore.dueReviews);
const reviewStats = computed(() => reviewsStore.reviewStats);
const currentReview = computed(() => reviewsStore.currentReview);
const totalReviews = computed(() => dueReviews.value.length);

const reviewProgress = computed(() => {
  if (totalReviews.value === 0) return 100;
  return Math.round((reviewStats.value.todayCompleted / (reviewStats.value.todayCompleted + dueReviews.value.length)) * 100);
});

// 方法
function startReview() {
  isReviewing.value = true;
  currentReviewIndex.value = 0;
  reviewsStore.startReviewSession();
}

function exitReview() {
  isReviewing.value = false;
  reviewsStore.setCurrentReview(null);
}

async function submitReview(quality: number) {
  if (!currentReview.value) return;
  
  try {
    await reviewsStore.submitReview(currentReview.value.note_id, quality);
    
    // 移动到下一个复习项目
    if (dueReviews.value.length > 0) {
      reviewsStore.nextReviewItem();
      currentReviewIndex.value++;
    } else {
      // 复习完成
      isReviewing.value = false;
    }
  } catch (error) {
    console.error('提交复习失败:', error);
  }
}

function getQualityClass(index: number): string {
  const baseClass = 'quality-btn';
  if (index <= 1) return `${baseClass} quality-poor`;
  if (index <= 3) return `${baseClass} quality-fair`;
  return `${baseClass} quality-good`;
}

function getRenderedContent(content: string): string {
  return md.render(content || '');
}

onMounted(() => {
  reviewsStore.loadDueReviews();
});
</script>

<style scoped>
.btn-lg {
  @apply px-8 py-4 text-lg;
}

.quality-btn {
  @apply p-4 rounded-lg border-2 border-gray-200 dark:border-dark-600;
  @apply hover:border-primary-300 dark:hover:border-primary-600;
  @apply transition-colors duration-200 cursor-pointer;
  @apply bg-white dark:bg-dark-800;
}

.quality-poor {
  @apply hover:border-red-300 dark:hover:border-red-600;
  @apply hover:bg-red-50 dark:hover:bg-red-900/20;
}

.quality-fair {
  @apply hover:border-yellow-300 dark:hover:border-yellow-600;
  @apply hover:bg-yellow-50 dark:hover:bg-yellow-900/20;
}

.quality-good {
  @apply hover:border-green-300 dark:hover:border-green-600;
  @apply hover:bg-green-50 dark:hover:bg-green-900/20;
}

.prose {
  @apply text-gray-900;
}

.dark .prose {
  @apply text-gray-100;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  @apply text-gray-900 dark:text-gray-100;
}

.prose p {
  @apply text-gray-700 dark:text-gray-300;
}
</style>
