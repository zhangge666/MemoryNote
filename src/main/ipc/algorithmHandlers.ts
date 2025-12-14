/**
 * 算法管理 IPC 处理器
 * 提供算法注册表的 IPC 接口
 */

import { ipcMain } from 'electron';
import { AlgorithmRegistry, ALGORITHM_EVENTS } from '../services/AlgorithmRegistry';
import { ConfigService } from '../services/ConfigService';
import { ReviewService } from '../services/ReviewService';

/**
 * 注册算法管理相关的 IPC 处理器
 */
export function registerAlgorithmHandlers(): void {
  const registry = AlgorithmRegistry.getInstance();
  const configService = ConfigService.getInstance();

  // 获取可用的复习算法列表
  ipcMain.handle('algorithm:get-review-algorithms', async () => {
    try {
      const algorithms = registry.getAvailableReviewAlgorithms();
      return { success: true, data: algorithms };
    } catch (error) {
      console.error('[AlgorithmHandlers] Failed to get review algorithms:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 获取可用的 Diff 算法列表
  ipcMain.handle('algorithm:get-diff-algorithms', async () => {
    try {
      const algorithms = registry.getAvailableDiffAlgorithms();
      return { success: true, data: algorithms };
    } catch (error) {
      console.error('[AlgorithmHandlers] Failed to get diff algorithms:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 获取当前复习算法
  ipcMain.handle('algorithm:get-current-review', async () => {
    try {
      const algorithmId = registry.getCurrentReviewAlgorithmId();
      return { success: true, data: algorithmId };
    } catch (error) {
      console.error('[AlgorithmHandlers] Failed to get current review algorithm:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 获取当前 Diff 算法
  ipcMain.handle('algorithm:get-current-diff', async () => {
    try {
      const algorithmId = registry.getCurrentDiffAlgorithmId();
      return { success: true, data: algorithmId };
    } catch (error) {
      console.error('[AlgorithmHandlers] Failed to get current diff algorithm:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 设置复习算法
  ipcMain.handle('algorithm:set-review', async (_event, algorithmId: string) => {
    try {
      const success = registry.setCurrentReviewAlgorithm(algorithmId);
      
      if (success) {
        // 应用到 ReviewService（职责分离：Registry 只记录 ID，Handler 负责应用）
        const algorithm = registry.getReviewAlgorithm(algorithmId);
        if (algorithm) {
          ReviewService.getInstance().setReviewAlgorithm(algorithm);
        }
        
        // 保存到配置
        const reviewConfig = configService.get('review') || {};
        reviewConfig.algorithmId = algorithmId;
        await configService.set('review', reviewConfig);
      }
      
      return { success, data: success };
    } catch (error) {
      console.error('[AlgorithmHandlers] Failed to set review algorithm:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 设置 Diff 算法
  ipcMain.handle('algorithm:set-diff', async (_event, algorithmId: string) => {
    try {
      const success = registry.setCurrentDiffAlgorithm(algorithmId);
      
      if (success) {
        // 应用到 ReviewService（职责分离：Registry 只记录 ID，Handler 负责应用）
        const algorithm = registry.getDiffAlgorithm(algorithmId);
        if (algorithm) {
          ReviewService.getInstance().setDiffAlgorithm(algorithm);
        }
        
        // 保存到配置
        const reviewConfig = configService.get('review') || {};
        reviewConfig.diffAlgorithmId = algorithmId;
        await configService.set('review', reviewConfig);
      }
      
      return { success, data: success };
    } catch (error) {
      console.error('[AlgorithmHandlers] Failed to set diff algorithm:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 监听算法变更事件（处理插件卸载时的自动切换）
  registry.on(ALGORITHM_EVENTS.CURRENT_CHANGED, ({ type, newId }: { type: string; oldId?: string; newId: string }) => {
    const reviewService = ReviewService.getInstance();
    if (type === 'review') {
      const algorithm = registry.getReviewAlgorithm(newId);
      if (algorithm) {
        reviewService.setReviewAlgorithm(algorithm);
      }
    } else if (type === 'diff') {
      const algorithm = registry.getDiffAlgorithm(newId);
      if (algorithm) {
        reviewService.setDiffAlgorithm(algorithm);
      }
    }
  });

  console.log('✅ Algorithm handlers registered');
}
