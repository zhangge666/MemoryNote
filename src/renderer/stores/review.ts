/**
 * 复习系统状态管理
 * 阶段 9: 复习系统
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ReviewCard,
  ReviewStats,
  DailyReviewStats,
  CreateReviewCardOptions,
} from '../../shared/types/review';

// 待审核卡片类型
export interface PendingCard {
  id: string; // 临时ID
  noteId: string;
  noteTitle?: string;
  content: string;
  oldContent?: string;
  type: 'added' | 'modified' | 'deleted';
  metadata?: Record<string, any>;
}

export const useReviewStore = defineStore('review', () => {
  // 状态
  const dueCards = ref<ReviewCard[]>([]);
  const pendingCards = ref<PendingCard[]>([]); // 待审核的卡片
  const currentCard = ref<ReviewCard | null>(null);
  const currentIndex = ref(0);
  const stats = ref<ReviewStats | null>(null);
  const dailyStats = ref<DailyReviewStats[]>([]);
  const isLoading = ref(false);
  const isReviewing = ref(false);
  const error = ref<string | null>(null);
  const reviewStartTime = ref<number>(0);

  // 计算属性
  const hasCards = computed(() => dueCards.value.length > 0);
  const hasPendingCards = computed(() => pendingCards.value.length > 0);
  const remainingCards = computed(() => dueCards.value.length - currentIndex.value);
  const progress = computed(() => {
    if (dueCards.value.length === 0) return 0;
    return Math.round((currentIndex.value / dueCards.value.length) * 100);
  });

  /**
   * 加载待复习卡片
   */
  async function loadDueCards(limit = 50): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await window.ipc.review.getDueCards(limit);
      if (response.success && response.data) {
        dueCards.value = response.data;
        currentIndex.value = 0;
        currentCard.value = response.data.length > 0 ? response.data[0] : null;
      } else {
        error.value = response.error || 'Failed to load cards';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to load due cards:', e);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载复习统计
   */
  async function loadStats(): Promise<void> {
    try {
      const response = await window.ipc.review.getStats();
      if (response.success && response.data) {
        stats.value = response.data;
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  /**
   * 加载每日统计
   */
  async function loadDailyStats(days = 30): Promise<void> {
    try {
      const response = await window.ipc.review.getDailyStats(days);
      if (response.success && response.data) {
        dailyStats.value = response.data;
      }
    } catch (e) {
      console.error('Failed to load daily stats:', e);
    }
  }

  /**
   * 开始复习会话
   */
  function startReview(): void {
    isReviewing.value = true;
    currentIndex.value = 0;
    reviewStartTime.value = Date.now();
    if (dueCards.value.length > 0) {
      currentCard.value = dueCards.value[0];
    }
  }

  /**
   * 结束复习会话
   */
  function endReview(): void {
    isReviewing.value = false;
    currentCard.value = null;
    reviewStartTime.value = 0;
  }

  /**
   * 提交复习结果
   */
  async function submitReview(quality: number): Promise<void> {
    if (!currentCard.value) return;

    const timeSpent = Date.now() - reviewStartTime.value;

    try {
      const response = await window.ipc.review.reviewCard(currentCard.value.id, {
        quality,
        timeSpent,
      });

      if (response.success) {
        // 移动到下一张卡片
        moveToNextCard();
        // 刷新统计
        await loadStats();
      } else {
        error.value = response.error || 'Failed to submit review';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to submit review';
      console.error('Failed to submit review:', e);
    }
  }

  /**
   * 跳过当前卡片
   */
  async function skipCurrentCard(): Promise<void> {
    if (!currentCard.value) return;

    try {
      const response = await window.ipc.review.skipCard(currentCard.value.id);
      if (response.success) {
        moveToNextCard();
      }
    } catch (e) {
      console.error('Failed to skip card:', e);
    }
  }

  /**
   * 删除当前卡片
   */
  async function deleteCurrentCard(): Promise<void> {
    if (!currentCard.value) return;

    try {
      const response = await window.ipc.review.deleteCard(currentCard.value.id);
      if (response.success) {
        // 从列表中移除
        dueCards.value = dueCards.value.filter((c) => c.id !== currentCard.value?.id);
        // 更新当前卡片
        if (currentIndex.value >= dueCards.value.length) {
          currentIndex.value = Math.max(0, dueCards.value.length - 1);
        }
        currentCard.value = dueCards.value[currentIndex.value] || null;
        // 刷新统计
        await loadStats();
      }
    } catch (e) {
      console.error('Failed to delete card:', e);
    }
  }

  /**
   * 移动到下一张卡片
   */
  function moveToNextCard(): void {
    currentIndex.value++;
    reviewStartTime.value = Date.now();

    if (currentIndex.value < dueCards.value.length) {
      currentCard.value = dueCards.value[currentIndex.value];
    } else {
      // 复习完成
      currentCard.value = null;
      isReviewing.value = false;
    }
  }

  /**
   * 移动到上一张卡片
   */
  function moveToPrevCard(): void {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      currentCard.value = dueCards.value[currentIndex.value];
      reviewStartTime.value = Date.now();
    }
  }

  /**
   * 从 diff 生成复习卡片
   */
  async function generateCardsFromDiff(
    noteId: string,
    oldContent: string,
    newContent: string
  ): Promise<ReviewCard[]> {
    try {
      const response = await window.ipc.review.generateFromDiff(
        noteId,
        oldContent,
        newContent
      );
      if (response.success && response.data) {
        // 刷新统计
        await loadStats();
        return response.data;
      }
      return [];
    } catch (e) {
      console.error('Failed to generate cards from diff:', e);
      return [];
    }
  }

  /**
   * 添加待审核卡片
   */
  function addPendingCards(cards: PendingCard[]): void {
    pendingCards.value.push(...cards);
  }

  /**
   * 接受单个待审核卡片（保存到数据库）
   */
  async function acceptPendingCard(cardId: string): Promise<boolean> {
    const card = pendingCards.value.find(c => c.id === cardId);
    if (!card) return false;

    try {
      // Ensure metadata is serializable (convert to plain object)
      const safeMetadata = card.metadata ? JSON.parse(JSON.stringify(card.metadata)) : undefined;
      
      const response = await window.ipc.review.createCard({
        noteId: card.noteId,
        content: card.content,
        oldContent: card.oldContent,
        type: card.type,
        metadata: safeMetadata,
      });

      if (response.success) {
        // 从待审核列表中移除
        pendingCards.value = pendingCards.value.filter(c => c.id !== cardId);
        // 刷新统计
        await loadStats();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to accept pending card:', e);
      return false;
    }
  }

  /**
   * 拒绝单个待审核卡片
   */
  function rejectPendingCard(cardId: string): void {
    pendingCards.value = pendingCards.value.filter(c => c.id !== cardId);
  }

  /**
   * 接受所有待审核卡片
   */
  async function acceptAllPendingCards(): Promise<number> {
    let accepted = 0;
    const cardsToAccept = [...pendingCards.value];

    for (const card of cardsToAccept) {
      try {
        // Ensure metadata is serializable (convert to plain object)
        const safeMetadata = card.metadata ? JSON.parse(JSON.stringify(card.metadata)) : undefined;
        
        const response = await window.ipc.review.createCard({
          noteId: card.noteId,
          content: card.content,
          oldContent: card.oldContent,
          type: card.type,
          metadata: safeMetadata,
        });

        if (response.success) {
          pendingCards.value = pendingCards.value.filter(c => c.id !== card.id);
          accepted++;
        }
      } catch (e) {
        console.error('Failed to accept pending card:', e);
      }
    }

    // 刷新统计
    if (accepted > 0) {
      await loadStats();
    }

    return accepted;
  }

  /**
   * 拒绝所有待审核卡片
   */
  function rejectAllPendingCards(): void {
    pendingCards.value = [];
  }

  /**
   * 清除指定笔记的待审核卡片
   */
  function clearPendingCardsForNote(noteId: string): void {
    pendingCards.value = pendingCards.value.filter(c => c.noteId !== noteId);
  }

  /**
   * 创建复习卡片（直接保存到数据库）
   */
  async function createCard(options: CreateReviewCardOptions): Promise<boolean> {
    try {
      const response = await window.ipc.review.createCard(options);
      if (response.success) {
        await loadStats();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to create card:', e);
      return false;
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    dueCards.value = [];
    pendingCards.value = [];
    currentCard.value = null;
    currentIndex.value = 0;
    isReviewing.value = false;
    error.value = null;
    reviewStartTime.value = 0;
  }

  return {
    // 状态
    dueCards,
    pendingCards,
    currentCard,
    currentIndex,
    stats,
    dailyStats,
    isLoading,
    isReviewing,
    error,

    // 计算属性
    hasCards,
    hasPendingCards,
    remainingCards,
    progress,

    // 方法
    loadDueCards,
    loadStats,
    loadDailyStats,
    startReview,
    endReview,
    submitReview,
    skipCurrentCard,
    deleteCurrentCard,
    moveToNextCard,
    moveToPrevCard,
    generateCardsFromDiff,
    addPendingCards,
    acceptPendingCard,
    rejectPendingCard,
    acceptAllPendingCards,
    rejectAllPendingCards,
    clearPendingCardsForNote,
    createCard,
    reset,
  };
});
