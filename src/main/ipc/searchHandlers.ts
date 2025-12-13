/**
 * 搜索相关 IPC 处理器
 * 阶段 10: 搜索系统
 */

import { ipcMain } from 'electron';
import { SearchService } from '../services/SearchService';
import { DatabaseManager } from '../database/DatabaseManager';
import { FileSystemService } from '../services/FileSystemService';
import type {
  SearchOptions,
  SearchResult,
  SearchHistoryItem,
} from '../../shared/types/search';

let searchService: SearchService;
let isRegistered = false;

/**
 * 更新服务实例（用于热切换工作区）
 */
export function updateSearchService(
  dbManager: DatabaseManager,
  fsService: FileSystemService
): void {
  SearchService.resetInstance();
  searchService = SearchService.getInstance(dbManager, fsService);
  console.log('✅ Search service updated');
}

/**
 * 注册搜索 IPC 处理器
 */
export function registerSearchHandlers(
  dbManager: DatabaseManager,
  fsService: FileSystemService
): void {
  // 初始化服务
  searchService = SearchService.getInstance(dbManager, fsService);

  // 如果已经注册过，直接返回
  if (isRegistered) {
    console.log('⚠️ Search handlers already registered, skipping...');
    return;
  }

  // 执行搜索
  ipcMain.handle(
    'search:query',
    async (
      _event,
      options: SearchOptions
    ): Promise<{ success: boolean; data?: SearchResult[]; error?: string }> => {
      try {
        const results = await searchService.search(options);
        return { success: true, data: results };
      } catch (error: any) {
        console.error('[SearchHandlers] Search failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 获取搜索历史
  ipcMain.handle(
    'search:get-history',
    async (
      _event,
      limit?: number
    ): Promise<{ success: boolean; data?: SearchHistoryItem[]; error?: string }> => {
      try {
        const history = await searchService.getSearchHistory(limit);
        return { success: true, data: history };
      } catch (error: any) {
        console.error('[SearchHandlers] Get history failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 清空搜索历史
  ipcMain.handle(
    'search:clear-history',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        await searchService.clearSearchHistory();
        return { success: true };
      } catch (error: any) {
        console.error('[SearchHandlers] Clear history failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 构建索引（为语义搜索预留）
  ipcMain.handle(
    'search:build-index',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        await searchService.buildIndex();
        return { success: true };
      } catch (error: any) {
        console.error('[SearchHandlers] Build index failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 更新单个笔记索引
  ipcMain.handle(
    'search:update-index',
    async (
      _event,
      noteId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await searchService.updateIndex(noteId);
        return { success: true };
      } catch (error: any) {
        console.error('[SearchHandlers] Update index failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  isRegistered = true;
  console.log('✅ Search IPC handlers registered');
}
