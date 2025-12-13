/**
 * 复习系统 IPC 处理器
 * 阶段 9: 复习系统
 */

import { ipcMain } from 'electron';
import { getReviewService } from '../services/ReviewService';
import type {
  CreateReviewCardOptions,
  ReviewCardFilter,
  ReviewResult,
} from '../../shared/types/review';

/**
 * 注册复习系统 IPC 处理器
 */
export function registerReviewHandlers(): void {
  const reviewService = getReviewService();

  /**
   * 从 diff 生成复习卡片
   */
  ipcMain.handle(
    'review:generate-from-diff',
    async (_event, noteId: string, oldContent: string, newContent: string) => {
      try {
        const cards = await reviewService.generateCardsFromDiff(
          noteId,
          oldContent,
          newContent
        );
        return { success: true, data: cards };
      } catch (error: any) {
        console.error('Failed to generate review cards:', error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * 创建复习卡片
   */
  ipcMain.handle(
    'review:create-card',
    async (_event, options: CreateReviewCardOptions) => {
      try {
        const card = await reviewService.createCard(options);
        return { success: true, data: card };
      } catch (error: any) {
        console.error('Failed to create review card:', error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * 获取待复习卡片
   */
  ipcMain.handle('review:get-due-cards', async (_event, limit?: number) => {
    try {
      const cards = await reviewService.getDueCards(limit);
      return { success: true, data: cards };
    } catch (error: any) {
      console.error('Failed to get due cards:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 获取笔记的复习卡片
   */
  ipcMain.handle('review:get-cards-by-note', async (_event, noteId: string) => {
    try {
      const cards = await reviewService.getCardsByNote(noteId);
      return { success: true, data: cards };
    } catch (error: any) {
      console.error('Failed to get cards by note:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 获取单个卡片
   */
  ipcMain.handle('review:get-card', async (_event, cardId: number) => {
    try {
      const card = await reviewService.getCard(cardId);
      return { success: true, data: card };
    } catch (error: any) {
      console.error('Failed to get card:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 获取卡片列表（带过滤）
   */
  ipcMain.handle(
    'review:get-cards',
    async (_event, filter?: ReviewCardFilter) => {
      try {
        const cards = await reviewService.getCards(filter);
        return { success: true, data: cards };
      } catch (error: any) {
        console.error('Failed to get cards:', error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * 复习卡片
   */
  ipcMain.handle(
    'review:review-card',
    async (_event, cardId: number, result: ReviewResult) => {
      try {
        const card = await reviewService.reviewCard(cardId, result);
        return { success: true, data: card };
      } catch (error: any) {
        console.error('Failed to review card:', error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * 跳过卡片
   */
  ipcMain.handle('review:skip-card', async (_event, cardId: number) => {
    try {
      await reviewService.skipCard(cardId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to skip card:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 删除卡片
   */
  ipcMain.handle('review:delete-card', async (_event, cardId: number) => {
    try {
      await reviewService.deleteCard(cardId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete card:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 删除笔记的所有卡片
   */
  ipcMain.handle(
    'review:delete-cards-by-note',
    async (_event, noteId: string) => {
      try {
        await reviewService.deleteCardsByNote(noteId);
        return { success: true };
      } catch (error: any) {
        console.error('Failed to delete cards by note:', error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * 获取复习统计
   */
  ipcMain.handle('review:get-stats', async () => {
    try {
      const stats = await reviewService.getStats();
      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Failed to get review stats:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 获取卡片的复习历史
   */
  ipcMain.handle(
    'review:get-history',
    async (_event, cardId: number, limit?: number) => {
      try {
        const history = await reviewService.getReviewHistory(cardId, limit);
        return { success: true, data: history };
      } catch (error: any) {
        console.error('Failed to get review history:', error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * 获取每日复习统计
   */
  ipcMain.handle('review:get-daily-stats', async (_event, days?: number) => {
    try {
      const stats = await reviewService.getDailyStats(days);
      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Failed to get daily stats:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 获取日历数据
   */
  ipcMain.handle(
    'review:get-calendar',
    async (_event, year: number, month: number) => {
      try {
        const calendar = await reviewService.getCalendarData(year, month);
        return { success: true, data: calendar };
      } catch (error: any) {
        console.error('Failed to get calendar data:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('✅ Review IPC handlers registered');
}
