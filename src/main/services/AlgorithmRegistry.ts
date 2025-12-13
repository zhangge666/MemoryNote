/**
 * 算法注册表服务
 * 管理插件提供的复习算法和 Diff 算法
 */

import { ReviewService } from './ReviewService';
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
}

/**
 * 算法注册表
 */
export class AlgorithmRegistry {
  private static instance: AlgorithmRegistry;
  
  // 内置算法
  private builtinReviewAlgorithms: Map<string, IReviewAlgorithm> = new Map();
  private builtinDiffAlgorithms: Map<string, IDiffAlgorithm> = new Map();
  
  // 插件算法
  private pluginReviewAlgorithms: Map<string, { algorithm: IReviewAlgorithm; info: RegisteredAlgorithm }> = new Map();
  private pluginDiffAlgorithms: Map<string, { algorithm: IDiffAlgorithm; info: RegisteredAlgorithm }> = new Map();
  
  // 当前选中的算法
  private currentReviewAlgorithmId: string = 'builtin:sm2';
  private currentDiffAlgorithmId: string = 'builtin:simple';

  private constructor() {
    this.registerBuiltinAlgorithms();
  }

  static getInstance(): AlgorithmRegistry {
    if (!AlgorithmRegistry.instance) {
      AlgorithmRegistry.instance = new AlgorithmRegistry();
    }
    return AlgorithmRegistry.instance;
  }

  /**
   * 注册内置算法
   */
  private registerBuiltinAlgorithms(): void {
    // 内置 SM-2 复习算法
    this.builtinReviewAlgorithms.set('builtin:sm2', {
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
    });

    // 内置 Anki 算法（简化版）
    this.builtinReviewAlgorithms.set('builtin:anki', {
      name: 'Anki',
      calculate: (card: ReviewCard, result: ReviewResult) => {
        const { quality } = result;
        let { easeFactor, repetitions, interval } = card;

        // Anki 风格的间隔计算
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

        // Anki 风格的 ease factor 调整
        if (quality === 5) {
          easeFactor += 0.15;
        } else if (quality === 4) {
          // 保持不变
        } else if (quality === 3) {
          easeFactor -= 0.15;
        } else {
          easeFactor -= 0.20;
        }
        easeFactor = Math.max(1.3, easeFactor);

        const difficulty = Math.max(0, Math.min(1, 1 - (easeFactor - 1.3) / 1.2));
        const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

        return { interval, difficulty, easeFactor, repetitions, nextReview };
      },
    });

    // 内置简单 Diff 算法
    this.builtinDiffAlgorithms.set('builtin:simple', {
      name: 'SimpleDiff',
      diff: (oldText: string, newText: string): DiffChange[] => {
        const changes: DiffChange[] = [];
        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');

        // 找出删除的行
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

        // 找出新增的行
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
    });

    console.log('[AlgorithmRegistry] Registered builtin algorithms');
  }

  /**
   * 从插件注册复习算法
   */
  registerReviewAlgorithmFromPlugin(
    pluginInfo: PluginInfo,
    contribution: PluginAlgorithmContribution,
    algorithm: IReviewAlgorithm
  ): void {
    const algorithmId = `plugin:${pluginInfo.manifest.id}:${contribution.id}`;
    
    this.pluginReviewAlgorithms.set(algorithmId, {
      algorithm,
      info: {
        id: algorithmId,
        name: contribution.name,
        description: contribution.description,
        pluginId: pluginInfo.manifest.id,
        pluginName: pluginInfo.manifest.name,
        type: 'review',
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
    const algorithmId = `plugin:${pluginInfo.manifest.id}:${contribution.id}`;
    
    this.pluginDiffAlgorithms.set(algorithmId, {
      algorithm,
      info: {
        id: algorithmId,
        name: contribution.name,
        description: contribution.description,
        pluginId: pluginInfo.manifest.id,
        pluginName: pluginInfo.manifest.name,
        type: 'diff',
      },
    });

    console.log(`[AlgorithmRegistry] Registered diff algorithm: ${contribution.name} from ${pluginInfo.manifest.name}`);
  }

  /**
   * 注销插件的所有算法
   */
  unregisterPluginAlgorithms(pluginId: string): void {
    // 移除该插件的复习算法
    for (const [id, entry] of this.pluginReviewAlgorithms) {
      if (entry.info.pluginId === pluginId) {
        this.pluginReviewAlgorithms.delete(id);
        console.log(`[AlgorithmRegistry] Unregistered review algorithm: ${id}`);
        
        // 如果当前使用的是这个算法，切换回默认
        if (this.currentReviewAlgorithmId === id) {
          this.setCurrentReviewAlgorithm('builtin:sm2');
        }
      }
    }

    // 移除该插件的 Diff 算法
    for (const [id, entry] of this.pluginDiffAlgorithms) {
      if (entry.info.pluginId === pluginId) {
        this.pluginDiffAlgorithms.delete(id);
        console.log(`[AlgorithmRegistry] Unregistered diff algorithm: ${id}`);
        
        // 如果当前使用的是这个算法，切换回默认
        if (this.currentDiffAlgorithmId === id) {
          this.setCurrentDiffAlgorithm('builtin:simple');
        }
      }
    }
  }

  /**
   * 获取所有可用的复习算法
   */
  getAvailableReviewAlgorithms(): RegisteredAlgorithm[] {
    const algorithms: RegisteredAlgorithm[] = [];

    // 内置算法
    algorithms.push({
      id: 'builtin:sm2',
      name: 'SM-2',
      description: 'SuperMemo 2 算法，经典的间隔重复算法',
      pluginId: 'builtin',
      pluginName: 'MemoryNote',
      type: 'review',
    });

    algorithms.push({
      id: 'builtin:anki',
      name: 'Anki',
      description: 'Anki 风格的间隔重复算法',
      pluginId: 'builtin',
      pluginName: 'MemoryNote',
      type: 'review',
    });

    // 插件算法
    for (const entry of this.pluginReviewAlgorithms.values()) {
      algorithms.push(entry.info);
    }

    return algorithms;
  }

  /**
   * 获取所有可用的 Diff 算法
   */
  getAvailableDiffAlgorithms(): RegisteredAlgorithm[] {
    const algorithms: RegisteredAlgorithm[] = [];

    // 内置算法
    algorithms.push({
      id: 'builtin:simple',
      name: 'SimpleDiff',
      description: '基于行的简单比较算法',
      pluginId: 'builtin',
      pluginName: 'MemoryNote',
      type: 'diff',
    });

    // 插件算法
    for (const entry of this.pluginDiffAlgorithms.values()) {
      algorithms.push(entry.info);
    }

    return algorithms;
  }

  /**
   * 设置当前复习算法
   */
  setCurrentReviewAlgorithm(algorithmId: string): boolean {
    // 检查是否是内置算法
    if (this.builtinReviewAlgorithms.has(algorithmId)) {
      this.currentReviewAlgorithmId = algorithmId;
      const algorithm = this.builtinReviewAlgorithms.get(algorithmId)!;
      ReviewService.getInstance().setReviewAlgorithm(algorithm);
      console.log(`[AlgorithmRegistry] Set review algorithm to: ${algorithmId}`);
      return true;
    }

    // 检查是否是插件算法
    if (this.pluginReviewAlgorithms.has(algorithmId)) {
      this.currentReviewAlgorithmId = algorithmId;
      const algorithm = this.pluginReviewAlgorithms.get(algorithmId)!.algorithm;
      ReviewService.getInstance().setReviewAlgorithm(algorithm);
      console.log(`[AlgorithmRegistry] Set review algorithm to: ${algorithmId}`);
      return true;
    }

    console.warn(`[AlgorithmRegistry] Review algorithm not found: ${algorithmId}`);
    return false;
  }

  /**
   * 设置当前 Diff 算法
   */
  setCurrentDiffAlgorithm(algorithmId: string): boolean {
    // 检查是否是内置算法
    if (this.builtinDiffAlgorithms.has(algorithmId)) {
      this.currentDiffAlgorithmId = algorithmId;
      const algorithm = this.builtinDiffAlgorithms.get(algorithmId)!;
      ReviewService.getInstance().setDiffAlgorithm(algorithm);
      console.log(`[AlgorithmRegistry] Set diff algorithm to: ${algorithmId}`);
      return true;
    }

    // 检查是否是插件算法
    if (this.pluginDiffAlgorithms.has(algorithmId)) {
      this.currentDiffAlgorithmId = algorithmId;
      const algorithm = this.pluginDiffAlgorithms.get(algorithmId)!.algorithm;
      ReviewService.getInstance().setDiffAlgorithm(algorithm);
      console.log(`[AlgorithmRegistry] Set diff algorithm to: ${algorithmId}`);
      return true;
    }

    console.warn(`[AlgorithmRegistry] Diff algorithm not found: ${algorithmId}`);
    return false;
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
}
