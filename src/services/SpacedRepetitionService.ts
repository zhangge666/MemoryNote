import { DatabaseManager, ReviewRecord } from '../database/DatabaseManager';

/**
 * 间隔重复服务 - 实现SM-2算法
 * 基于艾宾浩斯遗忘曲线的间隔重复算法
 */
export class SpacedRepetitionService {
  constructor(private dbManager: DatabaseManager) {}

  /**
   * 提交复习结果并计算下次复习时间
   * @param noteId 笔记ID
   * @param quality 复习质量 (0-5)
   * @returns 更新后的复习记录
   */
  async submitReview(noteId: number, quality: number): Promise<ReviewRecord> {
    // 获取最新的复习记录
    const existingRecords = this.dbManager.getReviewRecordsByNoteId(noteId);
    const lastRecord = existingRecords[0]; // 最新的记录

    let easeFactor: number;
    let interval: number;
    let repetitionCount: number;

    if (!lastRecord) {
      // 第一次复习
      easeFactor = 2.5;
      interval = quality >= 3 ? 1 : 0; // 如果质量差，立即重复
      repetitionCount = quality >= 3 ? 1 : 0;
    } else {
      // 基于SM-2算法计算新的参数
      const result = this.calculateSM2Parameters(
        lastRecord.ease_factor,
        lastRecord.interval_days,
        lastRecord.repetition_count,
        quality
      );
      
      easeFactor = result.easeFactor;
      interval = result.interval;
      repetitionCount = result.repetitionCount;
    }

    // 计算下次复习时间
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // 创建新的复习记录
    const newRecord = this.dbManager.createReviewRecord({
      note_id: noteId,
      quality,
      ease_factor: easeFactor,
      interval_days: interval,
      repetition_count: repetitionCount,
      next_review_at: nextReviewDate.toISOString()
    });

    return newRecord;
  }

  /**
   * SM-2算法实现
   * @param currentEaseFactor 当前简易因子
   * @param currentInterval 当前间隔天数
   * @param currentRepetitionCount 当前重复次数
   * @param quality 复习质量 (0-5)
   * @returns 新的SM-2参数
   */
  private calculateSM2Parameters(
    currentEaseFactor: number,
    currentInterval: number,
    currentRepetitionCount: number,
    quality: number
  ): { easeFactor: number; interval: number; repetitionCount: number } {
    let easeFactor = currentEaseFactor;
    let interval: number;
    let repetitionCount: number;

    // 如果质量低于3，重置学习进度
    if (quality < 3) {
      repetitionCount = 0;
      interval = 1;
    } else {
      repetitionCount = currentRepetitionCount + 1;
      
      // 根据重复次数计算间隔
      if (repetitionCount === 1) {
        interval = 1;
      } else if (repetitionCount === 2) {
        interval = 6;
      } else {
        interval = Math.round(currentInterval * easeFactor);
      }
    }

    // 更新简易因子
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // 简易因子最小值为1.3
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    return {
      easeFactor: Math.round(easeFactor * 100) / 100, // 保留两位小数
      interval,
      repetitionCount
    };
  }

  /**
   * 获取今日应复习的笔记
   * @returns 今日到期的复习记录
   */
  getTodayReviews(): ReviewRecord[] {
    return this.dbManager.getDueReviews();
  }

  /**
   * 获取复习统计信息
   * @returns 复习统计
   */
  getReviewStats(): {
    todayDue: number;
    totalReviews: number;
    averageEaseFactor: number;
  } {
    const dueReviews = this.getTodayReviews();
    
    // 这里可以添加更多统计逻辑
    return {
      todayDue: dueReviews.length,
      totalReviews: 0, // 需要从数据库查询
      averageEaseFactor: 2.5 // 需要计算平均值
    };
  }

  /**
   * 为新笔记初始化复习计划
   * @param noteId 笔记ID
   * @returns 初始复习记录
   */
  initializeReviewForNote(noteId: number): ReviewRecord {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.dbManager.createReviewRecord({
      note_id: noteId,
      quality: 3, // 默认质量
      ease_factor: 2.5, // 默认简易因子
      interval_days: 1, // 第一次复习间隔1天
      repetition_count: 0,
      next_review_at: tomorrow.toISOString()
    });
  }
}
