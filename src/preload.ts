// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import type {
  Note,
  Folder,
  Tag,
  NoteFilter,
  CreateNoteOptions,
  UpdateNoteOptions,
  CreateFolderOptions,
  NoteStats,
} from './shared/types/note';
import type {
  ReviewCard,
  ReviewStats,
  ReviewResult,
  CreateReviewCardOptions,
  ReviewCardFilter,
  ReviewHistory,
  DailyReviewStats,
  CalendarDay,
} from './shared/types/review';
import type {
  SearchOptions,
  SearchResult,
  SearchHistoryItem,
} from './shared/types/search';
import type {
  PluginInfo,
  PluginInstallOptions,
  PluginFilter,
} from './shared/types/plugin';
import type { RegisteredAlgorithm } from './main/services/AlgorithmRegistry';

// 暴露基础 Electron API（用于窗口控制等）
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  once: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  },
  
  // 对话框 API
  dialog: {
    selectDirectory: (options?: { title?: string; defaultPath?: string }): Promise<string | null> =>
      ipcRenderer.invoke('dialog:select-directory', options),
    
    selectFile: (options?: { 
      title?: string; 
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }): Promise<string | null> =>
      ipcRenderer.invoke('dialog:select-file', options),
    
    saveFile: (options?: { 
      title?: string; 
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }): Promise<string | null> =>
      ipcRenderer.invoke('dialog:save-file', options),
    
    showMessage: (options: {
      type?: 'none' | 'info' | 'error' | 'question' | 'warning';
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
    }): Promise<number> =>
      ipcRenderer.invoke('dialog:show-message', options),
  },
});

// 暴露扩展 IPC API（用于笔记管理等特定功能）
contextBridge.exposeInMainWorld('ipc', {
  // 窗口控制
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  
  // 笔记操作
  note: {
    create: (options: CreateNoteOptions): Promise<Note> => 
      ipcRenderer.invoke('note:create', options),
    
    get: (id: string): Promise<Note | null> => 
      ipcRenderer.invoke('note:get', id),
    
    update: (options: UpdateNoteOptions): Promise<Note | null> => 
      ipcRenderer.invoke('note:update', options),
    
    delete: (id: string): Promise<boolean> => 
      ipcRenderer.invoke('note:delete', id),
    
    list: (filter?: NoteFilter): Promise<Note[]> => 
      ipcRenderer.invoke('note:list', filter || {}),
    
    search: (query: string): Promise<Note[]> => 
      ipcRenderer.invoke('note:search', query),
    
    stats: (): Promise<NoteStats> => 
      ipcRenderer.invoke('note:stats'),
    
    readContent: (filePath: string): Promise<string> => 
      ipcRenderer.invoke('note:read-content', filePath),
    
    writeContent: (filePath: string, content: string): Promise<void> => 
      ipcRenderer.invoke('note:write-content', filePath, content),
    
    getNotesDir: (): Promise<string> => 
      ipcRenderer.invoke('note:get-notes-dir'),
  },
  
  // 文件夹操作
  folder: {
    create: (options: CreateFolderOptions): Promise<Folder> => 
      ipcRenderer.invoke('folder:create', options),
    
    get: (id: string): Promise<Folder | null> => 
      ipcRenderer.invoke('folder:get', id),
    
    tree: (): Promise<Folder[]> => 
      ipcRenderer.invoke('folder:tree'),
    
    update: (id: string, options: { name?: string; parentId?: string }): Promise<Folder | null> =>
      ipcRenderer.invoke('folder:update', id, options),
    
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('folder:delete', id),
  },
  
  // 标签操作
  tag: {
    create: (name: string, color?: string): Promise<Tag> => 
      ipcRenderer.invoke('tag:create', name, color),
    
    list: (): Promise<Tag[]> => 
      ipcRenderer.invoke('tag:list'),
  },
  
  // 配置操作
  config: {
    get: (key: string): Promise<any> =>
      ipcRenderer.invoke('config:get', key),
    
    set: (key: string, value: any): Promise<boolean> =>
      ipcRenderer.invoke('config:set', key, value),
    
    getAll: (): Promise<any> =>
      ipcRenderer.invoke('config:get-all'),
    
    setAll: (config: Record<string, unknown>): Promise<boolean> =>
      ipcRenderer.invoke('config:set-all', config),
    
    reset: (key?: string): Promise<boolean> =>
      ipcRenderer.invoke('config:reset', key),
  },
  
  // 复习系统操作
  review: {
    // 从 diff 生成复习卡片
    generateFromDiff: (
      noteId: string,
      oldContent: string,
      newContent: string
    ): Promise<{ success: boolean; data?: ReviewCard[]; error?: string }> =>
      ipcRenderer.invoke('review:generate-from-diff', noteId, oldContent, newContent),
    
    // 创建复习卡片
    createCard: (
      options: CreateReviewCardOptions
    ): Promise<{ success: boolean; data?: ReviewCard; error?: string }> =>
      ipcRenderer.invoke('review:create-card', options),
    
    // 获取待复习卡片
    getDueCards: (
      limit?: number
    ): Promise<{ success: boolean; data?: ReviewCard[]; error?: string }> =>
      ipcRenderer.invoke('review:get-due-cards', limit),
    
    // 获取笔记的复习卡片
    getCardsByNote: (
      noteId: string
    ): Promise<{ success: boolean; data?: ReviewCard[]; error?: string }> =>
      ipcRenderer.invoke('review:get-cards-by-note', noteId),
    
    // 获取单个卡片
    getCard: (
      cardId: number
    ): Promise<{ success: boolean; data?: ReviewCard | null; error?: string }> =>
      ipcRenderer.invoke('review:get-card', cardId),
    
    // 获取卡片列表（带过滤）
    getCards: (
      filter?: ReviewCardFilter
    ): Promise<{ success: boolean; data?: ReviewCard[]; error?: string }> =>
      ipcRenderer.invoke('review:get-cards', filter),
    
    // 复习卡片
    reviewCard: (
      cardId: number,
      result: ReviewResult
    ): Promise<{ success: boolean; data?: ReviewCard; error?: string }> =>
      ipcRenderer.invoke('review:review-card', cardId, result),
    
    // 跳过卡片
    skipCard: (
      cardId: number
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('review:skip-card', cardId),
    
    // 删除卡片
    deleteCard: (
      cardId: number
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('review:delete-card', cardId),
    
    // 删除笔记的所有卡片
    deleteCardsByNote: (
      noteId: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('review:delete-cards-by-note', noteId),
    
    // 获取复习统计
    getStats: (): Promise<{ success: boolean; data?: ReviewStats; error?: string }> =>
      ipcRenderer.invoke('review:get-stats'),
    
    // 获取卡片的复习历史
    getHistory: (
      cardId: number,
      limit?: number
    ): Promise<{ success: boolean; data?: ReviewHistory[]; error?: string }> =>
      ipcRenderer.invoke('review:get-history', cardId, limit),
    
    // 获取每日复习统计
    getDailyStats: (
      days?: number
    ): Promise<{ success: boolean; data?: DailyReviewStats[]; error?: string }> =>
      ipcRenderer.invoke('review:get-daily-stats', days),
    
    // 获取日历数据
    getCalendar: (
      year: number,
      month: number
    ): Promise<{ success: boolean; data?: CalendarDay[]; error?: string }> =>
      ipcRenderer.invoke('review:get-calendar', year, month),
  },
  
  // 搜索操作
  search: {
    // 执行搜索
    query: (
      options: SearchOptions
    ): Promise<{ success: boolean; data?: SearchResult[]; error?: string }> =>
      ipcRenderer.invoke('search:query', options),
    
    // 获取搜索历史
    getHistory: (
      limit?: number
    ): Promise<{ success: boolean; data?: SearchHistoryItem[]; error?: string }> =>
      ipcRenderer.invoke('search:get-history', limit),
    
    // 清空搜索历史
    clearHistory: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('search:clear-history'),
    
    // 构建索引（为语义搜索预留）
    buildIndex: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('search:build-index'),
    
    // 更新单个笔记索引
    updateIndex: (
      noteId: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('search:update-index', noteId),
  },
  
  // 插件操作
  plugin: {
    // 初始化插件管理器
    initialize: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('plugin:initialize'),
    
    // 获取所有插件
    getAll: (
      filter?: PluginFilter
    ): Promise<{ success: boolean; data?: PluginInfo[]; error?: string }> =>
      ipcRenderer.invoke('plugin:get-all', filter),
    
    // 获取单个插件
    get: (
      pluginId: string
    ): Promise<{ success: boolean; data?: PluginInfo | null; error?: string }> =>
      ipcRenderer.invoke('plugin:get', pluginId),
    
    // 从 ZIP 安装插件
    installFromZip: (
      options: PluginInstallOptions
    ): Promise<{ success: boolean; data?: PluginInfo; error?: string }> =>
      ipcRenderer.invoke('plugin:install-from-zip', options),
    
    // 选择并安装插件
    selectAndInstall: (): Promise<{ success: boolean; data?: PluginInfo; error?: string }> =>
      ipcRenderer.invoke('plugin:select-and-install'),
    
    // 卸载插件
    uninstall: (
      pluginId: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('plugin:uninstall', pluginId),
    
    // 卸载所有插件
    uninstallAll: (): Promise<{ success: boolean; data?: { success: number; failed: number }; error?: string }> =>
      ipcRenderer.invoke('plugin:uninstall-all'),
    
    // 启用插件
    enable: (
      pluginId: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('plugin:enable', pluginId),
    
    // 禁用插件
    disable: (
      pluginId: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('plugin:disable', pluginId),
    
    // 获取插件目录
    getDirectory: (): Promise<{ success: boolean; data?: string; error?: string }> =>
      ipcRenderer.invoke('plugin:get-directory'),
    
    // 刷新插件列表
    refresh: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('plugin:refresh'),
  },
  
  // 算法管理
  algorithm: {
    // 获取可用的复习算法
    getReviewAlgorithms: (): Promise<{ success: boolean; data?: RegisteredAlgorithm[]; error?: string }> =>
      ipcRenderer.invoke('algorithm:get-review-algorithms'),
    
    // 获取可用的 Diff 算法
    getDiffAlgorithms: (): Promise<{ success: boolean; data?: RegisteredAlgorithm[]; error?: string }> =>
      ipcRenderer.invoke('algorithm:get-diff-algorithms'),
    
    // 获取当前复习算法
    getCurrentReview: (): Promise<{ success: boolean; data?: string; error?: string }> =>
      ipcRenderer.invoke('algorithm:get-current-review'),
    
    // 获取当前 Diff 算法
    getCurrentDiff: (): Promise<{ success: boolean; data?: string; error?: string }> =>
      ipcRenderer.invoke('algorithm:get-current-diff'),
    
    // 设置复习算法
    setReview: (
      algorithmId: string
    ): Promise<{ success: boolean; data?: boolean; error?: string }> =>
      ipcRenderer.invoke('algorithm:set-review', algorithmId),
    
    // 设置 Diff 算法
    setDiff: (
      algorithmId: string
    ): Promise<{ success: boolean; data?: boolean; error?: string }> =>
      ipcRenderer.invoke('algorithm:set-diff', algorithmId),
  },
});
