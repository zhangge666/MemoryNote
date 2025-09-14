import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import { PluginManager } from '../plugins/PluginManager';
import type { 
  PluginInstance, 
  PluginStatus, 
  PluginRepository,
  ThemeConfig,
  Command,
  UIComponent
} from '../plugins/types';

export const usePluginsStore = defineStore('plugins', () => {
  // 插件管理器实例
  const pluginManager = ref<PluginManager | null>(null);
  
  // 状态
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // 插件数据
  const installedPlugins = ref<Map<string, PluginInstance>>(new Map());
  const enabledPlugins = ref<Set<string>>(new Set());
  const availablePlugins = ref<PluginRepository[]>([]);
  
  // 插件资源
  const registeredThemes = ref<Map<string, ThemeConfig>>(new Map());
  const registeredCommands = ref<Map<string, Command>>(new Map());
  const registeredComponents = ref<Map<string, UIComponent>>(new Map());
  
  // 计算属性
  const allPlugins = computed(() => Array.from(installedPlugins.value.values()));
  
  const enabledPluginsList = computed(() => 
    allPlugins.value.filter(p => enabledPlugins.value.has(p.manifest.id))
  );
  
  const disabledPluginsList = computed(() => 
    allPlugins.value.filter(p => !enabledPlugins.value.has(p.manifest.id))
  );
  
  const themesList = computed(() => Array.from(registeredThemes.value.values()));
  
  const commandsList = computed(() => Array.from(registeredCommands.value.values()));
  
  const componentsList = computed(() => Array.from(registeredComponents.value.values()));
  
  const pluginStats = computed(() => ({
    total: installedPlugins.value.size,
    enabled: enabledPlugins.value.size,
    disabled: installedPlugins.value.size - enabledPlugins.value.size,
    themes: registeredThemes.value.size,
    commands: registeredCommands.value.size,
    components: registeredComponents.value.size
  }));

  // 方法
  async function initialize(): Promise<void> {
    if (isInitialized.value) return;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      // 创建插件管理器
      pluginManager.value = new PluginManager('1.0.0'); // 应用版本
      
      // 设置事件监听
      setupEventListeners();
      
      // 初始化插件管理器
      await pluginManager.value.initialize();
      
      // 同步状态
      syncStateFromManager();
      
      isInitialized.value = true;
      console.log('✅ 插件Store初始化完成');
    } catch (err) {
      console.error('❌ 插件Store初始化失败:', err);
      error.value = err instanceof Error ? err.message : '初始化失败';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadPlugin(pluginPath: string): Promise<boolean> {
    if (!pluginManager.value) {
      console.error('插件管理器未初始化');
      return false;
    }

    try {
      isLoading.value = true;
      const instance = await pluginManager.value.loadPluginFromManifest(pluginPath);
      
      if (instance) {
        installedPlugins.value.set(instance.manifest.id, instance);
        return true;
      }
      return false;
    } catch (err) {
      console.error('加载插件失败:', err);
      error.value = err instanceof Error ? err.message : '加载失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshPlugins(): Promise<void> {
    if (!pluginManager.value) {
      console.error('插件管理器未初始化');
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;
      
      // 刷新插件管理器
      await pluginManager.value.refreshPlugins();
      
      // 同步状态
      syncStateFromManager();
      
      console.log('✅ 插件列表刷新完成');
    } catch (err) {
      console.error('❌ 刷新插件失败:', err);
      error.value = err instanceof Error ? err.message : '刷新失败';
    } finally {
      isLoading.value = false;
    }
  }

  async function enablePlugin(pluginId: string): Promise<boolean> {
    if (!pluginManager.value) return false;

    try {
      const success = await pluginManager.value.enablePlugin(pluginId);
      if (success) {
        enabledPlugins.value.add(pluginId);
        syncResourcesFromManager();
      }
      return success;
    } catch (err) {
      console.error('启用插件失败:', err);
      error.value = err instanceof Error ? err.message : '启用失败';
      return false;
    }
  }

  async function disablePlugin(pluginId: string): Promise<boolean> {
    if (!pluginManager.value) return false;

    try {
      const success = await pluginManager.value.disablePlugin(pluginId);
      if (success) {
        enabledPlugins.value.delete(pluginId);
        syncResourcesFromManager();
      }
      return success;
    } catch (err) {
      console.error('禁用插件失败:', err);
      error.value = err instanceof Error ? err.message : '禁用失败';
      return false;
    }
  }

  async function unloadPlugin(pluginId: string): Promise<boolean> {
    if (!pluginManager.value) return false;

    try {
      const success = await pluginManager.value.unloadPlugin(pluginId);
      if (success) {
        installedPlugins.value.delete(pluginId);
        enabledPlugins.value.delete(pluginId);
        syncResourcesFromManager();
      }
      return success;
    } catch (err) {
      console.error('卸载插件失败:', err);
      error.value = err instanceof Error ? err.message : '卸载失败';
      return false;
    }
  }

  async function executeCommand(commandId: string): Promise<boolean> {
    if (!pluginManager.value) return false;
    return await pluginManager.value.executeCommand(commandId);
  }

  function applyTheme(themeId: string): void {
    if (!pluginManager.value) return;
    pluginManager.value.applyTheme(themeId);
  }

  function resetTheme(): void {
    if (!pluginManager.value) return;
    pluginManager.value.resetTheme();
  }

  function getPlugin(pluginId: string): PluginInstance | undefined {
    return installedPlugins.value.get(pluginId);
  }

  function getTheme(themeId: string): ThemeConfig | undefined {
    return registeredThemes.value.get(themeId);
  }

  function getCommand(commandId: string): Command | undefined {
    return registeredCommands.value.get(commandId);
  }

  function getComponent(componentId: string): UIComponent | undefined {
    return registeredComponents.value.get(componentId);
  }

  // 搜索和过滤
  function searchPlugins(query: string): PluginInstance[] {
    const lowerQuery = query.toLowerCase();
    return allPlugins.value.filter(plugin => 
      plugin.manifest.name.toLowerCase().includes(lowerQuery) ||
      plugin.manifest.description.toLowerCase().includes(lowerQuery) ||
      plugin.manifest.author.toLowerCase().includes(lowerQuery)
    );
  }

  function filterPluginsByType(type: string): PluginInstance[] {
    return allPlugins.value.filter(plugin => plugin.manifest.type === type);
  }

  function filterPluginsByStatus(status: PluginStatus): PluginInstance[] {
    return allPlugins.value.filter(plugin => plugin.status === status);
  }

  // 插件商店功能
  async function loadAvailablePlugins(): Promise<void> {
    try {
      // 这里应该从远程仓库或本地商店加载可用插件
      // 暂时返回示例数据
      availablePlugins.value = [
        {
          id: 'sample-theme',
          name: '示例主题包',
          description: '包含多个精美主题的插件包',
          author: 'MemoryNote Team',
          version: '1.0.0',
          type: 'theme' as any,
          downloadUrl: '',
          rating: 4.8,
          downloads: 1250,
          lastUpdated: '2024-01-15',
          tags: ['theme', 'ui', 'dark'],
          size: 125000,
          verified: true
        }
      ];
    } catch (err) {
      console.error('加载可用插件失败:', err);
    }
  }

  // 私有方法
  function setupEventListeners(): void {
    if (!pluginManager.value) return;
    
    pluginManager.value.on('plugin:loaded', () => {
      syncStateFromManager();
    });
    
    pluginManager.value.on('plugin:enabled', () => {
      syncStateFromManager();
      syncResourcesFromManager();
    });
    
    pluginManager.value.on('plugin:disabled', () => {
      syncStateFromManager();
      syncResourcesFromManager();
    });
    
    pluginManager.value.on('plugin:unloaded', () => {
      syncStateFromManager();
      syncResourcesFromManager();
    });
    
    pluginManager.value.on('plugin:error', (event: any) => {
      console.error('插件错误:', event);
      error.value = `插件 ${event.pluginId} 发生错误`;
    });
  }

  function syncStateFromManager(): void {
    if (!pluginManager.value) return;
    
    const allInstances = pluginManager.value.getAllPlugins();
    const enabledInstances = pluginManager.value.getEnabledPlugins();
    
    // 更新已安装插件
    installedPlugins.value.clear();
    allInstances.forEach(instance => {
      installedPlugins.value.set(instance.manifest.id, instance);
    });
    
    // 更新已启用插件
    enabledPlugins.value.clear();
    enabledInstances.forEach(instance => {
      enabledPlugins.value.add(instance.manifest.id);
    });
  }

  function syncResourcesFromManager(): void {
    if (!pluginManager.value) return;
    
    // 这里应该从pluginManager同步注册的资源
    // 由于PluginManager的私有属性，这里先留空
    // 在实际实现中需要在PluginManager中提供公共接口
  }

  // 清理函数
  function cleanup(): void {
    if (pluginManager.value) {
      // 清理所有插件
      pluginManager.value.getAllPlugins().forEach(plugin => {
        pluginManager.value!.unloadPlugin(plugin.manifest.id);
      });
    }
    
    installedPlugins.value.clear();
    enabledPlugins.value.clear();
    registeredThemes.value.clear();
    registeredCommands.value.clear();
    registeredComponents.value.clear();
    
    isInitialized.value = false;
  }

  return {
    // 状态
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 数据
    installedPlugins: readonly(installedPlugins),
    enabledPlugins: readonly(enabledPlugins),
    availablePlugins: readonly(availablePlugins),
    
    // 资源
    registeredThemes: readonly(registeredThemes),
    registeredCommands: readonly(registeredCommands),
    registeredComponents: readonly(registeredComponents),
    
    // 计算属性
    allPlugins,
    enabledPluginsList,
    disabledPluginsList,
    themesList,
    commandsList,
    componentsList,
    pluginStats,
    
    // 方法
    initialize,
    loadPlugin,
    refreshPlugins,
    enablePlugin,
    disablePlugin,
    unloadPlugin,
    executeCommand,
    applyTheme,
    resetTheme,
    getPlugin,
    getTheme,
    getCommand,
    getComponent,
    searchPlugins,
    filterPluginsByType,
    filterPluginsByStatus,
    loadAvailablePlugins,
    cleanup
  };
});

// 只读包装器
function readonly<T>(ref: any): any {
  return computed(() => ref.value);
}

