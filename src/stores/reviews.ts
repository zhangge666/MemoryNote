import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ReviewRecord } from '../database/DatabaseManager';

export const useReviewsStore = defineStore('reviews', () => {
  // 状态
  const dueReviews = ref<ReviewRecord[]>([]);
  const currentReview = ref<ReviewRecord | null>(null);
  const reviewStats = ref({
    todayCompleted: 0,
    todayDue: 0,
    streak: 0,
    totalReviews: 0,
  });
  const isLoading = ref(false);

  // 计算属性
  const hasReviewsDue = computed(() => dueReviews.value.length > 0);
  
  const reviewProgress = computed(() => {
    if (reviewStats.value.todayDue === 0) return 100;
    return Math.round((reviewStats.value.todayCompleted / reviewStats.value.todayDue) * 100);
  });

  const nextReview = computed(() => {
    return dueReviews.value[0] || null;
  });

  // 方法
  async function loadDueReviews() {
    try {
      isLoading.value = true;
      dueReviews.value = await window.electronAPI.reviews.getDue();
      reviewStats.value.todayDue = dueReviews.value.length;
    } catch (error) {
      console.error('加载待复习内容失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function submitReview(noteId: number, quality: number) {
    try {
      const reviewRecord = await window.electronAPI.reviews.submit(noteId, quality);
      
      // 从待复习列表中移除
      const index = dueReviews.value.findIndex(review => review.note_id === noteId);
      if (index > -1) {
        dueReviews.value.splice(index, 1);
      }
      
      // 更新统计
      reviewStats.value.todayCompleted++;
      
      return reviewRecord;
    } catch (error) {
      console.error('提交复习失败:', error);
      throw error;
    }
  }

  async function loadReviewHistory(noteId: number) {
    try {
      return await window.electronAPI.reviews.getByNoteId(noteId);
    } catch (error) {
      console.error('加载复习历史失败:', error);
      throw error;
    }
  }

  function setCurrentReview(review: ReviewRecord | null) {
    currentReview.value = review;
  }

  function startReviewSession() {
    if (dueReviews.value.length > 0) {
      currentReview.value = dueReviews.value[0];
    }
  }

  function nextReviewItem() {
    if (dueReviews.value.length > 1) {
      currentReview.value = dueReviews.value[1];
    } else {
      currentReview.value = null;
    }
  }

  function updateStats(stats: Partial<typeof reviewStats.value>) {
    reviewStats.value = { ...reviewStats.value, ...stats };
  }

  return {
    // 状态
    dueReviews,
    currentReview,
    reviewStats,
    isLoading,
    
    // 计算属性
    hasReviewsDue,
    reviewProgress,
    nextReview,
    
    // 方法
    loadDueReviews,
    submitReview,
    loadReviewHistory,
    setCurrentReview,
    startReviewSession,
    nextReviewItem,
    updateStats,
  };
});
