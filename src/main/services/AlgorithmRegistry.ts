/**
 * 算法注册表服务 (重构版 v2)
 * 统一管理所有算法 - 内置算法和插件算法使用相同接口
 * 
 * 核心改进:
 * 1. 职责分离：Registry 只负责注册/查询，不直接驱动 ReviewService
 * 2. 统一管理：内置算法作为"虚拟插件"注册
 * 3. 标准化 ID 格式：algo:{type}:{source}:{id}
 * 4. 更好的错误处理
 */

import { EventEmitter } from 'events';
import type { IReviewAlgorithm, IDiffAlgorithm, DiffChange, ReviewCard, ReviewResult } from '../../shared/types/review';
import type { PluginAlgorithmContribution, PluginInfo } from '../../shared/types/plugin';

/**
 * 注册的算法信息
 */
export interface RegisteredAlgorithm {
  id: string;
  name: string;
  description?: string;
  pluginId: string;
  pluginName: string;
  type: 'review' | 'diff';
  isBuiltin: boolean;  // 新增：标识是否为内置算法
}

/**
 * 算法条目
 */
interface AlgorithmEntry<T> {
  algorithm: T;
  info: RegisteredAlgorithm;
}

/** 内置插件常量 */
const BUILTIN_PLUGIN_ID = 'builtin-algorithms';
const BUILTIN_PLUGIN_NAME = 'MemoryNote Core';

/** 算法注册表事件 */
export const ALGORITHM_EVENTS = {
  ALGORITHM_REGISTERED: 'algorithm:registered',
  ALGORITHM_UNREGISTERED: 'algorithm:unregistered',
  CURRENT_CHANGED: 'algorithm:current-changed',
} as const;

/**
 * 算法注册表 (重构版 v2)
 * 职责：只负责注册、查询、事件通知，不直接驱动业务逻辑
 */
export class AlgorithmRegistry extends EventEmitter {
  private static instance: AlgorithmRegistry;
  
  // 统一的算法存储
  private reviewAlgorithms: Map<string, AlgorithmEntry<IReviewAlgorithm>> = new Map();
  private diffAlgorithms: Map<string, AlgorithmEntry<IDiffAlgorithm>> = new Map();
  
  // 当前选中的算法 ID
  private currentReviewAlgorithmId = 'algo:review:builtin:sm2';
  private currentDiffAlgorithmId = 'algo:diff:builtin:simple';
  
  // 初始化标志
  private initialized = false;

  private constructor() {
    super();
  }

  static getInstance(): AlgorithmRegistry {
    if (!AlgorithmRegistry.instance) {
      AlgorithmRegistry.instance = new AlgorithmRegistry();
    }
    return AlgorithmRegistry.instance;
  }

  /**
   * 重置实例（用于工作区切换）
   */
  static resetInstance(): void {
    if (AlgorithmRegistry.instance) {
      AlgorithmRegistry.instance.reviewAlgorithms.clear();
      AlgorithmRegistry.instance.diffAlgorithms.clear();
      AlgorithmRegistry.instance.initialized = false;
    }
  }

  /**
   * 初始化 - 注册内置算法
   */
  initialize(): void {
    if (this.initialized) {
      console.log('[AlgorithmRegistry] Already initialized, skipping');
      return;
    }
    
    this.registerBuiltinAlgorithms();
    this.initialized = true;
    console.log('[AlgorithmRegistry] Initialized with builtin algorithms');
  }

  /**
   * 生成标准化算法 ID
   * 格式: algo:{type}:{source}:{id}
   */
  static generateAlgorithmId(type: 'review' | 'diff', source: 'builtin' | 'plugin', pluginId: string, algorithmId: string): string {
    return `algo:${type}:${source}:${pluginId}:${algorithmId}`;
  }

  /**
   * 解析算法 ID
   */
  static parseAlgorithmId(id: string): { type: string; source: string; pluginId: string; algorithmId: string } | null {
    const parts = id.split(':');
    if (parts.length < 5 || parts[0] !== 'algo') return null;
    return {
      type: parts[1],
      source: parts[2],
      pluginId: parts[3],
      algorithmId: parts.slice(4).join(':'),
    };
  }

  /**
   * 注册内置算法（作为虚拟插件）
   */
  private registerBuiltinAlgorithms(): void {
    // SM-2 复习算法
    this.registerReviewAlgorithmInternal(
      'algo:review:builtin:sm2',
      {
        name: 'SM-2',
        calculate: (card: ReviewCard, result: ReviewResult) => {
          const { quality } = result;
          let { easeFactor, repetitions, interval } = card;

          if (quality >= 3) {
            if (repetitions === 0) {
              interval = 1;
            } else if (repetitions === 1) {
              interval = 6;
            } else {
              interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
          } else {
            repetitions = 0;
            interval = 1;
          }

          easeFactor = Math.max(
            1.3,
            easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
          );

          const difficulty = Math.max(0, Math.min(1, 1 - (easeFactor - 1.3) / 1.2));
          const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

          return { interval, difficulty, easeFactor, repetitions, nextReview };
        },
      },
      {
        id: 'algo:review:builtin:sm2',
        name: 'SM-2',
        description: 'SuperMemo 2 算法，经典的间隔重复算法',
        pluginId: BUILTIN_PLUGIN_ID,
        pluginName: BUILTIN_PLUGIN_NAME,
        type: 'review',
        isBuiltin: true,
      }
    );

    // Anki 复习算法
    this.registerReviewAlgorithmInternal(
      'algo:review:builtin:anki',
      {
        name: 'Anki',
        calculate: (card: ReviewCard, result: ReviewResult) => {
          const { quality } = result;
          let { easeFactor, repetitions, interval } = card;

          const easyBonus = 1.3;
          const hardPenalty = 0.8;

          if (quality >= 3) {
            if (repetitions === 0) {
              interval = 1;
            } else if (repetitions === 1) {
              interval = 4;
            } else {
              const modifier = quality === 5 ? easyBonus : quality === 3 ? hardPenalty : 1;
              interval = Math.round(interval * easeFactor * modifier);
            }
            repetitions += 1;
          } else {
            repetitions = 0;
            interval = 1;
          }

          if (quality === 5) {
            easeFactor += 0.15;
          } else if (quality === 3) {
            easeFactor -= 0.15;
          } else if (quality < 3) {
            easeFactor -= 0.20;
          }
          easeFactor = Math.max(1.3, easeFactor);

          const difficulty = Math.max(0, Math.min(1, 1 - (easeFactor - 1.3) / 1.2));
          const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

          return { interval, difficulty, easeFactor, repetitions, nextReview };
        },
      },
      {
        id: 'algo:review:builtin:anki',
        name: 'Anki',
        description: 'Anki 风格的间隔重复算法',
        pluginId: BUILTIN_PLUGIN_ID,
        pluginName: BUILTIN_PLUGIN_NAME,
        type: 'review',
        isBuiltin: true,
      }
    );

    // SimpleDiff 算法
    this.registerDiffAlgorithmInternal(
      'algo:diff:builtin:simple',
      {
        name: 'SimpleDiff',
        diff: (oldText: string, newText: string): DiffChange[] => {
          const changes: DiffChange[] = [];
          const oldLines = oldText.split('\n');
          const newLines = newText.split('\n');

          oldLines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && !newLines.includes(line)) {
              changes.push({
                type: 'delete',
                content: line,
                lineStart: index + 1,
                lineEnd: index + 1,
              });
            }
          });

          newLines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && !oldLines.includes(line)) {
              changes.push({
                type: 'add',
                content: line,
                lineStart: index + 1,
                lineEnd: index + 1,
              });
            }
          });

          return changes;
        },
      },
      {
        id: 'algo:diff:builtin:simple',
        name: 'SimpleDiff',
        description: '基于行的简单比较算法',
        pluginId: BUILTIN_PLUGIN_ID,
        pluginName: BUILTIN_PLUGIN_NAME,
        type: 'diff',
        isBuiltin: true,
      }
    );

    console.log('[AlgorithmRegistry] Registered builtin algorithms');
  }

  /**
   * 内部方法：注册复习算法
   */
  private registerReviewAlgorithmInternal(
    id: string,
    algorithm: IReviewAlgorithm,
    info: RegisteredAlgorithm
  ): void {
    this.reviewAlgorithms.set(id, { algorithm, info });
    this.emit(ALGORITHM_EVENTS.ALGORITHM_REGISTERED, { type: 'review', id, info });
  }

  /**
   * 内部方法：注册 Diff 算法
   */
  private registerDiffAlgorithmInternal(
    id: string,
    algorithm: IDiffAlgorithm,
    info: RegisteredAlgorithm
  ): void {
    this.diffAlgorithms.set(id, { algorithm, info });
    this.emit(ALGORITHM_EVENTS.ALGORITHM_REGISTERED, { type: 'diff', id, info });
  }

  /**
   * 从插件注册复习算法
   */
  registerReviewAlgorithmFromPlugin(
    pluginInfo: PluginInfo,
    contribution: PluginAlgorithmContribution,
    algorithm: IReviewAlgorithm
  ): void {
    const algorithmId = AlgorithmRegistry.generateAlgorithmId('review', 'plugin', pluginInfo.manifest.id, contribution.id);
    
    this.reviewAlgorithms.set(algorithmId, {
      algorithm,
      info: {
        id: algorithmId,
        name: contribution.name,
        description: contribution.description,
        pluginId: pluginInfo.manifest.id,
        pluginName: pluginInfo.manifest.name,
        type: 'review',
        isBuiltin: false,
      },
    });

    console.log(`[AlgorithmRegistry] Registered review algorithm: ${contribution.name} from ${pluginInfo.manifest.name}`);
  }

  /**
   * 从插件注册 Diff 算法
   */
  registerDiffAlgorithmFromPlugin(
    pluginInfo: PluginInfo,
    contribution: PluginAlgorithmContribution,
    algorithm: IDiffAlgorithm
  ): void {
    const algorithmId = AlgorithmRegistry.generateAlgorithmId('diff', 'plugin', pluginInfo.manifest.id, contribution.id);
    
    this.diffAlgorithms.set(algorithmId, {
      algorithm,
      info: {
        id: algorithmId,
        name: contribution.name,
        description: contribution.description,
        pluginId: pluginInfo.manifest.id,
        pluginName: pluginInfo.manifest.name,
        type: 'diff',
        isBuiltin: false,
      },
    });

    console.log(`[AlgorithmRegistry] Registered diff algorithm: ${contribution.name} from ${pluginInfo.manifest.name}`);
  }

  /**
   * 注销插件的所有算法
   * 返回被注销的算法 ID 列表，方便调用方处理状态迁移
   */
  unregisterPluginAlgorithms(pluginId: string): { reviewIds: string[]; diffIds: string[] } {
    const unregisteredReview: string[] = [];
    const unregisteredDiff: string[] = [];

    // 移除该插件的复习算法
    for (const [id, entry] of this.reviewAlgorithms) {
      if (entry.info.pluginId === pluginId && !entry.info.isBuiltin) {
        this.reviewAlgorithms.delete(id);
        unregisteredReview.push(id);
        this.emit(ALGORITHM_EVENTS.ALGORITHM_UNREGISTERED, { type: 'review', id });
        console.log(`[AlgorithmRegistry] Unregistered review algorithm: ${id}`);
        
        // 如果当前使用的是这个算法，切换回默认
        if (this.currentReviewAlgorithmId === id) {
          this.currentReviewAlgorithmId = 'algo:review:builtin:sm2';
          this.emit(ALGORITHM_EVENTS.CURRENT_CHANGED, { type: 'review', id: this.currentReviewAlgorithmId });
        }
      }
    }

    // 移除该插件的 Diff 算法
    for (const [id, entry] of this.diffAlgorithms) {
      if (entry.info.pluginId === pluginId && !entry.info.isBuiltin) {
        this.diffAlgorithms.delete(id);
        unregisteredDiff.push(id);
        this.emit(ALGORITHM_EVENTS.ALGORITHM_UNREGISTERED, { type: 'diff', id });
        console.log(`[AlgorithmRegistry] Unregistered diff algorithm: ${id}`);
        
        // 如果当前使用的是这个算法，切换回默认
        if (this.currentDiffAlgorithmId === id) {
          this.currentDiffAlgorithmId = 'algo:diff:builtin:simple';
          this.emit(ALGORITHM_EVENTS.CURRENT_CHANGED, { type: 'diff', id: this.currentDiffAlgorithmId });
        }
      }
    }

    return { reviewIds: unregisteredReview, diffIds: unregisteredDiff };
  }

  /**
   * 获取所有可用的复习算法（统一接口）
   */
  getAvailableReviewAlgorithms(): RegisteredAlgorithm[] {
    // 先添加内置算法，再添加插件算法
    const builtinAlgos: RegisteredAlgorithm[] = [];
    const pluginAlgos: RegisteredAlgorithm[] = [];
    
    for (const entry of this.reviewAlgorithms.values()) {
      if (entry.info.isBuiltin) {
        builtinAlgos.push(entry.info);
      } else {
        pluginAlgos.push(entry.info);
      }
    }
    
    return [...builtinAlgos, ...pluginAlgos];
  }

  /**
   * 获取所有可用的 Diff 算法（统一接口）
   */
  getAvailableDiffAlgorithms(): RegisteredAlgorithm[] {
    const builtinAlgos: RegisteredAlgorithm[] = [];
    const pluginAlgos: RegisteredAlgorithm[] = [];
    
    for (const entry of this.diffAlgorithms.values()) {
      if (entry.info.isBuiltin) {
        builtinAlgos.push(entry.info);
      } else {
        pluginAlgos.push(entry.info);
      }
    }
    
    return [...builtinAlgos, ...pluginAlgos];
  }

  /**
   * 设置当前复习算法（只设置 ID，不直接驱动 ReviewService）
   * 外层通过事件或 getReviewAlgorithm() 获取并应用
   */
  setCurrentReviewAlgorithm(algorithmId: string): boolean {
    const entry = this.reviewAlgorithms.get(algorithmId);
    
    if (entry) {
      const oldId = this.currentReviewAlgorithmId;
      this.currentReviewAlgorithmId = algorithmId;
      this.emit(ALGORITHM_EVENTS.CURRENT_CHANGED, { type: 'review', oldId, newId: algorithmId });
      console.log(`[AlgorithmRegistry] Set review algorithm to: ${algorithmId}`);
      return true;
    }

    console.warn(`[AlgorithmRegistry] Review algorithm not found: ${algorithmId}`);
    return false;
  }

  /**
   * 设置当前 Diff 算法（只设置 ID，不直接驱动 ReviewService）
   */
  setCurrentDiffAlgorithm(algorithmId: string): boolean {
    const entry = this.diffAlgorithms.get(algorithmId);
    
    if (entry) {
      const oldId = this.currentDiffAlgorithmId;
      this.currentDiffAlgorithmId = algorithmId;
      this.emit(ALGORITHM_EVENTS.CURRENT_CHANGED, { type: 'diff', oldId, newId: algorithmId });
      console.log(`[AlgorithmRegistry] Set diff algorithm to: ${algorithmId}`);
      return true;
    }

    console.warn(`[AlgorithmRegistry] Diff algorithm not found: ${algorithmId}`);
    return false;
  }

  /**
   * 获取复习算法实例（用于外层应用）
   */
  getReviewAlgorithm(algorithmId: string): IReviewAlgorithm | undefined {
    return this.reviewAlgorithms.get(algorithmId)?.algorithm;
  }

  /**
   * 获取 Diff 算法实例（用于外层应用）
   */
  getDiffAlgorithm(algorithmId: string): IDiffAlgorithm | undefined {
    return this.diffAlgorithms.get(algorithmId)?.algorithm;
  }

  /**
   * 获取当前复习算法实例
   */
  getCurrentReviewAlgorithm(): IReviewAlgorithm | undefined {
    return this.getReviewAlgorithm(this.currentReviewAlgorithmId);
  }

  /**
   * 获取当前 Diff 算法实例
   */
  getCurrentDiffAlgorithm(): IDiffAlgorithm | undefined {
    return this.getDiffAlgorithm(this.currentDiffAlgorithmId);
  }

  /**
   * 获取当前复习算法 ID
   */
  getCurrentReviewAlgorithmId(): string {
    return this.currentReviewAlgorithmId;
  }

  /**
   * 获取当前 Diff 算法 ID
   */
  getCurrentDiffAlgorithmId(): string {
    return this.currentDiffAlgorithmId;
  }

  /**
   * 从配置恢复算法选择
   */
  restoreFromConfig(reviewAlgorithmId?: string, diffAlgorithmId?: string): void {
    if (reviewAlgorithmId) {
      this.setCurrentReviewAlgorithm(reviewAlgorithmId);
    }
    if (diffAlgorithmId) {
      this.setCurrentDiffAlgorithm(diffAlgorithmId);
    }
  }

  /**
   * 获取所有已注册算法的统计信息
   */
  getStats(): { reviewCount: number; diffCount: number; builtinCount: number; pluginCount: number } {
    let builtinCount = 0;
    let pluginCount = 0;
    
    for (const entry of this.reviewAlgorithms.values()) {
      if (entry.info.isBuiltin) builtinCount++;
      else pluginCount++;
    }
    for (const entry of this.diffAlgorithms.values()) {
      if (entry.info.isBuiltin) builtinCount++;
      else pluginCount++;
    }
    
    return {
      reviewCount: this.reviewAlgorithms.size,
      diffCount: this.diffAlgorithms.size,
      builtinCount,
      pluginCount,
    };
  }
}
