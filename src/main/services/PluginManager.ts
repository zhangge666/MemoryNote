/**
 * 插件管理器
 * 阶段 11: 插件系统
 */

import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { ConfigService } from './ConfigService';
import { AlgorithmRegistry } from './AlgorithmRegistry';
import type {
  PluginManifest,
  PluginInfo,
  PluginInstallOptions,
  PluginFilter,
} from '../../shared/types/plugin';
import type { IReviewAlgorithm, IDiffAlgorithm } from '../../shared/types/review';

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, PluginInfo> = new Map();
  private pluginsDir: string;
  private static instance: PluginManager | null = null;

  private constructor() {
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
   */
  updatePluginsDir(): void {
    this.pluginsDir = this.getPluginsDir();
    this.ensurePluginsDir();
    console.log('✅ PluginManager plugins directory updated:', this.pluginsDir);
  }

  /**
   * 初始化并扫描所有插件
   */
  async initialize(): Promise<void> {
    console.log('[PluginManager] Initializing...');
    await this.scanPlugins();
    console.log(`[PluginManager] Found ${this.plugins.size} plugins`);
    
    // 加载已启用插件的算法
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        await this.loadPluginAlgorithms(plugin);
      }
    }
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
      if (entry.isDirectory()) {
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

            this.plugins.set(manifest.id, {
              manifest,
              enabled: config.enabled,
              loaded: false,
              path: pluginPath,
              installedAt: config.installedAt,
              updatedAt: config.updatedAt,
            });

            console.log(`[PluginManager] Scanned plugin: ${manifest.name} (${manifest.id})`);
          } catch (error) {
            console.error(`[PluginManager] Failed to load plugin at ${pluginPath}:`, error);
          }
        }
      }
    }
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
        plugins = plugins.filter(p => p.loaded === filter.loaded);
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
      this.validateManifest(manifest);

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
        enabled: true,
        loaded: false,
        path: targetDir,
        installedAt: now,
        updatedAt: now,
      };

      this.plugins.set(manifest.id, pluginInfo);
      
      // 加载插件算法（因为默认是启用的）
      await this.loadPluginAlgorithms(pluginInfo);

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
   * 验证 manifest
   */
  private validateManifest(manifest: PluginManifest): void {
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

    // 删除插件目录
    if (fs.existsSync(plugin.path)) {
      fs.rmSync(plugin.path, { recursive: true, force: true });
    }

    this.plugins.delete(pluginId);
    console.log(`[PluginManager] Uninstalled plugin: ${pluginId}`);
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
    plugin.updatedAt = Date.now();
    await this.savePluginConfig(plugin);
    
    // 卸载插件算法
    AlgorithmRegistry.getInstance().unregisterPluginAlgorithms(pluginId);

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
   */
  private async loadPluginAlgorithms(plugin: PluginInfo): Promise<void> {
    const { manifest } = plugin;
    const registry = AlgorithmRegistry.getInstance();

    // 加载复习算法
    if (manifest.contributes?.reviewAlgorithms) {
      for (const contribution of manifest.contributes.reviewAlgorithms) {
        try {
          const algorithmPath = path.join(plugin.path, contribution.main);
          if (fs.existsSync(algorithmPath)) {
            // 清除缓存以确保重新加载
            delete require.cache[require.resolve(algorithmPath)];
            const algorithm = require(algorithmPath) as IReviewAlgorithm;
            registry.registerReviewAlgorithmFromPlugin(plugin, contribution, algorithm);
            console.log(`[PluginManager] Loaded review algorithm: ${contribution.name} from ${manifest.name}`);
          } else {
            console.warn(`[PluginManager] Review algorithm file not found: ${algorithmPath}`);
          }
        } catch (error) {
          console.error(`[PluginManager] Failed to load review algorithm ${contribution.id}:`, error);
        }
      }
    }

    // 加载 Diff 算法
    if (manifest.contributes?.diffAlgorithms) {
      for (const contribution of manifest.contributes.diffAlgorithms) {
        try {
          const algorithmPath = path.join(plugin.path, contribution.main);
          if (fs.existsSync(algorithmPath)) {
            // 清除缓存以确保重新加载
            delete require.cache[require.resolve(algorithmPath)];
            const algorithm = require(algorithmPath) as IDiffAlgorithm;
            registry.registerDiffAlgorithmFromPlugin(plugin, contribution, algorithm);
            console.log(`[PluginManager] Loaded diff algorithm: ${contribution.name} from ${manifest.name}`);
          } else {
            console.warn(`[PluginManager] Diff algorithm file not found: ${algorithmPath}`);
          }
        } catch (error) {
          console.error(`[PluginManager] Failed to load diff algorithm ${contribution.id}:`, error);
        }
      }
    }
  }
}
