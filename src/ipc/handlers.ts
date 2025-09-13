import { ipcMain } from 'electron';
import { DatabaseManager, Note, ReviewRecord, Tag } from '../database/DatabaseManager';
import { SpacedRepetitionService } from '../services/SpacedRepetitionService';

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
}
