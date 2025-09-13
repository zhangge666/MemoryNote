import { ipcMain, app } from 'electron';
import { DatabaseManager, Note, ReviewRecord, Tag } from '../database/DatabaseManager';
import { SpacedRepetitionService } from '../services/SpacedRepetitionService';
import * as fs from 'fs/promises';
import * as path from 'path';

export function setupIpcHandlers(dbManager: DatabaseManager) {
  const srService = new SpacedRepetitionService(dbManager);

  // 笔记相关IPC处理器
  ipcMain.handle('notes:create', async (_, note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      return dbManager.createNote(note);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getAll', async () => {
    try {
      return dbManager.getAllNotes();
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getById', async (_, id: number) => {
    try {
      return dbManager.getNoteById(id);
    } catch (error) {
      console.error('Error getting note by id:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:update', async (_, id: number, updates: Partial<Note>) => {
    try {
      return dbManager.updateNote(id, updates);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:delete', async (_, id: number) => {
    try {
      return dbManager.deleteNote(id);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:search', async (_, query: string) => {
    try {
      return dbManager.searchNotes(query);
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:createFolder', async (_, title: string, parentId?: number) => {
    try {
      return dbManager.createFolder(title, parentId);
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getTree', async () => {
    try {
      return dbManager.getNotesTree();
    } catch (error) {
      console.error('Error getting notes tree:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getByParentId', async (_, parentId?: number) => {
    try {
      return dbManager.getItemsByParentId(parentId);
    } catch (error) {
      console.error('Error getting notes by parent id:', error);
      throw error;
    }
  });

  // 标签相关IPC处理器
  ipcMain.handle('tags:create', async (_, tag: Omit<Tag, 'id' | 'created_at'>) => {
    try {
      return dbManager.createTag(tag);
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  });

  ipcMain.handle('tags:getAll', async () => {
    try {
      return dbManager.getAllTags();
    } catch (error) {
      console.error('Error getting all tags:', error);
      throw error;
    }
  });

  // 复习相关IPC处理器
  ipcMain.handle('reviews:getDue', async () => {
    try {
      return dbManager.getDueReviews();
    } catch (error) {
      console.error('Error getting due reviews:', error);
      throw error;
    }
  });

  ipcMain.handle('reviews:submit', async (_, noteId: number, quality: number) => {
    try {
      return await srService.submitReview(noteId, quality);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  });

  ipcMain.handle('reviews:getByNoteId', async (_, noteId: number) => {
    try {
      return dbManager.getReviewRecordsByNoteId(noteId);
    } catch (error) {
      console.error('Error getting review records:', error);
      throw error;
    }
  });

  // 设置相关IPC处理器
  ipcMain.handle('settings:get', async (_, key: string) => {
    try {
      return dbManager.getSetting(key);
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    try {
      dbManager.setSetting(key, value);
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  });

  // 文件系统相关IPC处理器
  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      const fs = require('fs').promises;
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  ipcMain.handle('fs:showOpenDialog', async () => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Markdown Files', extensions: ['md', 'markdown'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('fs:showSaveDialog', async (_, defaultPath?: string) => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showSaveDialog({
        defaultPath,
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  });

  // 获取默认Warehouse目录
  ipcMain.handle('fs:getWarehouseDir', async () => {
    try {
      const appDataPath = app.getPath('userData');
      const warehouseDir = path.join(appDataPath, 'Warehouse');
      
      // 确保目录存在
      try {
        await fs.access(warehouseDir);
      } catch {
        await fs.mkdir(warehouseDir, { recursive: true });
      }
      
      return warehouseDir;
    } catch (error) {
      console.error('Error getting warehouse directory:', error);
      throw error;
    }
  });

  // 读取目录内容
  ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const result = [];
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const stats = await fs.stat(itemPath);
        
        result.push({
          name: item.name,
          path: itemPath,
          isDirectory: item.isDirectory(),
          isFile: item.isFile(),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
        });
      }
      
      return result.sort((a, b) => {
        // 目录优先，然后按名称排序
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  });

  // 创建目录
  ipcMain.handle('fs:createDir', async (_, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  });

  // 删除文件或目录
  ipcMain.handle('fs:delete', async (_, itemPath: string) => {
    try {
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        await fs.rmdir(itemPath, { recursive: true });
      } else {
        await fs.unlink(itemPath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  });

  // 重命名文件或目录
  ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  });

  // 检查路径是否存在
  ipcMain.handle('fs:exists', async (_, itemPath: string) => {
    try {
      await fs.access(itemPath);
      return true;
    } catch {
      return false;
    }
  });

  // 选择目录对话框
  ipcMain.handle('fs:showOpenDirectoryDialog', async () => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      return result;
    } catch (error) {
      console.error('Error showing open directory dialog:', error);
      throw error;
    }
  });
}
