/**
 * 全局类型声明
 */

import type { IPCResponse } from './shared/interfaces/ipc';
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
import type {
  LLMConfig,
  ChatMessage,
  VectorSearchResult,
  VectorIndexStatus,
  AIAnswerResult,
  ContentCheckResult,
} from './shared/types/ai';

// 算法注册信息
export interface RegisteredAlgorithm {
  id: string;
  name: string;
  description?: string;
  pluginId: string;
  pluginName: string;
  type: 'review' | 'diff';
  isBuiltin: boolean;  // 新增：标识是否为内置算法
}

// Electron API 类型声明
export interface ElectronAPI {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<IPCResponse<T>>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
  
  // 对话框 API
  dialog: {
    selectDirectory: (options?: { title?: string; defaultPath?: string }) => Promise<string | null>;
    selectFile: (options?: { 
      title?: string; 
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => Promise<string | null>;
    saveFile: (options?: { 
      title?: string; 
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => Promise<string | null>;
    showMessage: (options: {
      type?: 'none' | 'info' | 'error' | 'question' | 'warning';
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
      defaultId?: number;
      cancelId?: number;
      checkboxLabel?: string;
      checkboxChecked?: boolean;
    }) => Promise<{ response: number; checkboxChecked: boolean }>;
  };
}

// IPC API 类型声明
export interface IPCAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  
  // 配置操作
  config: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    getAll: () => Promise<any>;
    setAll: (config: Record<string, unknown>) => Promise<boolean>;
    reset: (key?: string) => Promise<boolean>;
  };
  
  // 笔记操作
  note: {
    create: (options: CreateNoteOptions) => Promise<Note>;
    get: (id: string) => Promise<Note | null>;
    update: (options: UpdateNoteOptions) => Promise<Note | null>;
    delete: (id: string) => Promise<boolean>;
    list: (filter?: NoteFilter) => Promise<Note[]>;
    search: (query: string) => Promise<Note[]>;
    stats: () => Promise<NoteStats>;
    readContent: (filePath: string) => Promise<string>;
    writeContent: (filePath: string, content: string) => Promise<void>;
    getNotesDir: () => Promise<string>;
  };
  
  // 文件夹操作
  folder: {
    create: (options: CreateFolderOptions) => Promise<Folder>;
    get: (id: string) => Promise<Folder | null>;
    tree: () => Promise<Folder[]>;
    update: (id: string, options: { name?: string; parentId?: string }) => Promise<Folder | null>;
    delete: (id: string) => Promise<boolean>;
  };
  
  // 标签操作
  tag: {
    create: (name: string, color?: string) => Promise<Tag>;
    list: () => Promise<Tag[]>;
  };
  
  // 复习系统操作
  review: {
    generateFromDiff: (
      noteId: string,
      oldContent: string,
      newContent: string
    ) => Promise<{ success: boolean; data?: ReviewCard[]; error?: string }>;
    createCard: (
      options: CreateReviewCardOptions
    ) => Promise<{ success: boolean; data?: ReviewCard; error?: string }>;
    getDueCards: (
      limit?: number
    ) => Promise<{ success: boolean; data?: ReviewCard[]; error?: string }>;
    getCardsByNote: (
      noteId: string
    ) => Promise<{ success: boolean; data?: ReviewCard[]; error?: string }>;
    getCard: (
      cardId: number
    ) => Promise<{ success: boolean; data?: ReviewCard | null; error?: string }>;
    getCards: (
      filter?: ReviewCardFilter
    ) => Promise<{ success: boolean; data?: ReviewCard[]; error?: string }>;
    reviewCard: (
      cardId: number,
      result: ReviewResult
    ) => Promise<{ success: boolean; data?: ReviewCard; error?: string }>;
    skipCard: (
      cardId: number
    ) => Promise<{ success: boolean; error?: string }>;
    deleteCard: (
      cardId: number
    ) => Promise<{ success: boolean; error?: string }>;
    deleteCardsByNote: (
      noteId: string
    ) => Promise<{ success: boolean; error?: string }>;
    getStats: () => Promise<{ success: boolean; data?: ReviewStats; error?: string }>;
    getHistory: (
      cardId: number,
      limit?: number
    ) => Promise<{ success: boolean; data?: ReviewHistory[]; error?: string }>;
    getDailyStats: (
      days?: number
    ) => Promise<{ success: boolean; data?: DailyReviewStats[]; error?: string }>;
    getCalendar: (
      year: number,
      month: number
    ) => Promise<{ success: boolean; data?: CalendarDay[]; error?: string }>;
  };
  
  // 搜索操作
  search: {
    query: (
      options: SearchOptions
    ) => Promise<{ success: boolean; data?: SearchResult[]; error?: string }>;
    getHistory: (
      limit?: number
    ) => Promise<{ success: boolean; data?: SearchHistoryItem[]; error?: string }>;
    clearHistory: () => Promise<{ success: boolean; error?: string }>;
    buildIndex: () => Promise<{ success: boolean; error?: string }>;
    updateIndex: (
      noteId: string
    ) => Promise<{ success: boolean; error?: string }>;
  };
  
  // 插件操作
  plugin: {
    initialize: () => Promise<{ success: boolean; error?: string }>;
    getAll: (
      filter?: PluginFilter
    ) => Promise<{ success: boolean; data?: PluginInfo[]; error?: string }>;
    get: (
      pluginId: string
    ) => Promise<{ success: boolean; data?: PluginInfo | null; error?: string }>;
    installFromZip: (
      options: PluginInstallOptions
    ) => Promise<{ success: boolean; data?: PluginInfo; error?: string }>;
    selectAndInstall: () => Promise<{ success: boolean; data?: PluginInfo; error?: string }>;
    uninstall: (
      pluginId: string
    ) => Promise<{ success: boolean; error?: string }>;
    uninstallAll: () => Promise<{ success: boolean; data?: { success: number; failed: number }; error?: string }>;
    enable: (
      pluginId: string
    ) => Promise<{ success: boolean; error?: string }>;
    disable: (
      pluginId: string
    ) => Promise<{ success: boolean; error?: string }>;
    getDirectory: () => Promise<{ success: boolean; data?: string; error?: string }>;
    refresh: () => Promise<{ success: boolean; error?: string }>;
  };
  
  // 算法管理
  algorithm: {
    getReviewAlgorithms: () => Promise<{ success: boolean; data?: RegisteredAlgorithm[]; error?: string }>;
    getDiffAlgorithms: () => Promise<{ success: boolean; data?: RegisteredAlgorithm[]; error?: string }>;
    getCurrentReview: () => Promise<{ success: boolean; data?: string; error?: string }>;
    getCurrentDiff: () => Promise<{ success: boolean; data?: string; error?: string }>;
    setReview: (algorithmId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    setDiff: (algorithmId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
  };
  
  // AI 服务
  ai: {
    // NLP 相关
    semanticSearch: (
      query: string,
      limit?: number
    ) => Promise<{ success: boolean; data?: VectorSearchResult[]; error?: string }>;
    getIndexStatus: () => Promise<{ success: boolean; data?: VectorIndexStatus; error?: string }>;
    rebuildIndex: () => Promise<{ success: boolean; error?: string }>;
    addToIndex: (
      noteId: string,
      content: string
    ) => Promise<{ success: boolean; error?: string }>;
    removeFromIndex: (
      noteId: string
    ) => Promise<{ success: boolean; error?: string }>;
    
    // LLM 相关
    getLLMConfig: () => Promise<{ success: boolean; data?: LLMConfig; error?: string }>;
    setLLMConfig: (
      config: LLMConfig
    ) => Promise<{ success: boolean; error?: string }>;
    validateApiKey: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    chat: (
      messages: ChatMessage[],
      context?: string
    ) => Promise<{ success: boolean; data?: string; error?: string }>;
    askWithContext: (
      question: string,
      limit?: number
    ) => Promise<{ success: boolean; data?: AIAnswerResult; error?: string }>;
    checkContent: (
      content: string,
      knowledgeBase: string[]
    ) => Promise<{ success: boolean; data?: ContentCheckResult; error?: string }>;
    
    // 流式对话
    chatStreamStart: (
      messages: ChatMessage[],
      streamId: string
    ) => Promise<{ success: boolean; error?: string }>;
    chatStreamCancel: (
      streamId: string
    ) => Promise<{ success: boolean; error?: string }>;
    
    // 流式对话事件监听
    onStreamChunk: (callback: (streamId: string, chunk: string) => void) => void;
    onStreamEnd: (callback: (streamId: string) => void) => void;
    onStreamError: (callback: (streamId: string, error: string) => void) => void;
    offStreamChunk: (callback: (streamId: string, chunk: string) => void) => void;
    offStreamEnd: (callback: (streamId: string) => void) => void;
    offStreamError: (callback: (streamId: string, error: string) => void) => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ipc: IPCAPI;
  }
}

// Vite 环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
