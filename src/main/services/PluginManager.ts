/**
 * 插件管理器 (优化版 v3)
 * 
 * 核心改进:
 * 1. 使用 semver 进行版本兼容性检查
 * 2. 完整清理 require.cache
 * 3. 原子性插件更新
 * 4. 改进 manifest 验证
 * 5. 事件驱动解耦
 * 6. 插件状态状态机
 * 7. 插件代码隔离执行（VM sandbox）
 */

import { app } from 'electron';
import { EventEmitter } from 'events';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import semver from 'semver';
import { ConfigService } from './ConfigService';
import { AlgorithmRegistry } from './AlgorithmRegistry';
import { PluginExecutor } from './PluginExecutor';
import type {
  PluginManifest,
  PluginInfo,
  PluginInstallOptions,
  PluginFilter,
  PluginStatus,
} from '../../shared/types/plugin';
import type { IReviewAlgorithm, IDiffAlgorithm } from '../../shared/types/review';

/** 应用版本号 */
const APP_VERSION = '1.0.0';

/** 插件管理器事件 */
export const PLUGIN_EVENTS = {
  PLUGIN_INSTALLED: 'plugin:installed',
  PLUGIN_UNINSTALLED: 'plugin:uninstalled',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_ERROR: 'plugin:error',
} as const;

/**
 * 插件管理器
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginInfo> = new Map();
  private pluginsDir: string;
  private static instance: PluginManager | null = null;
  private initialized = false;

  private constructor() {
    super();
    this.pluginsDir = this.getPluginsDir();
    this.ensurePluginsDir();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * 重置实例
   */
  static resetInstance(): void {
    PluginManager.instance = null;
  }

  /**
   * 获取插件目录
   */
  private getPluginsDir(): string {
    const configService = ConfigService.getInstance();
    const appConfig = configService.get('app');

    if (appConfig && appConfig.workspace) {
      return path.join(appConfig.workspace, '.plugins');
    }

    return path.join(app.getPath('userData'), 'plugins');
  }

  /**
   * 确保插件目录存在
   */
  private ensurePluginsDir(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  /**
   * 更新插件目录（用于工作区切换）
   * 会重新扫描并加载插件
   */
  async updatePluginsDir(): Promise<void> {
    // 先卸载所有插件算法
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.status === 'loaded') {
        AlgorithmRegistry.getInstance().unregisterPluginAlgorithms(plugin.manifest.id);
        PluginExecutor.getInstance().unregisterPluginAlgorithms(plugin.manifest.id);
      }
    }
    
    // 更新目录
    this.pluginsDir = this.getPluginsDir();
    this.ensurePluginsDir();
    
    // 重新初始化
    this.initialized = false;
    await this.initialize();
    
    console.log('✅ PluginManager plugins directory updated:', this.pluginsDir);
  }

  /**
   * 初始化并扫描所有插件
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[PluginManager] Already initialized, skipping');
      return;
    }
    
    console.log('[PluginManager] Initializing...');
    
    // 确保 AlgorithmRegistry 已初始化（注册内置算法）
    AlgorithmRegistry.getInstance().initialize();
    
    // 初始化插件隔离执行器
    try {
      await PluginExecutor.getInstance().initialize();
      console.log('[PluginManager] Plugin executor initialized');
    } catch (error) {
      console.warn('[PluginManager] Plugin executor initialization failed, using fallback:', error);
    }
    
    // 扫描插件
    await this.scanPlugins();
    console.log(`[PluginManager] Found ${this.plugins.size} plugins`);
    
    // 加载已启用插件的算法
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        await this.loadPluginAlgorithms(plugin);
      }
    }
    
    this.initialized = true;
  }

  /**
   * 扫描插件目录
   */
  async scanPlugins(): Promise<void> {
    this.plugins.clear();

    if (!fs.existsSync(this.pluginsDir)) {
      return;
    }

    const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const pluginPath = path.join(this.pluginsDir, entry.name);
        const manifestPath = path.join(pluginPath, 'manifest.json');

        if (fs.existsSync(manifestPath)) {
          try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            const manifest: PluginManifest = JSON.parse(manifestContent);
            
            // 加载插件配置
            const configPath = path.join(pluginPath, '.plugin-config.json');
            let config = { enabled: true, installedAt: Date.now(), updatedAt: Date.now() };
            
            if (fs.existsSync(configPath)) {
              const configContent = fs.readFileSync(configPath, 'utf-8');
              config = { ...config, ...JSON.parse(configContent) };
            }

            // 检查版本兼容性
            const compatError = this.checkVersionCompatibility(manifest);
            
            const pluginInfo: PluginInfo = {
              manifest,
              status: compatError ? 'error' : 'scanned',
              enabled: config.enabled && !compatError, // 不兼容的插件自动禁用
              path: pluginPath,
              installedAt: config.installedAt,
              updatedAt: config.updatedAt,
              error: compatError || undefined,
              loadedAlgorithms: [],
            };
            
            this.plugins.set(manifest.id, pluginInfo);

            if (compatError) {
              console.warn(`[PluginManager] Plugin ${manifest.name} disabled: ${compatError}`);
            } else {
              console.log(`[PluginManager] Scanned plugin: ${manifest.name} (${manifest.id})`);
            }
          } catch (error) {
            console.error(`[PluginManager] Failed to load plugin at ${pluginPath}:`, error);
            // 即使加载失败，也记录错误信息
            this.plugins.set(entry.name, {
              manifest: {
                id: entry.name,
                name: entry.name,
                version: 'unknown',
                author: 'unknown',
                description: 'Failed to load plugin',
                main: '',
                engines: { memorynote: '*' },
              },
              status: 'error',
              enabled: false,
              path: pluginPath,
              installedAt: Date.now(),
              updatedAt: Date.now(),
              error: error instanceof Error ? error.message : 'Unknown error',
              loadedAlgorithms: [],
            });
          }
        }
      }
    }
  }

  /**
   * 检查版本兼容性（使用 semver）
   * @returns 错误信息，如果兼容则返回 null
   */
  private checkVersionCompatibility(manifest: PluginManifest): string | null {
    if (!manifest.engines?.memorynote) {
      return null; // 没有指定版本要求，默认兼容
    }
    
    const required = manifest.engines.memorynote;
    
    // 使用 semver 进行版本比较
    if (required === '*') {
      return null; // 任意版本
    }
    
    try {
      if (!semver.satisfies(APP_VERSION, required)) {
        return `Requires MemoryNote ${required}, current: ${APP_VERSION}`;
      }
    } catch (error) {
      return `Invalid version requirement: ${required}`;
    }
    
    return null;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(filter?: PluginFilter): PluginInfo[] {
    let plugins = Array.from(this.plugins.values());

    if (filter) {
      if (filter.enabled !== undefined) {
        plugins = plugins.filter(p => p.enabled === filter.enabled);
      }
      if (filter.loaded !== undefined) {
        plugins = plugins.filter(p => (filter.loaded ? p.status === 'loaded' : p.status !== 'loaded'));
      }
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        plugins = plugins.filter(p =>
          p.manifest.name.toLowerCase().includes(keyword) ||
          p.manifest.description.toLowerCase().includes(keyword) ||
          p.manifest.id.toLowerCase().includes(keyword)
        );
      }
    }

    return plugins;
  }

  /**
   * 获取单个插件
   */
  getPlugin(pluginId: string): PluginInfo | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 从 ZIP 文件安装插件
   */
  async installFromZip(options: PluginInstallOptions): Promise<PluginInfo> {
    const { zipPath, overwrite = false } = options;

    if (!fs.existsSync(zipPath)) {
      throw new Error(`ZIP file not found: ${zipPath}`);
    }

    // 创建临时目录
    const tempDir = path.join(this.pluginsDir, '.temp-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // 解压 ZIP 文件
      await this.extractZip(zipPath, tempDir);

      // 查找 manifest.json
      const manifestPath = await this.findManifest(tempDir);
      if (!manifestPath) {
        throw new Error('manifest.json not found in ZIP file');
      }

      // 读取 manifest
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // 验证 manifest
      this.validateManifest(manifest, tempDir);

      // 检查是否已存在
      if (this.plugins.has(manifest.id) && !overwrite) {
        throw new Error(`Plugin ${manifest.id} already exists. Set overwrite=true to replace.`);
      }

      // 目标目录
      const targetDir = path.join(this.pluginsDir, manifest.id);

      // 如果覆盖，先删除旧版本
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      // 移动到目标目录
      const pluginRoot = path.dirname(manifestPath);
      fs.renameSync(pluginRoot, targetDir);

      // 创建插件配置
      const now = Date.now();
      const config = {
        enabled: true,
        installedAt: now,
        updatedAt: now,
      };
      fs.writeFileSync(
        path.join(targetDir, '.plugin-config.json'),
        JSON.stringify(config, null, 2)
      );

      // 创建插件信息
      const pluginInfo: PluginInfo = {
        manifest,
        status: 'scanned',
        enabled: true,
        path: targetDir,
        installedAt: now,
        updatedAt: now,
        loadedAlgorithms: [],
      };

      this.plugins.set(manifest.id, pluginInfo);
      
      // 加载插件算法（因为默认是启用的）
      await this.loadPluginAlgorithms(pluginInfo);
      
      this.emit(PLUGIN_EVENTS.PLUGIN_INSTALLED, pluginInfo);

      console.log(`[PluginManager] Installed plugin: ${manifest.name} (${manifest.id})`);
      return pluginInfo;
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * 解压 ZIP 文件
   */
  private async extractZip(zipPath: string, targetDir: string): Promise<void> {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetDir, true);
  }

  /**
   * 在目录中查找 manifest.json
   */
  private async findManifest(dir: string): Promise<string | null> {
    // 首先检查根目录
    const rootManifest = path.join(dir, 'manifest.json');
    if (fs.existsSync(rootManifest)) {
      return rootManifest;
    }

    // 检查子目录（有些 ZIP 会有一层包装目录）
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subManifest = path.join(dir, entry.name, 'manifest.json');
        if (fs.existsSync(subManifest)) {
          return subManifest;
        }
      }
    }

    return null;
  }

  /**
   * 验证 manifest（增强版）
   */
  private validateManifest(manifest: PluginManifest, pluginPath: string): void {
    if (!manifest.id) {
      throw new Error('Plugin manifest must have an id');
    }
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest must have a version');
    }
    if (!manifest.main) {
      throw new Error('Plugin manifest must have a main entry file');
    }
    
    // 安全检查：防止路径越界
    const mainPath = path.resolve(pluginPath, manifest.main);
    if (!mainPath.startsWith(pluginPath)) {
      throw new Error('Plugin main file path is outside plugin directory (security violation)');
    }
    
    // 验证 contribution 结构
    if (manifest.contributes) {
      this.validateContributions(manifest.contributes, pluginPath);
    }
  }

  /**
   * 验证贡献点结构
   */
  private validateContributions(contributes: PluginManifest['contributes'], pluginPath: string): void {
    if (!contributes) return;
    
    const algorithmIds = new Set<string>();
    
    // 验证复习算法
    if (contributes.reviewAlgorithms) {
      for (const algo of contributes.reviewAlgorithms) {
        if (!algo.id || !algo.name || !algo.main) {
          throw new Error('Review algorithm contribution must have id, name, and main');
        }
        if (algorithmIds.has(algo.id)) {
          throw new Error(`Duplicate algorithm id: ${algo.id}`);
        }
        algorithmIds.add(algo.id);
        
        // 路径安全检查
        const algoPath = path.resolve(pluginPath, algo.main);
        if (!algoPath.startsWith(pluginPath)) {
          throw new Error(`Algorithm path outside plugin directory: ${algo.main}`);
        }
      }
    }
    
    // 验证 Diff 算法
    if (contributes.diffAlgorithms) {
      for (const algo of contributes.diffAlgorithms) {
        if (!algo.id || !algo.name || !algo.main) {
          throw new Error('Diff algorithm contribution must have id, name, and main');
        }
        if (algorithmIds.has(algo.id)) {
          throw new Error(`Duplicate algorithm id: ${algo.id}`);
        }
        algorithmIds.add(algo.id);
        
        // 路径安全检查
        const algoPath = path.resolve(pluginPath, algo.main);
        if (!algoPath.startsWith(pluginPath)) {
          throw new Error(`Algorithm path outside plugin directory: ${algo.main}`);
        }
      }
    }
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 卸载插件算法
    AlgorithmRegistry.getInstance().unregisterPluginAlgorithms(pluginId);
    
    // 从沙箱中注销
    PluginExecutor.getInstance().unregisterPluginAlgorithms(pluginId);

    // 删除插件目录
    if (fs.existsSync(plugin.path)) {
      fs.rmSync(plugin.path, { recursive: true, force: true });
    }

    this.plugins.delete(pluginId);
    console.log(`[PluginManager] Uninstalled plugin: ${pluginId}`);
  }

  /**
   * 卸载所有插件
   */
  async uninstallAllPlugins(): Promise<{ success: number; failed: number }> {
    const pluginIds = Array.from(this.plugins.keys());
    let success = 0;
    let failed = 0;

    for (const pluginId of pluginIds) {
      try {
        await this.uninstallPlugin(pluginId);
        success++;
      } catch (error) {
        console.error(`[PluginManager] Failed to uninstall plugin ${pluginId}:`, error);
        failed++;
      }
    }

    console.log(`[PluginManager] Uninstalled all plugins: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = true;
    plugin.updatedAt = Date.now();
    await this.savePluginConfig(plugin);
    
    // 加载插件算法
    await this.loadPluginAlgorithms(plugin);

    console.log(`[PluginManager] Enabled plugin: ${pluginId}`);
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = false;
    plugin.status = 'disabled';
    plugin.updatedAt = Date.now();
    plugin.error = undefined; // 清除错误
    await this.savePluginConfig(plugin);
    
    // 卸载插件算法
    AlgorithmRegistry.getInstance().unregisterPluginAlgorithms(pluginId);
    
    // 从沙箱中注销
    PluginExecutor.getInstance().unregisterPluginAlgorithms(pluginId);

    console.log(`[PluginManager] Disabled plugin: ${pluginId}`);
  }

  /**
   * 保存插件配置
   */
  private async savePluginConfig(plugin: PluginInfo): Promise<void> {
    const configPath = path.join(plugin.path, '.plugin-config.json');
    const config = {
      enabled: plugin.enabled,
      installedAt: plugin.installedAt,
      updatedAt: plugin.updatedAt,
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * 获取插件目录路径
   */
  getPluginsDirectory(): string {
    return this.pluginsDir;
  }

  /**
   * 加载插件提供的算法
   * 改进：使用隔离沙箱执行，完整清理 require.cache，正确设置状态
   */
  private async loadPluginAlgorithms(plugin: PluginInfo): Promise<void> {
    const { manifest } = plugin;
    const registry = AlgorithmRegistry.getInstance();
    const executor = PluginExecutor.getInstance();
    const errors: string[] = [];
    const loadedAlgorithmIds: string[] = [];
    let hasLoadedAny = false;

    // 完整清理插件目录下的所有缓存（用于 fallback 模式）
    this.clearPluginRequireCache(plugin.path);

    plugin.status = 'loading';
    
    // 判断是否使用隔离执行
    const useSandbox = executor.isAvailable();
    if (useSandbox) {
      console.log(`[PluginManager] Loading plugin ${manifest.name} in sandbox mode`);
    } else {
      console.warn(`[PluginManager] Loading plugin ${manifest.name} in UNSAFE direct mode (sandbox unavailable)`);
    }

    // 加载复习算法
    if (manifest.contributes?.reviewAlgorithms) {
      for (const contribution of manifest.contributes.reviewAlgorithms) {
        try {
          const algorithmPath = path.join(plugin.path, contribution.main);
          if (fs.existsSync(algorithmPath)) {
            const algoId = AlgorithmRegistry.generateAlgorithmId('review', 'plugin', manifest.id, contribution.id);
            
            let algorithm: IReviewAlgorithm;
            
            if (useSandbox) {
              // 隔离执行模式：注册到沙箱并创建代理
              executor.registerAlgorithm(manifest.id, contribution.id, 'review', algorithmPath, contribution.name);
              algorithm = executor.createSandboxedReviewAlgorithm(algoId, contribution.name);
            } else {
              // Fallback: 直接 require（不安全）
              algorithm = require(algorithmPath) as IReviewAlgorithm;
            }
            
            registry.registerReviewAlgorithmFromPlugin(plugin, contribution, algorithm);
            loadedAlgorithmIds.push(algoId);
            hasLoadedAny = true;
            console.log(`[PluginManager] Loaded review algorithm: ${contribution.name} from ${manifest.name} (sandbox: ${useSandbox})`);
          } else {
            const errMsg = `Review algorithm file not found: ${contribution.main}`;
            errors.push(errMsg);
            console.warn(`[PluginManager] ${errMsg}`);
          }
        } catch (error) {
          const errMsg = `Failed to load review algorithm ${contribution.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errMsg);
          console.error(`[PluginManager] ${errMsg}`);
        }
      }
    }

    // 加载 Diff 算法
    if (manifest.contributes?.diffAlgorithms) {
      for (const contribution of manifest.contributes.diffAlgorithms) {
        try {
          const algorithmPath = path.join(plugin.path, contribution.main);
          if (fs.existsSync(algorithmPath)) {
            const algoId = AlgorithmRegistry.generateAlgorithmId('diff', 'plugin', manifest.id, contribution.id);
            
            let algorithm: IDiffAlgorithm;
            
            if (useSandbox) {
              // 隔离执行模式：注册到沙箱并创建代理
              executor.registerAlgorithm(manifest.id, contribution.id, 'diff', algorithmPath, contribution.name);
              algorithm = executor.createSandboxedDiffAlgorithm(algoId, contribution.name);
            } else {
              // Fallback: 直接 require（不安全）
              algorithm = require(algorithmPath) as IDiffAlgorithm;
            }
            
            registry.registerDiffAlgorithmFromPlugin(plugin, contribution, algorithm);
            loadedAlgorithmIds.push(algoId);
            hasLoadedAny = true;
            console.log(`[PluginManager] Loaded diff algorithm: ${contribution.name} from ${manifest.name} (sandbox: ${useSandbox})`);
          } else {
            const errMsg = `Diff algorithm file not found: ${contribution.main}`;
            errors.push(errMsg);
            console.warn(`[PluginManager] ${errMsg}`);
          }
        } catch (error) {
          const errMsg = `Failed to load diff algorithm ${contribution.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errMsg);
          console.error(`[PluginManager] ${errMsg}`);
        }
      }
    }

    // 更新插件状态
    if (hasLoadedAny) {
      plugin.status = 'loaded';
    } else if (errors.length > 0) {
      plugin.status = 'error';
    } else if (!manifest.contributes?.reviewAlgorithms && !manifest.contributes?.diffAlgorithms) {
      plugin.status = 'loaded'; // 没有算法贡献，但也算加载成功
    } else {
      plugin.status = 'error';
    }
    plugin.loadedAlgorithms = loadedAlgorithmIds;
    if (errors.length > 0) {
      plugin.error = errors.join('; ');
    }
    
    this.emit(PLUGIN_EVENTS.PLUGIN_LOADED, plugin);
  }

  /**
   * 完整清理插件目录下的 require 缓存
   * 解决热更新失效和老逻辑残留问题
   */
  private clearPluginRequireCache(pluginPath: string): void {
    const normalizedPath = path.normalize(pluginPath);
    const keysToDelete = Object.keys(require.cache).filter(key => {
      const normalizedKey = path.normalize(key);
      return normalizedKey.startsWith(normalizedPath);
    });
    
    for (const key of keysToDelete) {
      delete require.cache[key];
    }
    
    if (keysToDelete.length > 0) {
      console.log(`[PluginManager] Cleared ${keysToDelete.length} cached modules for plugin at ${pluginPath}`);
    }
  }
}
