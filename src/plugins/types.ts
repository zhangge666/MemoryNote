/**
 * 插件系统类型定义
 */

// 插件页面配置
export interface PluginPageConfig {
  id: string; // 页面唯一标识
  title: string; // 页面标题
  icon?: string; // 页面图标
  route: string; // 路由路径
  component?: string; // 组件文件路径
  showInSidebar?: boolean; // 是否在侧边栏显示
  sidebarOrder?: number; // 侧边栏显示顺序
  permissions?: PluginPermission[]; // 页面所需权限
}

// 插件权限枚举
export enum PluginPermission {
  READ_FILES = 'read_files',
  WRITE_FILES = 'write_files',
  UI_MODIFY = 'ui_modify',
  SETTINGS_ACCESS = 'settings_access',
  COMMAND_REGISTER = 'command_register',
  THEME_MODIFY = 'theme_modify',
  SHORTCUT_REGISTER = 'shortcut_register',
  NETWORK_ACCESS = 'network_access'
}

// 插件状态
export enum PluginStatus {
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error',
  LOADING = 'loading'
}

// 插件类型
export enum PluginType {
  THEME = 'theme',
  COMMAND = 'command',
  UI = 'ui',
  EDITOR = 'editor',
  UTILITY = 'utility',
  PAGE = 'page' // 新增：页面类型插件
}

// 插件清单文件
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  main: string; // 主要入口文件
  permissions: PluginPermission[];
  dependencies?: string[];
  minAppVersion: string;
  icon?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  pages?: PluginPageConfig[]; // 插件页面配置
}

// 主题配置
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  variables: Record<string, string>;
  cssFile?: string;
  isDark?: boolean;
}

// 命令定义
export interface Command {
  id: string;
  name: string;
  description?: string;
  callback: () => void | Promise<void>;
  shortcut?: string;
  icon?: string;
  category?: string;
}

// 快捷键定义
export interface Shortcut {
  key: string; // 如 'Ctrl+P', 'Alt+Shift+F'
  commandId: string;
  description?: string;
}

// UI组件定义
export interface UIComponent {
  id: string;
  name: string;
  component: any; // Vue组件
  placement: 'sidebar' | 'toolbar' | 'statusbar' | 'modal' | 'panel';
  props?: Record<string, any>;
}

// 插件设置配置
export interface PluginSettingItem {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range';
  default: any;
  options?: Array<{ label: string; value: any }>;
  description?: string;
  placeholder?: string;
  min?: number; // 用于 number 和 range 类型
  max?: number; // 用于 number 和 range 类型
  step?: number; // 用于 range 类型
}

// 插件上下文API
export interface PluginAPI {
  // 应用信息
  app: {
    version: string;
    name: string;
  };
  
  // 工作区操作
  workspace: {
    getCurrentFile: () => Promise<any>;
    openFile: (path: string) => Promise<void>;
    createFile: (path: string, content: string) => Promise<void>;
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  };
  
  // 命令系统
  commands: {
    register: (command: Command) => void;
    execute: (commandId: string) => Promise<void>;
    unregister: (commandId: string) => void;
  };
  
  // 快捷键系统
  shortcuts: {
    register: (shortcut: Shortcut) => void;
    unregister: (key: string) => void;
  };
  
  // UI系统
  ui: {
    registerComponent: (component: UIComponent) => void;
    unregisterComponent: (componentId: string) => void;
    showModal: (title: string, content: any, options?: any) => Promise<any>;
  };
  
  // 主题系统
  themes: {
    register: (theme: ThemeConfig) => void;
    unregister: (themeId: string) => void;
    apply: (themeId: string) => void;
    getCurrent: () => string;
  };
  
  // 页面系统
  pages: {
    register: (page: PluginPageConfig, component: any) => void;
    unregister: (pageId: string) => void;
    navigate: (pageId: string) => void;
    getRegistered: () => PluginPageConfig[];
  };
  
  // 设置系统
  settings: {
    get: (key: string, defaultValue?: any) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    registerSection: (items: PluginSettingItem[]) => void;
  };
  
  // 事件系统
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, ...args: any[]) => void;
  };
}

// 插件基础接口
export interface Plugin {
  readonly manifest: PluginManifest;
  
  // 生命周期方法
  onLoad(api: PluginAPI): void | Promise<void>;
  onUnload(): void | Promise<void>;
  onEnable?(): void | Promise<void>;
  onDisable?(): void | Promise<void>;
  
  // 插件配置
  getSettings?(): PluginSettingItem[];
  onSettingChange?(key: string, value: any): void | Promise<void>;
}

// 插件实例信息
export interface PluginInstance {
  manifest: PluginManifest;
  plugin: Plugin;
  status: PluginStatus;
  error?: string;
  settings: Record<string, any>;
  loadedAt?: Date;
  enabledAt?: Date;
}

// 插件事件
export interface PluginEvent {
  type: 'loaded' | 'unloaded' | 'enabled' | 'disabled' | 'error' | 'reset';
  pluginId: string;
  payload?: any;
}

// 插件仓库信息
export interface PluginRepository {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  type: PluginType;
  downloadUrl: string;
  homepage?: string;
  screenshots?: string[];
  rating: number;
  downloads: number;
  lastUpdated: string;
  tags: string[];
  size: number;
  verified: boolean;
}


