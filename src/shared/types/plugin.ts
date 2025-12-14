/**
 * 插件类型定义
 * 阶段 11: 插件系统
 */

import type { Command } from './command';

/**
 * 插件清单
 */
export interface PluginManifest {
  /** 插件唯一标识 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 作者 */
  author: string;
  /** 描述 */
  description: string;
  /** 入口文件 */
  main: string;
  /** 图标 */
  icon?: string;
  /** 兼容性 */
  engines: {
    memorynote: string;
  };
  /** 激活事件 */
  activationEvents?: string[];
  /** 贡献点 */
  contributes?: PluginContributes;
  /** 许可证 */
  license?: string;
  /** 仓库地址 */
  repository?: string;
  /** 关键词 */
  keywords?: string[];
}

/**
 * 插件贡献点
 */
export interface PluginContributes {
  /** 命令 */
  commands?: Command[];
  /** 快捷键 */
  keybindings?: PluginKeybinding[];
  /** 视图 */
  views?: PluginView[];
  /** 主题 */
  themes?: string[];
  /** 配置 */
  configuration?: PluginConfiguration;
  /** 复习算法 */
  reviewAlgorithms?: PluginAlgorithmContribution[];
  /** Diff 算法 */
  diffAlgorithms?: PluginAlgorithmContribution[];
}

/**
 * 插件算法贡献
 */
export interface PluginAlgorithmContribution {
  /** 算法唯一标识 */
  id: string;
  /** 算法名称 */
  name: string;
  /** 算法描述 */
  description?: string;
  /** 入口文件（相对于插件根目录） */
  main: string;
}

/**
 * 插件快捷键
 */
export interface PluginKeybinding {
  key: string;
  command: string;
  when?: string;
}

/**
 * 插件视图
 */
export interface PluginView {
  id: string;
  title: string;
  icon?: string;
  location: 'sidebar-left' | 'sidebar-right' | 'statusbar' | 'navbar';
}

/**
 * 插件配置项
 */
export interface PluginConfiguration {
  title: string;
  properties: Record<string, PluginConfigProperty>;
}

/**
 * 插件配置属性
 */
export interface PluginConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: any;
  description?: string;
  enum?: any[];
  enumDescriptions?: string[];
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 插件路径 */
  extensionPath: string;
  /** 全局存储 */
  globalState: IPluginStorage;
  /** 工作区存储 */
  workspaceState: IPluginStorage;
}

/**
 * 插件存储接口
 */
export interface IPluginStorage {
  get<T>(key: string): T | undefined;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): string[];
}

/**
 * 插件接口
 */
export interface IPlugin {
  /** 激活插件 */
  activate(context: PluginContext): void | Promise<void>;
  /** 停用插件 */
  deactivate?(): void | Promise<void>;
}

/**
 * 插件状态枚举
 */
export type PluginStatus = 'scanned' | 'loading' | 'loaded' | 'error' | 'disabled';

/**
 * 插件信息（运行时）
 */
export interface PluginInfo {
  /** 插件清单 */
  manifest: PluginManifest;
  /** 插件状态 */
  status: PluginStatus;
  /** 是否启用 */
  enabled: boolean;
  /** 插件路径 */
  path: string;
  /** 安装时间 */
  installedAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 错误信息 */
  error?: string;
  /** 已加载的算法 ID 列表 */
  loadedAlgorithms?: string[];
}

// 为了兼容性，保留 loaded 属性的计算方法
export function isPluginLoaded(plugin: PluginInfo): boolean {
  return plugin.status === 'loaded';
}

/**
 * 插件安装选项
 */
export interface PluginInstallOptions {
  /** ZIP 文件路径 */
  zipPath: string;
  /** 是否覆盖已存在的插件 */
  overwrite?: boolean;
}

/**
 * 插件过滤器
 */
export interface PluginFilter {
  /** 是否启用 */
  enabled?: boolean;
  /** 是否已加载 */
  loaded?: boolean;
  /** 关键词搜索 */
  keyword?: string;
}
