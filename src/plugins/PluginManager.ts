import { ref, reactive } from 'vue';
import type { 
  Plugin, 
  PluginInstance, 
  PluginManifest, 
  PluginAPI,
  PluginEvent,
  Command,
  Shortcut,
  ThemeConfig,
  UIComponent,
  PluginPageConfig
} from './types';
import { PluginPermission, PluginType, PluginStatus } from './types';
import { EventEmitter } from './EventEmitter';

/**
 * 插件管理器 - 负责插件的加载、卸载、管理等核心功能
 */
export class PluginManager extends EventEmitter {
  private plugins = new Map<string, PluginInstance>();
  private commands = new Map<string, Command>();
  private shortcuts = new Map<string, Shortcut>();
  private themes = new Map<string, ThemeConfig>();
  private uiComponents = new Map<string, UIComponent>();
  private pluginPages = new Map<string, { config: PluginPageConfig, component: any }>();
  private pluginSettings = new Map<string, Record<string, any>>();
  private currentTheme: string = 'default';
  
  // 响应式状态
  public readonly state = reactive({
    loadedPlugins: new Map<string, PluginInstance>(),
    enabledPlugins: new Set<string>(),
    isLoading: false,
    error: null as string | null
  });

  constructor(private appVersion: string) {
    super();
    console.log('🔌 插件管理器初始化');
  }

  /**
   * 初始化插件系统
   */
  async initialize(): Promise<void> {
    try {
      this.state.isLoading = true;
      
      // 加载已安装的插件列表
      await this.loadInstalledPlugins();
      
      // 恢复上次启用的插件
      await this.loadEnabledPlugins();
      
      console.log(`✅ 插件系统初始化完成，已加载 ${this.plugins.size} 个插件`);
    } catch (error) {
      console.error('❌ 插件系统初始化失败:', error);
      this.state.error = error instanceof Error ? error.message : '初始化失败';
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * 从manifest文件加载插件
   */
  async loadPluginFromManifest(pluginPath: string): Promise<PluginInstance | null> {
    try {
      // 读取manifest文件
      const manifestPath = `${pluginPath}/manifest.json`;
      const manifestContent = await window.electronAPI.fs.readFile(manifestPath);
      const manifest: PluginManifest = JSON.parse(manifestContent);
      
      // 验证manifest
      this.validateManifest(manifest);
      
      // 检查版本兼容性
      if (!this.isVersionCompatible(manifest.minAppVersion)) {
        throw new Error(`插件 ${manifest.name} 需要应用版本 ${manifest.minAppVersion} 或更高`);
      }
      
      // 加载插件主文件
      const pluginModule = await this.loadPluginModule(pluginPath, manifest.main);
      const plugin: Plugin = new pluginModule.default();
      
      // 创建插件实例
      const instance: PluginInstance = {
        manifest,
        plugin,
        status: PluginStatus.INSTALLED,
        settings: await this.loadPluginSettings(manifest.id),
        loadedAt: new Date()
      };
      
      // 注册插件
      this.plugins.set(manifest.id, instance);
      this.state.loadedPlugins.set(manifest.id, instance);
      
      console.log(`📦 插件已加载: ${manifest.name} v${manifest.version}`);
      this.emit('plugin:loaded', { type: 'loaded', pluginId: manifest.id } as PluginEvent);
      
      return instance;
    } catch (error) {
      console.error('❌ 插件加载失败:', error);
      return null;
    }
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      console.error(`插件 ${pluginId} 不存在`);
      return false;
    }

    if (instance.status === PluginStatus.ENABLED) {
      console.log(`插件 ${pluginId} 已经启用`);
      return true;
    }

    try {
      instance.status = PluginStatus.LOADING;
      
      // 创建插件API
      const api = this.createPluginAPI(pluginId);
      
      // 存储API实例到插件实例中
      instance.api = api;
      
      // 调用插件的加载方法
      await instance.plugin.onLoad(api);
      
      // 调用启用方法（如果存在）
      if (instance.plugin.onEnable) {
        await instance.plugin.onEnable();
      }
      
      instance.status = PluginStatus.ENABLED;
      instance.enabledAt = new Date();
      this.state.enabledPlugins.add(pluginId);
      
      // 保存启用状态
      await this.saveEnabledPlugins();
      
      console.log(`✅ 插件已启用: ${instance.manifest.name}`);
      this.emit('plugin:enabled', { type: 'enabled', pluginId } as PluginEvent);
      
      return true;
    } catch (error) {
      console.error(`❌ 插件启用失败: ${pluginId}`, error);
      instance.status = PluginStatus.ERROR;
      instance.error = error instanceof Error ? error.message : '启用失败';
      this.emit('plugin:error', { type: 'error', pluginId, payload: error } as PluginEvent);
      return false;
    }
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      console.error(`插件 ${pluginId} 不存在`);
      return false;
    }

    if (instance.status !== PluginStatus.ENABLED) {
      console.log(`插件 ${pluginId} 未启用`);
      return true;
    }

    try {
      // 调用禁用方法（如果存在）
      if (instance.plugin.onDisable) {
        await instance.plugin.onDisable();
      }
      
      // 清理插件注册的资源
      this.cleanupPluginResources(pluginId);
      
      // 清理API实例
      instance.api = undefined;
      
      instance.status = PluginStatus.DISABLED;
      this.state.enabledPlugins.delete(pluginId);
      
      // 保存启用状态
      await this.saveEnabledPlugins();
      
      console.log(`🔌 插件已禁用: ${instance.manifest.name}`);
      this.emit('plugin:disabled', { type: 'disabled', pluginId } as PluginEvent);
      
      return true;
    } catch (error) {
      console.error(`❌ 插件禁用失败: ${pluginId}`, error);
      return false;
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return false;
    }

    try {
      // 先禁用插件
      if (instance.status === PluginStatus.ENABLED) {
        await this.disablePlugin(pluginId);
      }
      
      // 调用卸载方法
      await instance.plugin.onUnload();
      
      // 清理资源
      this.cleanupPluginResources(pluginId);
      
      // 从管理器中移除
      this.plugins.delete(pluginId);
      this.state.loadedPlugins.delete(pluginId);
      
      console.log(`🗑️ 插件已卸载: ${instance.manifest.name}`);
      this.emit('plugin:unloaded', { type: 'unloaded', pluginId } as PluginEvent);
      
      return true;
    } catch (error) {
      console.error(`❌ 插件卸载失败: ${pluginId}`, error);
      return false;
    }
  }

  /**
   * 获取插件实例
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取启用的插件
   */
  getEnabledPlugins(): PluginInstance[] {
    return this.getAllPlugins().filter(p => p.status === PluginStatus.ENABLED);
  }

  /**
   * 重新扫描和加载插件目录
   * 用于安装新插件后刷新插件列表
   */
  async refreshPlugins(): Promise<void> {
    try {
      console.log('🔄 重新扫描插件目录...');
      this.state.isLoading = true;
      
      // 重新加载已安装的插件
      await this.loadInstalledPlugins();
      
      // 恢复之前启用的插件状态
      await this.loadEnabledPlugins();
      
      console.log('✅ 插件刷新完成');
      this.emit('plugins:refreshed', { type: 'loaded', pluginId: 'system' } as PluginEvent);
      
    } catch (error) {
      console.error('❌ 插件刷新失败:', error);
      this.state.error = error instanceof Error ? error.message : '刷新失败';
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * 执行命令
   */
  async executeCommand(commandId: string): Promise<boolean> {
    const command = this.commands.get(commandId);
    if (!command) {
      console.error(`命令 ${commandId} 不存在`);
      return false;
    }

    try {
      await command.callback();
      return true;
    } catch (error) {
      console.error(`命令执行失败: ${commandId}`, error);
      return false;
    }
  }

  /**
   * 注册快捷键
   */
  registerShortcut(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.key, shortcut);
    // 这里应该注册到全局快捷键系统
    this.setupKeyboardListener(shortcut);
  }

  /**
   * 重置到系统默认主题
   */
  resetTheme(): void {
    console.log('🔄 重置到系统默认主题');
    
    // 移除所有插件主题样式
    document.querySelectorAll('link[data-theme]').forEach(link => {
      link.remove();
    });
    
    // 移除主题class
    document.body.classList.remove('theme-dark', 'theme-light');
    
    // 清除插件设置的CSS变量，让系统默认变量生效
    const root = document.documentElement;
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--primary-700');
    root.style.removeProperty('--accent-color');
    root.style.removeProperty('--background-color');
    root.style.removeProperty('--surface-color');
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--text-muted');
    root.style.removeProperty('--border-color');
    
    // 重置当前主题
    this.currentTheme = 'default';
    
    // 触发事件让系统重新应用默认主题
    this.emit('theme:reset', { type: 'reset', pluginId: 'system' } as PluginEvent);
    
    console.log('✅ 已重置到系统默认主题');
  }

  /**
   * 应用主题
   */
  applyTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.error(`❌ 主题 ${themeId} 不存在`);
      console.log('📋 可用主题:', Array.from(this.themes.keys()));
      return;
    }

    console.log(`🎨 开始应用主题: ${theme.name}`, theme);

    // 移除当前主题标记
    document.querySelectorAll('link[data-theme]').forEach(link => {
      link.remove();
    });

    // 移除之前的主题class
    document.body.classList.remove('theme-dark', 'theme-light');
    
    // 应用CSS变量到根元素
    const root = document.documentElement;
    console.log('🔧 应用CSS变量:', theme.variables);
    
    Object.entries(theme.variables).forEach(([key, value]) => {
      const cssVarName = `--${key}`;
      root.style.setProperty(cssVarName, value);
      console.log(`  ✅ ${cssVarName}: ${value}`);
    });

    // 添加主题class并切换 Tailwind 的 dark 模式
    if (theme.isDark !== undefined) {
      document.body.classList.add(theme.isDark ? 'theme-dark' : 'theme-light');
      document.documentElement.classList.toggle('dark', !!theme.isDark);
      console.log(`🌓 主题模式: ${theme.isDark ? '深色' : '浅色'}`);
    }

    // 加载CSS文件（如果有）
    if (theme.cssFile) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = theme.cssFile;
      link.setAttribute('data-theme', themeId);
      document.head.appendChild(link);
      console.log(`📄 加载主题CSS文件: ${theme.cssFile}`);
    }

    // 存储当前主题
    this.currentTheme = themeId;
    
    // 触发主题变更事件
    this.emit('theme:changed', { type: 'loaded', pluginId: themeId, payload: theme } as PluginEvent);
    
    // 显示成功通知
    console.log(`✅ 主题已成功应用: ${theme.name}`);
    
    // 强制重新渲染
    document.body.style.display = 'none';
    document.body.offsetHeight; // 触发重绘
    document.body.style.display = '';
  }

  // 私有方法

  private createPluginAPI(pluginId: string): PluginAPI {
    return {
      app: {
        version: this.appVersion,
        name: 'MemoryNote'
      },
      
      workspace: {
        getCurrentFile: async () => {
          // 实现获取当前文件
          return null;
        },
        openFile: async (path: string) => {
          // 实现打开文件
        },
        createFile: async (path: string, content: string) => {
          // 实现创建文件
        },
        showNotification: (message: string, type = 'info') => {
          // 实现通知显示
          console.log(`[${type.toUpperCase()}] ${message}`);
        }
      },
      
      commands: {
        register: (command: Command) => {
          this.commands.set(command.id, command);
        },
        execute: async (commandId: string) => {
          await this.executeCommand(commandId);
        },
        unregister: (commandId: string) => {
          this.commands.delete(commandId);
        }
      },
      
      shortcuts: {
        register: (shortcut: Shortcut) => {
          this.registerShortcut(shortcut);
        },
        unregister: (key: string) => {
          this.shortcuts.delete(key);
        }
      },
      
      ui: {
        registerComponent: (component: UIComponent) => {
          this.uiComponents.set(component.id, component);
        },
        unregisterComponent: (componentId: string) => {
          this.uiComponents.delete(componentId);
        },
        showModal: async (title: string, content: any, options?: any) => {
          // 实现模态框显示
          return null;
        }
      },
      
      themes: {
        register: (theme: ThemeConfig) => {
          this.themes.set(theme.id, theme);
        },
        unregister: (themeId: string) => {
          this.themes.delete(themeId);
        },
        apply: (themeId: string) => {
          this.applyTheme(themeId);
        },
        getCurrent: () => {
          return this.currentTheme;
        }
      },
      
      pages: {
        register: (page: PluginPageConfig, component: any) => {
          const fullPageId = `${pluginId}-${page.id}`;
          console.log(`🔗 注册插件页面: ${fullPageId}`, page);
          this.pluginPages.set(fullPageId, { config: { ...page, id: fullPageId }, component });
          console.log(`📋 当前已注册页面数量: ${this.pluginPages.size}`);
          this.emit('page:registered', { pluginId, page: { ...page, id: fullPageId } });
        },
        unregister: (pageId: string) => {
          const fullPageId = `${pluginId}-${pageId}`;
          this.pluginPages.delete(fullPageId);
          this.emit('page:unregistered', { pluginId, pageId: fullPageId });
        },
        navigate: (pageId: string) => {
          const fullPageId = `${pluginId}-${pageId}`;
          this.emit('page:navigate', { pageId: fullPageId });
        },
        getRegistered: () => {
          const pages: PluginPageConfig[] = [];
          for (const [id, { config }] of this.pluginPages) {
            if (id.startsWith(`${pluginId}-`)) {
              pages.push(config);
            }
          }
          return pages;
        }
      },
      
      settings: {
        get: async (key: string, defaultValue?: any) => {
          const settings = this.pluginSettings.get(pluginId) || {};
          return settings[key] ?? defaultValue;
        },
        set: async (key: string, value: any) => {
          const settings = this.pluginSettings.get(pluginId) || {};
          settings[key] = value;
          this.pluginSettings.set(pluginId, settings);
          await this.savePluginSettings(pluginId, settings);
        },
        registerSection: (items) => {
          // 实现设置界面注册
        }
      },
      
      events: {
        on: (event: string, handler: Function) => {
          this.on(event, handler);
        },
        off: (event: string, handler: Function) => {
          this.off(event, handler);
        },
        emit: (event: string, ...args: any[]) => {
          this.emit(event, ...args);
        }
      }
    };
  }

  private cleanupPluginResources(pluginId: string): void {
    // 清理命令
    for (const [id, command] of this.commands) {
      if (id.startsWith(pluginId + ':')) {
        this.commands.delete(id);
      }
    }
    
    // 清理快捷键
    for (const [key, shortcut] of this.shortcuts) {
      if (shortcut.commandId.startsWith(pluginId + ':')) {
        this.shortcuts.delete(key);
      }
    }
    
    // 清理UI组件
    for (const [id, component] of this.uiComponents) {
      if (id.startsWith(pluginId + ':')) {
        this.uiComponents.delete(id);
      }
    }
    
    // 清理主题
    for (const [id, theme] of this.themes) {
      if (id.startsWith(pluginId + ':')) {
        this.themes.delete(id);
      }
    }
  }

  private async loadInstalledPlugins(): Promise<void> {
    try {
      console.log('🔍 扫描已安装的插件...');
      
      // 获取插件目录列表
      const pluginDirectories = await window.electronAPI.plugins.scanDirectory();
      console.log('📁 找到插件目录:', pluginDirectories);
      
      let loadedCount = 0;
      let errorCount = 0;
      
      for (const pluginDir of pluginDirectories) {
        try {
          // 尝试加载每个插件
          const instance = await this.loadPluginFromManifest(pluginDir.path);
          if (instance) {
            loadedCount++;
            console.log(`✅ 插件加载成功: ${instance.manifest.name}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ 插件加载失败 [${pluginDir.path}]:`, error);
          
          // 记录错误信息但不中断整个加载过程
          this.emit('plugin:error', { 
            type: 'error', 
            pluginId: pluginDir.path,
            payload: error instanceof Error ? error.message : '未知错误'
          } as PluginEvent);
        }
      }
      
      console.log(`📊 插件扫描完成: 成功加载 ${loadedCount} 个，失败 ${errorCount} 个`);
      
      // 更新响应式状态
      this.state.loadedPlugins.clear();
      this.plugins.forEach((instance, id) => {
        this.state.loadedPlugins.set(id, instance);
      });
      
    } catch (error) {
      console.error('❌ 扫描插件目录失败:', error);
      throw new Error(`插件目录扫描失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async loadEnabledPlugins(): Promise<void> {
    try {
      const enabledList = await window.electronAPI.settings.get('enabledPlugins');
      if (enabledList) {
        const enabled = JSON.parse(enabledList) as string[];
        for (const pluginId of enabled) {
          await this.enablePlugin(pluginId);
        }
      }
    } catch (error) {
      console.error('加载启用插件列表失败:', error);
    }
  }

  private async saveEnabledPlugins(): Promise<void> {
    try {
      const enabledList = Array.from(this.state.enabledPlugins);
      await window.electronAPI.settings.set('enabledPlugins', JSON.stringify(enabledList));
    } catch (error) {
      console.error('保存启用插件列表失败:', error);
    }
  }

  private async loadPluginSettings(pluginId: string): Promise<Record<string, any>> {
    try {
      const settings = await window.electronAPI.settings.get(`plugin:${pluginId}`);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error(`加载插件设置失败: ${pluginId}`, error);
      return {};
    }
  }

  private async savePluginSettings(pluginId: string, settings: Record<string, any>): Promise<void> {
    try {
      await window.electronAPI.settings.set(`plugin:${pluginId}`, JSON.stringify(settings));
    } catch (error) {
      console.error(`保存插件设置失败: ${pluginId}`, error);
    }
  }

  private setupKeyboardListener(shortcut: Shortcut): void {
    // 实现键盘监听器设置
    document.addEventListener('keydown', (event) => {
      if (this.matchesShortcut(event, shortcut.key)) {
        event.preventDefault();
        this.executeCommand(shortcut.commandId);
      }
    });
  }

  private matchesShortcut(event: KeyboardEvent, shortcutKey: string): boolean {
    // 简单的快捷键匹配，实际项目中应该更完善
    const parts = shortcutKey.toLowerCase().split('+');
    const key = parts.pop();
    
    let matches = event.key.toLowerCase() === key;
    matches = matches && (parts.includes('ctrl') === event.ctrlKey);
    matches = matches && (parts.includes('alt') === event.altKey);
    matches = matches && (parts.includes('shift') === event.shiftKey);
    
    return matches;
  }

  /**
   * 加载插件模块
   * 由于安全考虑，这里使用简化的模块加载机制
   */
  private async loadPluginModule(pluginPath: string, mainFile: string): Promise<any> {
    try {
      console.log('🔄 正在加载插件模块:', pluginPath, mainFile);
      
      // 从完整路径中提取插件ID
      const pluginId = pluginPath.split(/[/\\]/).pop() || '';
      console.log('📂 插件ID:', pluginId);
      
      // 读取插件主文件内容
      const moduleContent = await window.electronAPI.plugins.readFile(pluginId, mainFile);
      console.log('📄 插件模块内容长度:', moduleContent.length);
      
      // 创建安全的执行环境
      const moduleExports: any = {};
      const module = { exports: moduleExports };
      
      // 提供给插件的全局API (受限)
      const pluginGlobals = {
        module,
        exports: moduleExports,
        console: {
          log: (...args: any[]) => console.log('[Plugin]', ...args),
          error: (...args: any[]) => console.error('[Plugin]', ...args),
          warn: (...args: any[]) => console.warn('[Plugin]', ...args),
          info: (...args: any[]) => console.info('[Plugin]', ...args)
        },
        // 限制对危险API的访问
        require: () => { throw new Error('require is not allowed in plugins'); },
        global: undefined as any,
        process: undefined as any,
        Buffer: undefined as any
      };
      
      // 执行插件代码
      const executeCode = new Function(
        ...Object.keys(pluginGlobals),
        moduleContent
      );
      
      executeCode(...Object.values(pluginGlobals));
      
      // 返回导出的模块，处理不同的导出格式
      let exportedPlugin;
      
      if (module.exports.default) {
        // ES6 default export: export default class
        exportedPlugin = module.exports.default;
      } else if (typeof module.exports === 'function') {
        // CommonJS direct export: module.exports = class
        exportedPlugin = module.exports;
      } else if (module.exports.constructor === Object && Object.keys(module.exports).length === 1) {
        // 单一命名导出
        const key = Object.keys(module.exports)[0];
        exportedPlugin = module.exports[key];
      } else {
        throw new Error('无法确定插件的导出格式');
      }
      
      const result = { default: exportedPlugin };
      console.log('✅ 插件模块加载成功:', typeof result.default);
      
      return result;
      
    } catch (error) {
      console.error('❌ 插件模块加载失败:', error);
      throw new Error(`插件模块加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证插件清单文件
   */
  private validateManifest(manifest: PluginManifest): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'type', 'main'];
    
    for (const field of requiredFields) {
      if (!(field in manifest) || !manifest[field as keyof PluginManifest]) {
        throw new Error(`插件清单缺少必需字段: ${field}`);
      }
    }
    
    // 验证插件ID格式
    if (!/^[a-z0-9\-]+$/.test(manifest.id)) {
      throw new Error('插件ID只能包含小写字母、数字和连字符');
    }
    
    // 验证版本格式
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('版本号格式无效，应为 x.y.z 格式');
    }
  }

  /**
   * 检查版本兼容性
   */
  private isVersionCompatible(minVersion: string): boolean {
    // 简化的版本比较，实际项目中应该使用semver库
    const currentParts = this.appVersion.split('.').map(n => parseInt(n));
    const minParts = minVersion.split('.').map(n => parseInt(n));
    
    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
      const current = currentParts[i] || 0;
      const min = minParts[i] || 0;
      
      if (current > min) return true;
      if (current < min) return false;
    }
    
    return true; // 版本相等
  }

  // 插件页面管理
  public getRegisteredPages(): PluginPageConfig[] {
    const pages: PluginPageConfig[] = [];
    for (const [id, { config }] of this.pluginPages) {
      pages.push(config);
    }
    const sortedPages = pages.sort((a, b) => (a.sidebarOrder || 999) - (b.sidebarOrder || 999));
    console.log(`📋 获取已注册页面: ${sortedPages.length} 个`, sortedPages);
    return sortedPages;
  }

  public getPluginPage(pageId: string): { config: PluginPageConfig, component: any } | null {
    return this.pluginPages.get(pageId) || null;
  }

  public getAllPluginPages(): Map<string, { config: PluginPageConfig, component: any }> {
    return new Map(this.pluginPages);
  }

}

