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
  PluginPageConfig,
  SidebarButton
} from './types';
import { PluginPermission, PluginType, PluginStatus } from './types';
import { EventEmitter } from './EventEmitter';
import { logger } from '../utils/logger';

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
  private sidebarButtons = new Map<string, SidebarButton>(); // 存储侧边栏按钮
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
    logger.system.info('插件管理器初始化', { version: appVersion });
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
      
      logger.system.info(`插件系统初始化完成，已加载 ${this.plugins.size} 个插件`);
    } catch (error) {
      logger.system.error('插件系统初始化失败', error);
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
      const minVersion = manifest.minAppVersion || manifest.engines?.memorynote?.replace('>=', '').trim();
      if (minVersion && !this.isVersionCompatible(minVersion)) {
        throw new Error(`插件 ${manifest.name} 需要应用版本 ${minVersion} 或更高`);
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
      
      logger.plugin.info(manifest.id, `插件已加载: ${manifest.name} v${manifest.version}`);
      this.emit('plugin:loaded', { type: 'loaded', pluginId: manifest.id } as PluginEvent);
      
      return instance;
    } catch (error) {
      logger.plugin.error('unknown', '插件加载失败', error);
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
      
      // 检查插件是否实现了必需的设置方法
      if (!instance.plugin.getSettings || typeof instance.plugin.getSettings !== 'function') {
        throw new Error('插件必须实现 getSettings() 方法才能启用');
      }
      
      if (!instance.plugin.onSettingChange || typeof instance.plugin.onSettingChange !== 'function') {
        throw new Error('插件必须实现 onSettingChange() 方法才能启用');
      }
      
      // 创建插件API
      const api = this.createPluginAPI(pluginId);
      
      // 存储API实例到插件实例中
      instance.api = api;
      
      // 初始化插件资源容器
      if (!instance.mountedComponents) {
        instance.mountedComponents = new Map();
      }
      if (!instance.registeredStyles) {
        instance.registeredStyles = [];
      }
      if (!instance.registeredRenderers) {
        instance.registeredRenderers = new Map();
      }
      
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
      
      logger.plugin.info(pluginId, `插件已启用: ${instance.manifest.name}`);
      this.emit('plugin:enabled', { type: 'enabled', pluginId } as PluginEvent);
      
      return true;
    } catch (error) {
      logger.plugin.error(pluginId, '插件启用失败', error);
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
          try {
            const appStore = (window as any).__APP_STORE__;
            if (appStore && appStore.currentFile) {
              const currentFile = appStore.currentFile;
              const content = await window.electronAPI.fs.readFile(currentFile.path);
              return { 
                path: currentFile.path, 
                name: currentFile.name,
                content: content 
              };
            }
            return null;
          } catch (error) {
            console.error('获取当前文件失败:', error);
            return null;
          }
        },
        openFile: async (path: string) => {
          try {
            const router = (window as any).__VUE_ROUTER__;
            if (router) {
              const encodedPath = encodeURIComponent(path);
              await router.push(`/note/${encodedPath}`);
            } else {
              console.warn('路由系统不可用，无法打开文件');
            }
          } catch (error) {
            console.error('打开文件失败:', error);
          }
        },
        createFile: async (path: string, content: string) => {
          try {
            await window.electronAPI.fs.writeFile(path, content);
            // 刷新文件树
            const filesStore = (window as any).__FILES_STORE__;
            if (filesStore && filesStore.loadFileTree) {
              await filesStore.loadFileTree();
            }
          } catch (error) {
            console.error('创建文件失败:', error);
            throw error;
          }
        },
        showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
          try {
            this.showPluginNotification(message, type);
          } catch (error) {
            console.error('显示通知失败:', error);
            console.log(`[${type.toUpperCase()}] ${message}`);
          }
        },
        getActiveEditor: () => {
          return (window as any).__ACTIVE_EDITOR__ || null;
        },
        insertText: (text: string) => {
          const editor = (window as any).__ACTIVE_EDITOR__;
          if (editor && editor.insertText) {
            editor.insertText(text);
          }
        },
        getSelectedText: () => {
          const editor = (window as any).__ACTIVE_EDITOR__;
          return editor?.getSelectedText?.() || '';
        },
        replaceSelectedText: (text: string) => {
          const editor = (window as any).__ACTIVE_EDITOR__;
          if (editor && editor.replaceSelectedText) {
            editor.replaceSelectedText(text);
          }
        },
        getCursorPosition: () => {
          const editor = (window as any).__ACTIVE_EDITOR__;
          return editor?.getCursorPosition?.() || { line: 1, column: 1 };
        },
        setCursorPosition: (line: number, column: number) => {
          const editor = (window as any).__ACTIVE_EDITOR__;
          if (editor && editor.setCursorPosition) {
            editor.setCursorPosition(line, column);
          }
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
      
      sidebar: {
        registerButton: (buttonConfig: Omit<SidebarButton, 'id' | 'pluginId'>) => {
          const instance = this.plugins.get(pluginId);
          if (!instance) {
            throw new Error(`插件 ${pluginId} 未找到`);
          }
          
          // 检查插件是否已经注册了侧边栏按钮
          if (instance.sidebarButton) {
            console.warn(`插件 ${pluginId} 已经注册了侧边栏按钮，将替换现有按钮`);
            this.sidebarButtons.delete(instance.sidebarButton.id);
          }
          
          const buttonId = `${pluginId}-sidebar-btn`;
          const button: SidebarButton = {
            id: buttonId,
            pluginId,
            ...buttonConfig
          };
          
          this.sidebarButtons.set(buttonId, button);
          instance.sidebarButton = button;
          
          console.log(`🔘 插件 ${pluginId} 注册侧边栏按钮:`, button.title);
          this.emit('sidebar-button:registered', { pluginId, button });
          
          return buttonId;
        },
        
        unregisterButton: () => {
          const instance = this.plugins.get(pluginId);
          if (instance && instance.sidebarButton) {
            this.sidebarButtons.delete(instance.sidebarButton.id);
            console.log(`🔘 插件 ${pluginId} 注销侧边栏按钮`);
            this.emit('sidebar-button:unregistered', { pluginId, buttonId: instance.sidebarButton.id });
            instance.sidebarButton = undefined;
          }
        },
        
        updateButton: (updates: Partial<Omit<SidebarButton, 'id' | 'pluginId'>>) => {
          const instance = this.plugins.get(pluginId);
          if (instance && instance.sidebarButton) {
            const button = { ...instance.sidebarButton, ...updates };
            this.sidebarButtons.set(button.id, button);
            instance.sidebarButton = button;
            console.log(`🔘 插件 ${pluginId} 更新侧边栏按钮`);
            this.emit('sidebar-button:updated', { pluginId, button });
          }
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
          // TODO: 实现设置界面注册
          console.log('注册设置界面:', items);
        }
      },

      // 编辑器增强
      editor: {
        registerRenderer: (type: string, renderer: Function) => {
          const instance = this.plugins.get(pluginId);
          if (instance) {
            if (!instance.registeredRenderers) {
              instance.registeredRenderers = new Map();
            }
            instance.registeredRenderers.set(type, renderer);
            console.log(`✅ 插件 ${pluginId} 注册渲染器: ${type}`);
          }
        },
        registerStyle: (name: string, cssRules: string) => {
          const instance = this.plugins.get(pluginId);
          if (instance) {
            const styleId = `plugin-${pluginId}-${name}`;
            const existingStyle = document.getElementById(styleId);
            
            if (existingStyle) {
              existingStyle.textContent = cssRules;
            } else {
              const style = document.createElement('style');
              style.id = styleId;
              style.setAttribute('data-plugin', pluginId);
              style.textContent = cssRules;
              document.head.appendChild(style);
            }
            
            if (!instance.registeredStyles) {
              instance.registeredStyles = [];
            }
            if (!instance.registeredStyles.includes(styleId)) {
              instance.registeredStyles.push(styleId);
            }
            
            console.log(`✅ 插件 ${pluginId} 注册样式: ${name}`);
          }
        },
        addToolbarButton: (button: any) => {
          console.log(`插件 ${pluginId} 添加工具栏按钮:`, button);
        },
        registerCodeHighlighter: (language: string, highlighter: Function) => {
          console.log(`插件 ${pluginId} 注册代码高亮器: ${language}`);
        }
      },

      // 文件系统操作
      fs: {
        readFile: async (path: string) => {
          try {
            return await window.electronAPI.fs.readFile(path);
          } catch (error) {
            console.error('读取文件失败:', error);
            throw error;
          }
        },
        writeFile: async (path: string, content: string) => {
          try {
            await window.electronAPI.fs.writeFile(path, content);
            return true;
          } catch (error) {
            console.error('写入文件失败:', error);
            return false;
          }
        },
        listDirectory: async (path: string) => {
          console.warn('listDirectory 功能尚未实现');
          return [];
        },
        copyFile: async (src: string, dest: string) => {
          console.warn('copyFile 功能尚未实现');
          return false;
        },
        deleteFile: async (path: string) => {
          console.warn('deleteFile 功能尚未实现');
          return false;
        },
        createDirectory: async (path: string) => {
          console.warn('createDirectory 功能尚未实现');
          return false;
        },
        exists: async (path: string) => {
          console.warn('exists 功能尚未实现');
          return false;
        }
      },

      // 挂载系统
      mount: {
        registerComponent: (location: any, component: any) => {
          const instance = this.plugins.get(pluginId);
          if (instance) {
            if (!instance.mountedComponents) {
              instance.mountedComponents = new Map();
            }
            
            let components = instance.mountedComponents.get(location);
            if (!components) {
              components = [];
              instance.mountedComponents.set(location, components);
            }
            
            components.push(component);
            console.log(`✅ 插件 ${pluginId} 挂载组件到 ${location}`);
            
            // 触发挂载事件
            this.emit('component:mounted', { pluginId, location, component });
          }
        },
        unregisterComponent: (location: any, componentId: string) => {
          const instance = this.plugins.get(pluginId);
          if (instance && instance.mountedComponents) {
            const components = instance.mountedComponents.get(location);
            if (components) {
              const index = components.findIndex((c: any) => c.id === componentId);
              if (index > -1) {
                components.splice(index, 1);
                console.log(`✅ 插件 ${pluginId} 卸载组件 ${componentId} 从 ${location}`);
                
                // 触发卸载事件
                this.emit('component:unmounted', { pluginId, location, componentId });
              }
            }
          }
        },
        unregisterAll: () => {
          const instance = this.plugins.get(pluginId);
          if (instance && instance.mountedComponents) {
            // 遍历所有挂载位置，卸载所有组件
            for (const [location, components] of instance.mountedComponents.entries()) {
              for (const component of components) {
                console.log(`🔄 插件 ${pluginId} 卸载组件 ${component.id || 'unknown'} 从 ${location}`);
                this.emit('component:unmounted', { pluginId, location, componentId: component.id });
              }
            }
            
            // 清空所有挂载的组件
            instance.mountedComponents.clear();
            console.log(`✅ 插件 ${pluginId} 已卸载所有挂载的组件`);
          }
        },
        getComponentsAt: (location: any) => {
          const instance = this.plugins.get(pluginId);
          if (instance && instance.mountedComponents) {
            return instance.mountedComponents.get(location) || [];
          }
          return [];
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
    console.log(`🧹 清理插件资源: ${pluginId}`);
    
    const instance = this.plugins.get(pluginId);
    
    // 清理命令
    for (const [id, command] of this.commands) {
      if (id.startsWith(pluginId + ':')) {
        this.commands.delete(id);
        console.log(`  ✅ 移除命令: ${id}`);
      }
    }
    
    // 清理快捷键
    for (const [key, shortcut] of this.shortcuts) {
      if (shortcut.commandId.startsWith(pluginId + ':')) {
        this.shortcuts.delete(key);
        console.log(`  ✅ 移除快捷键: ${key}`);
      }
    }
    
    // 清理UI组件
    for (const [id, component] of this.uiComponents) {
      if (id.startsWith(pluginId + ':')) {
        this.uiComponents.delete(id);
        console.log(`  ✅ 移除UI组件: ${id}`);
      }
    }
    
    // 清理主题
    for (const [id, theme] of this.themes) {
      if (id.startsWith(pluginId + ':')) {
        this.themes.delete(id);
        console.log(`  ✅ 移除主题: ${id}`);
      }
    }
    
    // 清理挂载的组件
    if (instance && instance.mountedComponents) {
      instance.mountedComponents.clear();
      console.log(`  ✅ 清理挂载组件`);
    }
    
    // 清理注册的样式
    if (instance && instance.registeredStyles) {
      instance.registeredStyles.forEach(styleId => {
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
          console.log(`  ✅ 移除样式: ${styleId}`);
        }
      });
      instance.registeredStyles = [];
    }
    
    // 清理注册的渲染器
    if (instance && instance.registeredRenderers) {
      instance.registeredRenderers.clear();
      console.log(`  ✅ 清理渲染器`);
    }
    
    // 清理页面注册
    for (const [pageId, pageData] of this.pluginPages) {
      if (pageId.startsWith(pluginId + '-')) {
        this.pluginPages.delete(pageId);
        console.log(`  ✅ 移除页面: ${pageId}`);
      }
    }
    
    // 清理侧边栏按钮
    if (instance && instance.sidebarButton) {
      this.sidebarButtons.delete(instance.sidebarButton.id);
      console.log(`  ✅ 移除侧边栏按钮: ${instance.sidebarButton.title}`);
      this.emit('sidebar-button:unregistered', { pluginId, buttonId: instance.sidebarButton.id });
      instance.sidebarButton = undefined;
    }
    
    // 触发清理事件
    this.emit('plugin:resources-cleaned', { pluginId, type: 'cleanup' });
    
    console.log(`🧹 插件 ${pluginId} 资源清理完成`);
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
    if (!minVersion || !this.appVersion) {
      return true; // 如果没有版本要求或应用版本未知，默认兼容
    }
    
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

  // 显示插件通知
  private showPluginNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    // 创建简单的通知元素
    const notification = document.createElement('div');
    notification.className = `plugin-notification plugin-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `;
    
    // 根据类型设置背景色
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#10b981';
        break;
      case 'warning':
        notification.style.backgroundColor = '#f59e0b';
        break;
      case 'error':
        notification.style.backgroundColor = '#ef4444';
        break;
      default:
        notification.style.backgroundColor = '#3b82f6';
    }
    
    notification.textContent = message;
    
    // 添加样式
    if (!document.getElementById('plugin-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'plugin-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 卸载插件组件从指定位置
  public unmountPluginFromLocation(pluginId: string, location: any) {
    const instance = this.plugins.get(pluginId);
    if (instance && instance.mountedComponents) {
      instance.mountedComponents.delete(location);
      console.log(`✅ 插件 ${pluginId} 从 ${location} 卸载所有组件`);
      
      // 触发卸载事件
      this.emit('plugin:unmounted', { pluginId, location });
    }
  }

  /**
   * 获取所有注册的侧边栏按钮
   */
  public getRegisteredSidebarButtons(): SidebarButton[] {
    return Array.from(this.sidebarButtons.values())
      .sort((a, b) => (a.position || 999) - (b.position || 999));
  }

  /**
   * 获取指定插件的侧边栏按钮
   */
  public getPluginSidebarButton(pluginId: string): SidebarButton | null {
    const instance = this.plugins.get(pluginId);
    return instance?.sidebarButton || null;
  }

  /**
   * 获取所有注册的快捷键
   */
  public getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 更新快捷键
   */
  public updateShortcut(oldKey: string, newKey: string): boolean {
    const shortcut = this.shortcuts.get(oldKey);
    if (!shortcut) return false;
    
    // 检查新快捷键是否已被占用
    if (this.shortcuts.has(newKey)) return false;
    
    // 删除旧的快捷键
    this.shortcuts.delete(oldKey);
    
    // 注册新的快捷键
    const newShortcut = { ...shortcut, key: newKey };
    this.shortcuts.set(newKey, newShortcut);
    this.setupKeyboardListener(newShortcut);
    
    return true;
  }

}

