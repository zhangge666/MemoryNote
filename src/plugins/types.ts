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
  mountLocation?: MountLocation; // 挂载位置
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

// 挂载位置枚举
export enum MountLocation {
  LEFT_SIDEBAR = 'left_sidebar',      // 左侧文件列表区域
  MAIN_AREA = 'main_area',            // 主工作区
  RIGHT_SIDEBAR = 'right_sidebar'     // 右侧栏
}

// 插件类型
export enum PluginType {
  THEME = 'theme',                    // 主题插件
  COMMAND = 'command',                // 命令插件
  UI = 'ui',                         // UI增强插件
  EDITOR = 'editor',                 // 编辑器插件
  UTILITY = 'utility',               // 实用工具插件
  PAGE = 'page',                     // 页面类型插件
  MARKDOWN_RENDERER = 'markdown_renderer',  // Markdown渲染插件
  WORKSPACE_ENHANCEMENT = 'workspace_enhancement', // 工作区增强插件
  FILE_MANAGER = 'file_manager',     // 文件管理工具
  BACKUP_TOOL = 'backup_tool',       // 备份工具插件
  IMPORT_EXPORT = 'import_export',   // 导入导出工具
  CODE_HIGHLIGHTER = 'code_highlighter', // 代码高亮插件
  TASK_MANAGER = 'task_manager',     // 任务管理插件
  NOTE_TEMPLATES = 'note_templates'   // 笔记模板插件
}

// 插件清单文件
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  detailed_description?: string;  // 详细描述
  author: string;
  type: PluginType;
  main: string; // 主要入口文件
  permissions: PluginPermission[];
  dependencies?: string[];
  minAppVersion?: string;
  icon?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  screenshots?: string[];        // 截图
  changelog?: string;            // 更新日志
  pages?: PluginPageConfig[];    // 插件页面配置
  sidebar_icon?: {               // 侧边栏图标配置
    show: boolean;
    icon?: string;
    position?: number;
    action?: 'default' | 'toggle_sidebar' | 'command' | 'page_navigation'; // 点击行为
  };
  mount_preferences?: {          // 挂载偏好设置
    default_location: MountLocation;
    allowed_locations: MountLocation[];
    auto_mount?: boolean;        // 是否自动挂载
  };
  engines?: {                    // 引擎版本要求
    memorynote?: string;         // 如: ">=1.0.0"
    node?: string;
    [key: string]: string | undefined;
  };
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
    getActiveEditor: () => any;
    insertText: (text: string) => void;
    getSelectedText: () => string;
    replaceSelectedText: (text: string) => void;
    getCursorPosition: () => { line: number; column: number };
    setCursorPosition: (line: number, column: number) => void;
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
  
  // 侧边栏按钮系统
  sidebar: {
    registerButton: (button: Omit<SidebarButton, 'id' | 'pluginId'>) => string;
    unregisterButton: () => void;
    updateButton: (updates: Partial<Omit<SidebarButton, 'id' | 'pluginId'>>) => void;
  };
  
  // 设置系统
  settings: {
    get: (key: string, defaultValue?: any) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    registerSection: (items: PluginSettingItem[]) => void;
  };
  
  // 编辑器增强
  editor: {
    registerRenderer: (type: string, renderer: Function) => void;
    registerStyle: (name: string, cssRules: string) => void;
    addToolbarButton: (button: any) => void;
    registerCodeHighlighter: (language: string, highlighter: Function) => void;
  };

  // 文件系统操作
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<boolean>;
    listDirectory: (path: string) => Promise<any[]>;
    copyFile: (src: string, dest: string) => Promise<boolean>;
    deleteFile: (path: string) => Promise<boolean>;
    createDirectory: (path: string) => Promise<boolean>;
    exists: (path: string) => Promise<boolean>;
  };

  // 挂载系统
  mount: {
    registerComponent: (location: MountLocation, component: any) => void;
    unregisterComponent: (location: MountLocation, componentId: string) => void;
    unregisterAll: () => void;
    getComponentsAt: (location: MountLocation) => any[];
  };

  // 事件系统
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, ...args: any[]) => void;
  };

  // 存储系统已移除 - 插件使用 settings API 进行数据持久化
}

// 插件基础接口
export interface Plugin {
  readonly manifest: PluginManifest;
  
  // 生命周期方法
  onLoad(api: PluginAPI): void | Promise<void>;
  onUnload(): void | Promise<void>;
  onEnable?(): void | Promise<void>;
  onDisable?(): void | Promise<void>;
  
  // 插件配置（必需）
  getSettings(): PluginSettingItem[];
  onSettingChange(key: string, value: any): void | Promise<void>;
  
  // 获取插件设置页面标题（可选，默认使用插件名称）
  getSettingsTitle?(): string;
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
  api?: PluginAPI; // 插件启用时创建的API实例
  mountedComponents?: Map<MountLocation, any[]>; // 挂载的组件
  registeredStyles?: string[]; // 注册的样式ID列表
  registeredRenderers?: Map<string, Function>; // 注册的渲染器
  sidebarButton?: SidebarButton; // 注册的侧边栏按钮
}

// 侧边栏按钮接口
export interface SidebarButton {
  id: string;
  pluginId: string;
  title: string;
  tooltip?: string;
  icon?: string;
  position?: number;
  onClick: () => void;
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


