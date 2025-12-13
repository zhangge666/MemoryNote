/**
 * 复习系统类型定义
 * 阶段 9: 复习系统
 */

/**
 * Diff 变更类型
 */
export interface DiffChange {
  type: 'add' | 'modify' | 'delete';
  content: string;
  oldContent?: string; // 修改时保留旧内容
  lineStart: number;
  lineEnd: number;
}

/**
 * 复习卡片
 */
export interface ReviewCard {
  id: number;
  noteId: string;
  noteTitle?: string; // 关联的笔记标题（用于显示）
  content: string;
  oldContent?: string; // 修改类型时的旧内容
  type: 'added' | 'modified' | 'deleted';
  difficulty: number; // 难度系数 (0-1)
  interval: number; // 复习间隔（天）
  easeFactor: number; // 简易因子 (SM-2)
  repetitions: number; // 重复次数
  nextReview: number; // 下次复习时间戳
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

/**
 * 复习结果
 */
export interface ReviewResult {
  quality: number; // 0-5，5 表示完全记住
  timeSpent: number; // 毫秒
}

/**
 * 复习统计
 */
export interface ReviewStats {
  totalCards: number;
  dueCards: number;
  learnedCards: number;
  newCards: number;
  reviewedToday: number;
  averageQuality: number;
  streakDays: number;
}

/**
 * 复习算法接口（可替换）
 */
export interface IReviewAlgorithm {
  name: string;
  /**
   * 计算下次复习时间
   */
  calculate(
    card: ReviewCard,
    result: ReviewResult
  ): {
    interval: number;
    difficulty: number;
    easeFactor: number;
    repetitions: number;
    nextReview: number;
  };
}

/**
 * Diff 算法接口（可替换）
 */
export interface IDiffAlgorithm {
  name: string;
  /**
   * 计算两个文本之间的差异
   */
  diff(oldText: string, newText: string): DiffChange[];
}

/**
 * 创建复习卡片选项
 */
export interface CreateReviewCardOptions {
  noteId: string;
  content: string;
  oldContent?: string;
  type: 'added' | 'modified' | 'deleted';
  metadata?: Record<string, any>;
}

/**
 * 复习卡片过滤器
 */
export interface ReviewCardFilter {
  noteId?: string;
  type?: 'added' | 'modified' | 'deleted';
  isDue?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 复习会话
 */
export interface ReviewSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  cardsReviewed: number;
  averageQuality: number;
  totalTimeSpent: number;
}

/**
 * 复习历史记录
 */
export interface ReviewHistory {
  id: number;
  cardId: number;
  quality: number;
  reviewedAt: number;
  timeSpent: number;
}

/**
 * 每日复习统计
 */
export interface DailyReviewStats {
  date: string; // YYYY-MM-DD
  cardsReviewed: number;
  averageQuality: number;
  totalTimeSpent: number;
}

/**
 * 日历状态类型
 * - empty: 无复习内容
 * - pending: 待复习（蓝色）
 * - incomplete: 有复习内容但未完成（红色）
 * - completed: 复习完成（绿色）
 */
export type CalendarDayStatus = 'empty' | 'pending' | 'incomplete' | 'completed';

/**
 * 日历天数据
 */
export interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: CalendarDayStatus;
  dueCount: number; // 当天待复习数量
  reviewedCount: number; // 当天已复习数量
}
