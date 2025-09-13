import { contextBridge, ipcRenderer } from 'electron';
import { Note, ReviewRecord, Tag } from './database/DatabaseManager';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
  },

  // 笔记相关API
  notes: {
    create: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => 
      ipcRenderer.invoke('notes:create', note),
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    getById: (id: number) => ipcRenderer.invoke('notes:getById', id),
    update: (id: number, updates: Partial<Note>) => 
      ipcRenderer.invoke('notes:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
  },

  // 标签相关API
  tags: {
    create: (tag: Omit<Tag, 'id' | 'created_at'>) => 
      ipcRenderer.invoke('tags:create', tag),
    getAll: () => ipcRenderer.invoke('tags:getAll'),
  },

  // 复习相关API
  reviews: {
    getDue: () => ipcRenderer.invoke('reviews:getDue'),
    submit: (noteId: number, quality: number) => 
      ipcRenderer.invoke('reviews:submit', noteId, quality),
    getByNoteId: (noteId: number) => 
      ipcRenderer.invoke('reviews:getByNoteId', noteId),
  },

  // 设置相关API
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => 
      ipcRenderer.invoke('settings:set', key, value),
  },

  // 文件系统API
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => 
      ipcRenderer.invoke('fs:writeFile', filePath, content),
    showOpenDialog: () => ipcRenderer.invoke('fs:showOpenDialog'),
    showSaveDialog: (defaultPath?: string) => 
      ipcRenderer.invoke('fs:showSaveDialog', defaultPath),
  },
});

// 类型定义，供渲染进程使用
export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  notes: {
    create: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<Note>;
    getAll: () => Promise<Note[]>;
    getById: (id: number) => Promise<Note | null>;
    update: (id: number, updates: Partial<Note>) => Promise<Note | null>;
    delete: (id: number) => Promise<boolean>;
    search: (query: string) => Promise<Note[]>;
  };
  tags: {
    create: (tag: Omit<Tag, 'id' | 'created_at'>) => Promise<Tag>;
    getAll: () => Promise<Tag[]>;
  };
  reviews: {
    getDue: () => Promise<ReviewRecord[]>;
    submit: (noteId: number, quality: number) => Promise<ReviewRecord>;
    getByNoteId: (noteId: number) => Promise<ReviewRecord[]>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
  };
  fs: {
    readFile: (filePath: string) => Promise<string>;
    writeFile: (filePath: string, content: string) => Promise<boolean>;
    showOpenDialog: () => Promise<any>;
    showSaveDialog: (defaultPath?: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
