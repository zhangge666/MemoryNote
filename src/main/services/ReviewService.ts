/**
 * 复习系统服务
 * 阶段 9: 复习系统
 *
 * 提供复习卡片的生成、管理和复习算法
 * 支持可替换的 Diff 算法和复习算法（通过插件）
 */

import { getInstance as getDatabase } from '../database/DatabaseManager';
import type {
  ReviewCard,
  ReviewResult,
  ReviewStats,
  DiffChange,
  IReviewAlgorithm,
  IDiffAlgorithm,
  CreateReviewCardOptions,
  ReviewCardFilter,
  ReviewHistory,
  DailyReviewStats,
  CalendarDay,
  CalendarDayStatus,
  ReviewAlgorithmResult,
} from '../../shared/types/review';

/**
 * 默认 SM-2 算法实现
 */
class SM2Algorithm implements IReviewAlgorithm {
  name = 'SM-2';

  calculate(
    card: ReviewCard,
    result: ReviewResult
  ): {
    interval: number;
    difficulty: number;
    easeFactor: number;
    repetitions: number;
    nextReview: number;
  } {
    const { quality } = result;
    let { easeFactor, repetitions, interval } = card;

    // SM-2 算法核心
    if (quality >= 3) {
      // 正确回答
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // 错误回答，重置
      repetitions = 0;
      interval = 1;
    }

    // 更新简易因子
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // 计算难度 (0-1)
    const difficulty = Math.max(0, Math.min(1, 1 - (easeFactor - 1.3) / 1.2));

    // 计算下次复习时间
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    return {
      interval,
      difficulty,
      easeFactor,
      repetitions,
      nextReview,
    };
  }
}

/**
 * 默认 Diff 算法实现（基于行的简单比较）
 */
class SimpleDiffAlgorithm implements IDiffAlgorithm {
  name = 'SimpleDiff';

  diff(oldText: string, newText: string): DiffChange[] {
    const changes: DiffChange[] = [];
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    // 使用 LCS (Longest Common Subsequence) 变体
    const oldSet = new Set(oldLines.map((line, idx) => `${idx}:${line}`));
    const newSet = new Set(newLines.map((line, idx) => `${idx}:${line}`));

    // 找出删除的行（在旧文本中但不在新文本中）
    const deletedLines: { line: string; index: number }[] = [];
    oldLines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !newLines.includes(line)) {
        deletedLines.push({ line, index });
      }
    });

    // 找出新增的行（在新文本中但不在旧文本中）
    const addedLines: { line: string; index: number }[] = [];
    newLines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !oldLines.includes(line)) {
        addedLines.push({ line, index });
      }
    });

    // 合并连续的行为块
    const mergeConsecutiveLines = (
      lines: { line: string; index: number }[]
    ): { content: string; lineStart: number; lineEnd: number }[] => {
      if (lines.length === 0) return [];

      const blocks: { content: string; lineStart: number; lineEnd: number }[] = [];
      let currentBlock = {
        content: lines[0].line,
        lineStart: lines[0].index,
        lineEnd: lines[0].index,
      };

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].index === currentBlock.lineEnd + 1) {
          currentBlock.content += '\n' + lines[i].line;
          currentBlock.lineEnd = lines[i].index;
        } else {
          blocks.push(currentBlock);
          currentBlock = {
            content: lines[i].line,
            lineStart: lines[i].index,
            lineEnd: lines[i].index,
          };
        }
      }
      blocks.push(currentBlock);

      return blocks;
    };

    // 生成删除变更
    const deletedBlocks = mergeConsecutiveLines(deletedLines);
    deletedBlocks.forEach((block) => {
      changes.push({
        type: 'delete',
        content: block.content,
        lineStart: block.lineStart,
        lineEnd: block.lineEnd,
      });
    });

    // 生成新增变更
    const addedBlocks = mergeConsecutiveLines(addedLines);
    addedBlocks.forEach((block) => {
      changes.push({
        type: 'add',
        content: block.content,
        lineStart: block.lineStart,
        lineEnd: block.lineEnd,
      });
    });

    // 检测修改（删除和新增在相似位置）
    // 简单实现：如果删除和新增内容相似度高，标记为修改
    const processedAdded = new Set<number>();
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      if (change.type === 'delete') {
        // 寻找可能的修改对应项
        for (let j = 0; j < changes.length; j++) {
          if (changes[j].type === 'add' && !processedAdded.has(j)) {
            const similarity = this.calculateSimilarity(change.content, changes[j].content);
            if (similarity > 0.3 && similarity < 0.95) {
              // 转换为修改
              change.type = 'modify';
              change.oldContent = change.content;
              change.content = changes[j].content;
              processedAdded.add(j);
              changes.splice(j, 1);
              break;
            }
          }
        }
      }
    }

    return changes;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    let intersection = 0;
    set1.forEach((word) => {
      if (set2.has(word)) intersection++;
    });

    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}

/**
 * 复习服务
 */
export class ReviewService {
  private static instance: ReviewService;
  private reviewAlgorithm: IReviewAlgorithm;
  private diffAlgorithm: IDiffAlgorithm;

  private constructor() {
    this.reviewAlgorithm = new SM2Algorithm();
    this.diffAlgorithm = new SimpleDiffAlgorithm();
  }

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * 设置复习算法（用于插件替换）
   */
  setReviewAlgorithm(algorithm: IReviewAlgorithm): void {
    this.reviewAlgorithm = algorithm;
    console.log(`📚 Review algorithm set to: ${algorithm.name}`);
  }

  /**
   * 获取当前复习算法
   */
  getReviewAlgorithm(): IReviewAlgorithm {
    return this.reviewAlgorithm;
  }

  /**
   * 设置 Diff 算法（用于插件替换）
   */
  setDiffAlgorithm(algorithm: IDiffAlgorithm): void {
    this.diffAlgorithm = algorithm;
    console.log(`🔍 Diff algorithm set to: ${algorithm.name}`);
  }

  /**
   * 获取当前 Diff 算法
   */
  getDiffAlgorithm(): IDiffAlgorithm {
    return this.diffAlgorithm;
  }

  /**
   * 从笔记变更生成复习卡片
   */
  async generateCardsFromDiff(
    noteId: string,
    oldContent: string,
    newContent: string
  ): Promise<ReviewCard[]> {
    const db = getDatabase();
    // 算法可能返回 Promise（沙箱执行），使用 await 处理
    const diffResult = this.diffAlgorithm.diff(oldContent, newContent);
    const changes: DiffChange[] = Array.isArray(diffResult) ? diffResult : await diffResult;
    const cards: ReviewCard[] = [];

    for (const change of changes) {
      // 跳过空内容
      if (!change.content.trim()) continue;

      const now = Date.now();
      const cardType =
        change.type === 'add'
          ? 'added'
          : change.type === 'delete'
            ? 'deleted'
            : 'modified';

      const metadata = JSON.stringify({
        lineStart: change.lineStart,
        lineEnd: change.lineEnd,
        oldContent: change.oldContent,
      });

      const result = await db.execute(
        `INSERT INTO review_cards (note_id, content, type, difficulty, interval, next_review, created_at, updated_at, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          change.content,
          cardType,
          0.5, // 初始难度
          0, // 初始间隔
          now, // 立即可复习
          now,
          now,
          metadata,
        ]
      );

      const card: ReviewCard = {
        id: result.lastID,
        noteId,
        content: change.content,
        oldContent: change.oldContent,
        type: cardType,
        difficulty: 0.5,
        interval: 0,
        easeFactor: 2.5, // SM-2 默认值
        repetitions: 0,
        nextReview: now,
        createdAt: now,
        updatedAt: now,
        metadata: { lineStart: change.lineStart, lineEnd: change.lineEnd },
      };

      cards.push(card);
    }

    console.log(`📝 Generated ${cards.length} review cards from diff`);
    return cards;
  }

  /**
   * 创建复习卡片
   */
  async createCard(options: CreateReviewCardOptions): Promise<ReviewCard> {
    const db = getDatabase();
    const now = Date.now();

    const result = await db.execute(
      `INSERT INTO review_cards (note_id, content, type, difficulty, interval, next_review, created_at, updated_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        options.noteId,
        options.content,
        options.type,
        0.5,
        0,
        now,
        now,
        now,
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );

    return {
      id: result.lastID,
      noteId: options.noteId,
      content: options.content,
      oldContent: options.oldContent,
      type: options.type,
      difficulty: 0.5,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: now,
      createdAt: now,
      updatedAt: now,
      metadata: options.metadata,
    };
  }

  /**
   * 获取待复习的卡片
   */
  async getDueCards(limit: number = 20): Promise<ReviewCard[]> {
    const db = getDatabase();
    const now = Date.now();

    const rows = await db.query<any>(
      `SELECT rc.*, n.title as note_title
       FROM review_cards rc
       LEFT JOIN notes n ON rc.note_id = n.id
       WHERE rc.next_review <= ?
       ORDER BY rc.next_review ASC
       LIMIT ?`,
      [now, limit]
    );

    return rows.map(this.mapRowToCard);
  }

  /**
   * 获取笔记的所有复习卡片
   */
  async getCardsByNote(noteId: string): Promise<ReviewCard[]> {
    const db = getDatabase();

    const rows = await db.query<any>(
      `SELECT rc.*, n.title as note_title
       FROM review_cards rc
       LEFT JOIN notes n ON rc.note_id = n.id
       WHERE rc.note_id = ?
       ORDER BY rc.created_at DESC`,
      [noteId]
    );

    return rows.map(this.mapRowToCard);
  }

  /**
   * 获取单个卡片
   */
  async getCard(cardId: number): Promise<ReviewCard | null> {
    const db = getDatabase();

    const row = await db.queryOne<any>(
      `SELECT rc.*, n.title as note_title
       FROM review_cards rc
       LEFT JOIN notes n ON rc.note_id = n.id
       WHERE rc.id = ?`,
      [cardId]
    );

    return row ? this.mapRowToCard(row) : null;
  }

  /**
   * 获取所有卡片（带过滤）
   */
  async getCards(filter: ReviewCardFilter = {}): Promise<ReviewCard[]> {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.noteId) {
      conditions.push('rc.note_id = ?');
      params.push(filter.noteId);
    }

    if (filter.type) {
      conditions.push('rc.type = ?');
      params.push(filter.type);
    }

    if (filter.isDue) {
      conditions.push('rc.next_review <= ?');
      params.push(Date.now());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = filter.limit ? `LIMIT ${filter.limit}` : '';
    const offsetClause = filter.offset ? `OFFSET ${filter.offset}` : '';

    const rows = await db.query<any>(
      `SELECT rc.*, n.title as note_title
       FROM review_cards rc
       LEFT JOIN notes n ON rc.note_id = n.id
       ${whereClause}
       ORDER BY rc.next_review ASC
       ${limitClause} ${offsetClause}`,
      params
    );

    return rows.map(this.mapRowToCard);
  }

  /**
   * 复习卡片
   */
  async reviewCard(cardId: number, result: ReviewResult): Promise<ReviewCard> {
    const db = getDatabase();
    const card = await this.getCard(cardId);

    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    // 使用算法计算新参数（算法可能返回 Promise，沙箱执行）
    const calcResult = this.reviewAlgorithm.calculate(card, result);
    const calculated: ReviewAlgorithmResult = 'then' in calcResult ? await calcResult : calcResult;
    const now = Date.now();

    // 更新卡片
    await db.execute(
      `UPDATE review_cards
       SET difficulty = ?, interval = ?, next_review = ?, updated_at = ?,
           metadata = json_set(COALESCE(metadata, '{}'), '$.easeFactor', ?, '$.repetitions', ?)
       WHERE id = ?`,
      [
        calculated.difficulty,
        calculated.interval,
        calculated.nextReview,
        now,
        calculated.easeFactor,
        calculated.repetitions,
        cardId,
      ]
    );

    // 记录复习历史
    await db.execute(
      `INSERT INTO review_history (card_id, quality, reviewed_at, time_spent)
       VALUES (?, ?, ?, ?)`,
      [cardId, result.quality, now, result.timeSpent]
    );

    return {
      ...card,
      difficulty: calculated.difficulty,
      interval: calculated.interval,
      easeFactor: calculated.easeFactor,
      repetitions: calculated.repetitions,
      nextReview: calculated.nextReview,
      updatedAt: now,
    };
  }

  /**
   * 跳过卡片（延迟 10 分钟）
   */
  async skipCard(cardId: number): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    const delay = 10 * 60 * 1000; // 10 minutes

    await db.execute(
      `UPDATE review_cards
       SET next_review = ?, updated_at = ?
       WHERE id = ?`,
      [now + delay, now, cardId]
    );
  }

  /**
   * 删除卡片
   */
  async deleteCard(cardId: number): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM review_cards WHERE id = ?', [cardId]);
  }

  /**
   * 删除笔记的所有卡片
   */
  async deleteCardsByNote(noteId: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM review_cards WHERE note_id = ?', [noteId]);
  }

  /**
   * 获取复习统计
   */
  async getStats(): Promise<ReviewStats> {
    const db = getDatabase();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 总卡片数
    const totalResult = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM review_cards'
    );
    const totalCards = totalResult?.count || 0;

    // 待复习卡片数
    const dueResult = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM review_cards WHERE next_review <= ?',
      [now]
    );
    const dueCards = dueResult?.count || 0;

    // 已学习卡片数（已复习过至少一次）
    const learnedResult = await db.queryOne<{ count: number }>(
      'SELECT COUNT(DISTINCT card_id) as count FROM review_history'
    );
    const learnedCards = learnedResult?.count || 0;

    // 新卡片数（从未复习）
    const newCards = totalCards - learnedCards;

    // 今日复习数
    const todayResult = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM review_history WHERE reviewed_at >= ?',
      [todayStart.getTime()]
    );
    const reviewedToday = todayResult?.count || 0;

    // 平均质量
    const avgResult = await db.queryOne<{ avg: number | null }>(
      'SELECT AVG(quality) as avg FROM review_history WHERE reviewed_at >= ?',
      [todayStart.getTime()]
    );
    const averageQuality = avgResult?.avg || 0;

    // 连续复习天数
    const streakDays = await this.calculateStreakDays();

    return {
      totalCards,
      dueCards,
      learnedCards,
      newCards,
      reviewedToday,
      averageQuality: Math.round(averageQuality * 100) / 100,
      streakDays,
    };
  }

  /**
   * 计算连续复习天数
   */
  private async calculateStreakDays(): Promise<number> {
    const db = getDatabase();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const result = await db.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM review_history WHERE reviewed_at >= ? AND reviewed_at < ?',
        [dayStart.getTime(), dayEnd.getTime()]
      );

      if (result && result.count > 0) {
        streak++;
      } else if (i > 0) {
        // 今天可以没有复习，但之前的断了就停止
        break;
      }
    }

    return streak;
  }

  /**
   * 获取复习历史
   */
  async getReviewHistory(cardId: number, limit: number = 10): Promise<ReviewHistory[]> {
    const db = getDatabase();

    const rows = await db.query<any>(
      `SELECT * FROM review_history
       WHERE card_id = ?
       ORDER BY reviewed_at DESC
       LIMIT ?`,
      [cardId, limit]
    );

    return rows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      quality: row.quality,
      reviewedAt: row.reviewed_at,
      timeSpent: row.time_spent,
    }));
  }

  /**
   * 获取每日复习统计
   */
  async getDailyStats(days: number = 30): Promise<DailyReviewStats[]> {
    const db = getDatabase();
    const stats: DailyReviewStats[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const result = await db.queryOne<{
        count: number;
        avg_quality: number | null;
        total_time: number | null;
      }>(
        `SELECT
           COUNT(*) as count,
           AVG(quality) as avg_quality,
           SUM(time_spent) as total_time
         FROM review_history
         WHERE reviewed_at >= ? AND reviewed_at < ?`,
        [date.getTime(), nextDate.getTime()]
      );

      stats.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        cardsReviewed: result?.count || 0,
        averageQuality: Math.round((result?.avg_quality || 0) * 100) / 100,
        totalTimeSpent: result?.total_time || 0,
      });
    }

    return stats.reverse();
  }

  /**
   * 获取日历数据（月视图）
   */
  async getCalendarData(year: number, month: number): Promise<CalendarDay[]> {
    const db = getDatabase();
    const calendar: CalendarDay[] = [];

    // 获取该月的天数
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(year, month - 1, day + 1);
      nextDate.setHours(0, 0, 0, 0);

      // 使用本地时间格式化日期字符串，避免时区问题
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // 获取当天待复习的卡片数（next_review 在当天范围内）
      const dueResult = await db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM review_cards
         WHERE next_review >= ? AND next_review < ?`,
        [date.getTime(), nextDate.getTime()]
      );
      const dueCount = dueResult?.count || 0;

      // 获取当天已复习的卡片数
      const reviewedResult = await db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM review_history
         WHERE reviewed_at >= ? AND reviewed_at < ?`,
        [date.getTime(), nextDate.getTime()]
      );
      const reviewedCount = reviewedResult?.count || 0;

      // 确定状态
      let status: CalendarDayStatus;

      if (date > today) {
        // 未来的日期
        if (dueCount > 0) {
          status = 'pending'; // 蓝色 - 待复习计划
        } else {
          status = 'empty';
        }
      } else {
        // 今天或过去的日期
        if (dueCount === 0 && reviewedCount === 0) {
          status = 'empty'; // 空白
        } else if (reviewedCount >= dueCount && dueCount > 0) {
          status = 'completed'; // 绿色 - 完成
        } else if (reviewedCount > 0 && reviewedCount < dueCount) {
          status = 'incomplete'; // 红色 - 未完成
        } else if (dueCount > 0 && reviewedCount === 0) {
          status = 'incomplete'; // 红色 - 有待复习但未复习
        } else if (reviewedCount > 0) {
          status = 'completed'; // 绿色 - 有复习记录
        } else {
          status = 'empty';
        }
      }

      calendar.push({
        date: dateStr,
        status,
        dueCount,
        reviewedCount,
      });
    }

    return calendar;
  }

  /**
   * 将数据库行映射为 ReviewCard
   */
  private mapRowToCard(row: any): ReviewCard {
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};

    return {
      id: row.id,
      noteId: row.note_id,
      noteTitle: row.note_title,
      content: row.content,
      oldContent: metadata.oldContent,
      type: row.type,
      difficulty: row.difficulty,
      interval: row.interval,
      easeFactor: metadata.easeFactor || 2.5,
      repetitions: metadata.repetitions || 0,
      nextReview: row.next_review,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata,
    };
  }
}

/**
 * 获取 ReviewService 单例
 */
export const getReviewService = (): ReviewService => {
  return ReviewService.getInstance();
};
