/**
 * 插件状态管理
 * 阶段 11: 插件系统
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  PluginInfo,
  PluginFilter,
} from '../../shared/types/plugin';

export const usePluginStore = defineStore('plugin', () => {
  // 状态
  const plugins = ref<PluginInfo[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  // 计算属性
  const enabledPlugins = computed(() => plugins.value.filter(p => p.enabled));
  const disabledPlugins = computed(() => plugins.value.filter(p => !p.enabled));
  const pluginCount = computed(() => plugins.value.length);

  /**
   * 初始化插件管理器
   */
  async function initialize(): Promise<void> {
    if (isInitialized.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await window.ipc.plugin.initialize();
      if (response.success) {
        isInitialized.value = true;
        await loadPlugins();
      } else {
        error.value = response.error || 'Failed to initialize plugin manager';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to initialize plugin manager:', e);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载插件列表
   */
  async function loadPlugins(filter?: PluginFilter): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await window.ipc.plugin.getAll(filter);
      if (response.success && response.data) {
        plugins.value = response.data;
      } else {
        error.value = response.error || 'Failed to load plugins';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to load plugins:', e);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取单个插件
   */
  async function getPlugin(pluginId: string): Promise<PluginInfo | null> {
    try {
      const response = await window.ipc.plugin.get(pluginId);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to get plugin:', e);
      return null;
    }
  }

  /**
   * 从 ZIP 安装插件
   */
  async function installFromZip(zipPath: string, overwrite = false): Promise<PluginInfo | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await window.ipc.plugin.installFromZip({ zipPath, overwrite });
      if (response.success && response.data) {
        // 刷新列表
        await loadPlugins();
        return response.data;
      } else {
        error.value = response.error || 'Failed to install plugin';
        return null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to install plugin:', e);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 选择并安装插件
   */
  async function selectAndInstall(): Promise<PluginInfo | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await window.ipc.plugin.selectAndInstall();
      if (response.success && response.data) {
        // 刷新列表
        await loadPlugins();
        return response.data;
      } else {
        // 用户取消不算错误
        if (response.error !== 'No file selected') {
          error.value = response.error || 'Failed to install plugin';
        }
        return null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to install plugin:', e);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 卸载插件
   */
  async function uninstallPlugin(pluginId: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await window.ipc.plugin.uninstall(pluginId);
      if (response.success) {
        // 刷新列表
        await loadPlugins();
        return true;
      } else {
        error.value = response.error || 'Failed to uninstall plugin';
        return false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to uninstall plugin:', e);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 启用插件
   */
  async function enablePlugin(pluginId: string): Promise<boolean> {
    try {
      const response = await window.ipc.plugin.enable(pluginId);
      if (response.success) {
        // 更新本地状态
        const plugin = plugins.value.find(p => p.manifest.id === pluginId);
        if (plugin) {
          plugin.enabled = true;
        }
        return true;
      } else {
        error.value = response.error || 'Failed to enable plugin';
        return false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to enable plugin:', e);
      return false;
    }
  }

  /**
   * 禁用插件
   */
  async function disablePlugin(pluginId: string): Promise<boolean> {
    try {
      const response = await window.ipc.plugin.disable(pluginId);
      if (response.success) {
        // 更新本地状态
        const plugin = plugins.value.find(p => p.manifest.id === pluginId);
        if (plugin) {
          plugin.enabled = false;
        }
        return true;
      } else {
        error.value = response.error || 'Failed to disable plugin';
        return false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Failed to disable plugin:', e);
      return false;
    }
  }

  /**
   * 刷新插件列表
   */
  async function refresh(): Promise<void> {
    try {
      await window.ipc.plugin.refresh();
      await loadPlugins();
    } catch (e) {
      console.error('Failed to refresh plugins:', e);
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    plugins.value = [];
    isLoading.value = false;
    error.value = null;
    isInitialized.value = false;
  }

  return {
    // 状态
    plugins,
    isLoading,
    error,
    isInitialized,

    // 计算属性
    enabledPlugins,
    disabledPlugins,
    pluginCount,

    // 方法
    initialize,
    loadPlugins,
    getPlugin,
    installFromZip,
    selectAndInstall,
    uninstallPlugin,
    enablePlugin,
    disablePlugin,
    refresh,
    reset,
  };
});
