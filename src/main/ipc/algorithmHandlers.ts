/**
 * 算法管理 IPC 处理器
 * 提供算法注册表的 IPC 接口
 */

import { ipcMain } from 'electron';
import { AlgorithmRegistry } from '../services/AlgorithmRegistry';
import { ConfigService } from '../services/ConfigService';

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

  console.log('✅ Algorithm handlers registered');
}
