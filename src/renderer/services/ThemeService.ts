/**
 * 主题服务
 * 阶段 8: 主题系统
 */

import type { Theme, ThemeColors, ThemeMetadata } from '@shared/types/theme';

/**
 * 主题服务接口
 */
export interface IThemeService {
  // 加载主题
  loadTheme(themeId: string): Promise<void>;
  
  // 获取主题
  getCurrentTheme(): Theme | null;
  getTheme(themeId: string): Theme | null;
  getAllThemes(): ThemeMetadata[];
  
  // 应用主题
  applyTheme(theme: Theme): void;
  
  // 自定义主题
  saveCustomTheme(theme: Theme): Promise<void>;
  deleteCustomTheme(themeId: string): Promise<void>;
  exportTheme(theme: Theme): string;
  importTheme(themeJson: string): Theme;
  
  // 监听主题变化
  onThemeChange(callback: (theme: Theme) => void): () => void;
}

/**
 * 主题服务实现
 */
export class ThemeService implements IThemeService {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme | null = null;
  private listeners: Array<(theme: Theme) => void> = [];
  private customThemes: Map<string, Theme> = new Map();
  
  constructor() {
    // 在构造函数中不初始化，等待外部调用 initialize
    this.loadCustomThemes();
  }
  
  /**
   * 初始化主题服务
   */
  async initialize(): Promise<void> {
    // 主题将由外部注册，这里不自动加载
  }
  
  /**
   * 注册主题
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }
  
  /**
   * 加载主题
   */
  async loadTheme(themeId: string): Promise<void> {
    let theme = this.themes.get(themeId);
    
    // 如果不是内置主题，尝试从自定义主题加载
    if (!theme) {
      theme = this.customThemes.get(themeId);
    }
    
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.notifyListeners(theme);
    
    // 保存主题选择
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.invoke('config:set', 'theme', themeId);
      } catch (error) {
        // Failed to save theme preference
      }
    }
  }
  
  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }
  
  /**
   * 获取指定主题
   */
  getTheme(themeId: string): Theme | null {
    return this.themes.get(themeId) || this.customThemes.get(themeId) || null;
  }
  
  /**
   * 获取所有主题元数据
   */
  getAllThemes(): ThemeMetadata[] {
    const builtinThemes = Array.from(this.themes.values()).map(theme => ({
      id: theme.id,
      name: theme.name,
      version: theme.version,
      author: theme.author,
      description: theme.description,
      type: theme.type,
      isBuiltin: true,
    }));
    
    const customThemesList = Array.from(this.customThemes.values()).map(theme => ({
      id: theme.id,
      name: theme.name,
      version: theme.version,
      author: theme.author,
      description: theme.description,
      type: theme.type,
      isBuiltin: false,
    }));
    
    return [...builtinThemes, ...customThemesList];
  }
  
  /**
   * 应用主题
   */
  applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // 应用颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--theme-${this.kebabCase(key)}`;
      root.style.setProperty(cssVarName, value);
    });
    
    // 应用字体变量
    if (theme.fonts) {
      root.style.setProperty('--theme-font-body', theme.fonts.body);
      root.style.setProperty('--theme-font-heading', theme.fonts.heading);
      root.style.setProperty('--theme-font-mono', theme.fonts.mono);
      
      if (theme.fonts.size) {
        Object.entries(theme.fonts.size).forEach(([key, value]) => {
          root.style.setProperty(`--theme-font-size-${key}`, value);
        });
      }
      
      if (theme.fonts.lineHeight) {
        Object.entries(theme.fonts.lineHeight).forEach(([key, value]) => {
          root.style.setProperty(`--theme-line-height-${key}`, value);
        });
      }
    }
    
    // 设置主题类型
    root.setAttribute('data-theme', theme.type);
    root.setAttribute('data-theme-id', theme.id);
  }
  
  /**
   * 监听主题变化
   */
  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.listeners.push(callback);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 通知监听器
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        // Listener error
      }
    });
  }
  
  /**
   * 将驼峰命名转为短横线命名
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  /**
   * 获取系统主题偏好
   */
  getSystemThemePreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  /**
   * 监听系统主题变化
   */
  watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
  
  /**
   * 加载自定义主题
   */
  private async loadCustomThemes(): Promise<void> {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    
    try {
      const customThemesData = await window.electronAPI.invoke('config:get', 'customThemes');
      if (customThemesData && Array.isArray(customThemesData)) {
        customThemesData.forEach((theme: Theme) => {
          this.customThemes.set(theme.id, theme);
        });
      }
    } catch (error) {
      // Failed to load custom themes
    }
  }
  
  /**
   * 保存自定义主题
   */
  async saveCustomTheme(theme: Theme): Promise<void> {
    this.customThemes.set(theme.id, theme);
    await this.persistCustomThemes();
  }
  
  /**
   * 删除自定义主题
   */
  async deleteCustomTheme(themeId: string): Promise<void> {
    this.customThemes.delete(themeId);
    await this.persistCustomThemes();
  }
  
  /**
   * 持久化自定义主题
   */
  private async persistCustomThemes(): Promise<void> {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    
    try {
      const themesArray = Array.from(this.customThemes.values());
      await window.electronAPI.invoke('config:set', 'customThemes', themesArray);
    } catch (error) {
      // Failed to persist custom themes
    }
  }
  
  /**
   * 导出主题
   */
  exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }
  
  /**
   * 导入主题
   */
  importTheme(themeJson: string): Theme {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      // 验证主题结构
      if (!theme.id || !theme.name || !theme.colors) {
        throw new Error('Invalid theme structure');
      }
      return theme;
    } catch (error) {
      throw new Error('Failed to import theme: Invalid JSON');
    }
  }
}

// 单例实例
let instance: ThemeService | null = null;

/**
 * 获取主题服务单例
 */
export function getThemeService(): ThemeService {
  if (!instance) {
    instance = new ThemeService();
  }
  return instance;
}


