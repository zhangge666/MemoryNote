/**
 * 插件相关 IPC 处理器
 * 阶段 11: 插件系统
 */

import { ipcMain, dialog } from 'electron';
import { PluginManager } from '../services/PluginManager';
import type {
  PluginInfo,
  PluginInstallOptions,
  PluginFilter,
} from '../../shared/types/plugin';

let pluginManager: PluginManager;
let isRegistered = false;

/**
 * 注册插件 IPC 处理器
 */
export function registerPluginHandlers(): void {
  // 初始化插件管理器
  pluginManager = PluginManager.getInstance();

  // 如果已经注册过，直接返回
  if (isRegistered) {
    console.log('⚠️ Plugin handlers already registered, skipping...');
    return;
  }

  // 初始化插件管理器
  ipcMain.handle(
    'plugin:initialize',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        await pluginManager.initialize();
        return { success: true };
      } catch (error: any) {
        console.error('[PluginHandlers] Initialize failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 获取所有插件
  ipcMain.handle(
    'plugin:get-all',
    async (
      _event,
      filter?: PluginFilter
    ): Promise<{ success: boolean; data?: PluginInfo[]; error?: string }> => {
      try {
        const plugins = pluginManager.getAllPlugins(filter);
        return { success: true, data: plugins };
      } catch (error: any) {
        console.error('[PluginHandlers] Get all plugins failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 获取单个插件
  ipcMain.handle(
    'plugin:get',
    async (
      _event,
      pluginId: string
    ): Promise<{ success: boolean; data?: PluginInfo | null; error?: string }> => {
      try {
        const plugin = pluginManager.getPlugin(pluginId);
        return { success: true, data: plugin || null };
      } catch (error: any) {
        console.error('[PluginHandlers] Get plugin failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 从 ZIP 安装插件
  ipcMain.handle(
    'plugin:install-from-zip',
    async (
      _event,
      options: PluginInstallOptions
    ): Promise<{ success: boolean; data?: PluginInfo; error?: string }> => {
      try {
        const plugin = await pluginManager.installFromZip(options);
        return { success: true, data: plugin };
      } catch (error: any) {
        console.error('[PluginHandlers] Install from ZIP failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 选择 ZIP 文件并安装
  ipcMain.handle(
    'plugin:select-and-install',
    async (): Promise<{ success: boolean; data?: PluginInfo; error?: string }> => {
      try {
        const result = await dialog.showOpenDialog({
          title: 'Select Plugin ZIP File',
          filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
          properties: ['openFile'],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, error: 'No file selected' };
        }

        const zipPath = result.filePaths[0];
        const plugin = await pluginManager.installFromZip({ zipPath, overwrite: true });
        return { success: true, data: plugin };
      } catch (error: any) {
        console.error('[PluginHandlers] Select and install failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 卸载插件
  ipcMain.handle(
    'plugin:uninstall',
    async (
      _event,
      pluginId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await pluginManager.uninstallPlugin(pluginId);
        return { success: true };
      } catch (error: any) {
        console.error('[PluginHandlers] Uninstall plugin failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 启用插件
  ipcMain.handle(
    'plugin:enable',
    async (
      _event,
      pluginId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await pluginManager.enablePlugin(pluginId);
        return { success: true };
      } catch (error: any) {
        console.error('[PluginHandlers] Enable plugin failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 禁用插件
  ipcMain.handle(
    'plugin:disable',
    async (
      _event,
      pluginId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await pluginManager.disablePlugin(pluginId);
        return { success: true };
      } catch (error: any) {
        console.error('[PluginHandlers] Disable plugin failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 获取插件目录
  ipcMain.handle(
    'plugin:get-directory',
    (): { success: boolean; data?: string; error?: string } => {
      try {
        const directory = pluginManager.getPluginsDirectory();
        return { success: true, data: directory };
      } catch (error: any) {
        console.error('[PluginHandlers] Get directory failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 刷新插件列表
  ipcMain.handle(
    'plugin:refresh',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        await pluginManager.scanPlugins();
        return { success: true };
      } catch (error: any) {
        console.error('[PluginHandlers] Refresh failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  isRegistered = true;
  console.log('✅ Plugin IPC handlers registered');
}

/**
 * 更新插件管理器（用于工作区切换）
 */
export function updatePluginManager(): void {
  pluginManager = PluginManager.getInstance();
  pluginManager.updatePluginsDir();
  console.log('✅ Plugin manager updated');
}
