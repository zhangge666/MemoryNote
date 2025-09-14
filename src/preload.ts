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
    createFolder: (title: string, parentId?: number) => 
      ipcRenderer.invoke('notes:createFolder', title, parentId),
    getTree: () => ipcRenderer.invoke('notes:getTree'),
    getByParentId: (parentId?: number) => 
      ipcRenderer.invoke('notes:getByParentId', parentId),
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
    getWarehouseDir: () => ipcRenderer.invoke('fs:getWarehouseDir'),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    createDir: (dirPath: string) => ipcRenderer.invoke('fs:createDir', dirPath),
    delete: (itemPath: string) => ipcRenderer.invoke('fs:delete', itemPath),
    rename: (oldPath: string, newPath: string) => 
      ipcRenderer.invoke('fs:rename', oldPath, newPath),
    exists: (itemPath: string) => ipcRenderer.invoke('fs:exists', itemPath),
    showOpenDirectoryDialog: () => ipcRenderer.invoke('fs:showOpenDirectoryDialog'),
    getAttachmentsDir: () => ipcRenderer.invoke('fs:getAttachmentsDir'),
    saveImage: (imageData: string, fileName: string) => ipcRenderer.invoke('fs:saveImage', imageData, fileName),
  },

  // 插件系统API
  plugins: {
    getPluginsDir: () => ipcRenderer.invoke('plugins:getPluginsDir'),
    scanDirectory: () => ipcRenderer.invoke('plugins:scanDirectory'),
    readFile: (pluginId: string, filePath: string) => 
      ipcRenderer.invoke('plugins:readFile', pluginId, filePath),
    writeFile: (pluginId: string, filePath: string, content: string) => 
      ipcRenderer.invoke('plugins:writeFile', pluginId, filePath, content),
    installFromZip: (zipPath: string) => 
      ipcRenderer.invoke('plugins:installFromZip', zipPath),
    uninstall: (pluginId: string) => 
      ipcRenderer.invoke('plugins:uninstall', pluginId),
    getSettings: (pluginId: string) => 
      ipcRenderer.invoke('plugins:getSettings', pluginId),
    saveSettings: (pluginId: string, settings: any) => 
      ipcRenderer.invoke('plugins:saveSettings', pluginId, settings),
    executeCommand: (pluginId: string, command: string, args: string[]) => 
      ipcRenderer.invoke('plugins:executeCommand', pluginId, command, args),
    showNotification: (title: string, body: string, options?: any) => 
      ipcRenderer.invoke('plugins:showNotification', title, body, options),
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
    createFolder: (title: string, parentId?: number) => Promise<Note>;
    getTree: () => Promise<Note[]>;
    getByParentId: (parentId?: number) => Promise<Note[]>;
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
    getWarehouseDir: () => Promise<string>;
    readDir: (dirPath: string) => Promise<any[]>;
    createDir: (dirPath: string) => Promise<boolean>;
    delete: (itemPath: string) => Promise<boolean>;
    rename: (oldPath: string, newPath: string) => Promise<boolean>;
    exists: (itemPath: string) => Promise<boolean>;
    showOpenDirectoryDialog: () => Promise<any>;
    getAttachmentsDir: () => Promise<string>;
    saveImage: (imageData: string, fileName: string) => Promise<string>;
  };
  plugins: {
    getPluginsDir: () => Promise<string>;
    scanDirectory: () => Promise<Array<{ path: string; manifest: any }>>;
    readFile: (pluginId: string, filePath: string) => Promise<string>;
    writeFile: (pluginId: string, filePath: string, content: string) => Promise<boolean>;
    installFromZip: (zipPath: string) => Promise<{ success: boolean; message: string }>;
    uninstall: (pluginId: string) => Promise<boolean>;
    getSettings: (pluginId: string) => Promise<any>;
    saveSettings: (pluginId: string, settings: any) => Promise<boolean>;
    executeCommand: (pluginId: string, command: string, args: string[]) => Promise<any>;
    showNotification: (title: string, body: string, options?: any) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
