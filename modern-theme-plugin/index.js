
class ModernThemePlugin {
  constructor() {
    this.themes = {
      'nord-dark': {
        name: 'Nord 深色',
        type: 'dark',
        colors: {
          primary: '#5E81AC',
          secondary: '#81A1C1',
          accent: '#88C0D0',
          background: '#2E3440',
          surface: '#3B4252',
          text: '#ECEFF4'
        }
      },
      'github-light': {
        name: 'GitHub 浅色',
        type: 'light',
        colors: {
          primary: '#0366d6',
          secondary: '#586069',
          accent: '#28a745',
          background: '#ffffff',
          surface: '#f6f8fa',
          text: '#24292e'
        }
      },
      'dracula': {
        name: 'Dracula',
        type: 'dark',
        colors: {
          primary: '#bd93f9',
          secondary: '#ff79c6',
          accent: '#50fa7b',
          background: '#282a36',
          surface: '#44475a',
          text: '#f8f8f2'
        }
      },
      'material-ocean': {
        name: 'Material Ocean',
        type: 'dark',
        colors: {
          primary: '#82aaff',
          secondary: '#c792ea',
          accent: '#84ffff',
          background: '#0f111a',
          surface: '#1e2030',
          text: '#a6accd'
        }
      }
    };
    
    this.currentTheme = 'nord-dark';
    this.api = null;
    this.settings = {
      selectedTheme: 'nord-dark',
      autoSwitchTime: false,
      lightThemeTime: '06:00',
      darkThemeTime: '18:00',
      customColors: {},
      enableAnimations: true,
      borderRadius: 'medium'
    };
  }

  // 必需的设置方法
  getSettings() {
    return [
      {
        key: 'selectedTheme',
        name: '当前主题',
        description: '选择要应用的主题',
        type: 'select',
        value: this.settings.selectedTheme,
        options: Object.keys(this.themes).map(key => ({
          value: key,
          label: this.themes[key].name
        }))
      },
      {
        key: 'autoSwitchTime',
        name: '自动切换主题',
        description: '根据时间自动在浅色和深色主题间切换',
        type: 'boolean',
        value: this.settings.autoSwitchTime
      },
      {
        key: 'lightThemeTime',
        name: '浅色主题时间',
        description: '切换到浅色主题的时间',
        type: 'time',
        value: this.settings.lightThemeTime,
        condition: 'autoSwitchTime'
      },
      {
        key: 'darkThemeTime',
        name: '深色主题时间',
        description: '切换到深色主题的时间',
        type: 'time',
        value: this.settings.darkThemeTime,
        condition: 'autoSwitchTime'
      },
      {
        key: 'enableAnimations',
        name: '启用动画效果',
        description: '主题切换时显示过渡动画',
        type: 'boolean',
        value: this.settings.enableAnimations
      },
      {
        key: 'borderRadius',
        name: '圆角大小',
        description: '界面元素的圆角程度',
        type: 'select',
        value: this.settings.borderRadius,
        options: [
          { value: 'none', label: '无圆角' },
          { value: 'small', label: '小圆角' },
          { value: 'medium', label: '中等圆角' },
          { value: 'large', label: '大圆角' }
        ]
      }
    ];
  }

  getSettingsTitle() {
    return '主题设置';
  }

  onSettingChange(key, value) {
    console.log(`🎨 [现代主题] 设置更改: ${key} = ${value}`);
    this.settings[key] = value;
    
    // 保存设置
    if (this.api && this.api.storage) {
      this.api.storage.setItem('modern-theme-settings', JSON.stringify(this.settings));
    }
    
    // 应用更改
    switch (key) {
      case 'selectedTheme':
        this.applyTheme(value);
        break;
      case 'autoSwitchTime':
        if (value) {
          this.startAutoSwitch();
        } else {
          this.stopAutoSwitch();
        }
        break;
      case 'enableAnimations':
        this.updateAnimationSettings(value);
        break;
      case 'borderRadius':
        this.updateBorderRadius(value);
        break;
    }
  }

  async onLoad(api) {
    this.api = api;
    console.log('🎨 [现代主题] 插件加载');
    
    // 加载保存的设置
    await this.loadSettings();
  }

  async onEnable() {
    console.log('🎨 [现代主题] 插件启用');
    
    // 注册侧边栏按钮
    this.registerSidebarButton();
    
    // 注册主题
    this.registerThemes();
    
    // 应用当前主题
    this.applyTheme(this.settings.selectedTheme);
    
    // 启动自动切换（如果启用）
    if (this.settings.autoSwitchTime) {
      this.startAutoSwitch();
    }
    
    // 挂载主题面板到右侧边栏
    this.mountThemePanel();
  }

  async onUnload() {
    console.log('🎨 [现代主题] 插件卸载');
    
    // 停止自动切换
    this.stopAutoSwitch();
    
    // 重置为默认主题
    this.resetToDefaultTheme();
    
    // 清理注册的组件和样式
    if (this.api) {
      this.api.mount.unregisterAll();
    }
  }

  async onDisable() {
    console.log('🎨 [现代主题] 插件禁用');
    
    // 停止自动切换
    this.stopAutoSwitch();
    
    // 重置为默认主题
    this.resetToDefaultTheme();
    
    // 注销侧边栏按钮
    if (this.api && this.api.sidebar) {
      this.api.sidebar.unregisterButton();
    }
  }

  async loadSettings() {
    if (this.api && this.api.storage) {
      try {
        const saved = await this.api.storage.getItem('modern-theme-settings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch (error) {
        console.warn('🎨 [现代主题] 加载设置失败:', error);
      }
    }
  }

  registerSidebarButton() {
    if (this.api && this.api.sidebar) {
      this.api.sidebar.registerButton({
        id: 'theme-switcher',
        title: '快速切换主题',
        icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h2v11H4V4zm6-2a2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2h-2zm0 2h2v11h-2V4zm6-2a2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2h-2zm0 2h2v11h-2V4z" clip-rule="evenodd"/></svg>',
        position: 'top',
        onClick: () => {
          this.showQuickThemeSwitcher();
        }
      });
    }
  }

  registerThemes() {
    if (this.api && this.api.editor && this.api.editor.registerTheme) {
      Object.keys(this.themes).forEach(themeId => {
        const theme = this.themes[themeId];
        this.api.editor.registerTheme(themeId, {
          name: theme.name,
          type: theme.type,
          colors: theme.colors,
          css: this.generateThemeCSS(theme)
        });
      });
    }
  }

  mountThemePanel() {
    if (this.api && this.api.mount) {
      const themePanelComponent = {
        name: 'ThemePanel',
        template: `
          <div class="theme-panel p-4">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">主题面板</h3>
            
            <!-- 快速主题切换 -->
            <div class="mb-6">
              <h4 class="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">快速切换</h4>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="(theme, key) in themes"
                  :key="key"
                  @click="switchTheme(key)"
                  class="p-3 rounded-lg border-2 transition-all duration-200"
                  :class="{
                    'border-primary-500 bg-primary-50 dark:bg-primary-900/20': currentTheme === key,
                    'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500': currentTheme !== key
                  }"
                >
                  <div class="flex items-center space-x-2">
                    <div 
                      class="w-4 h-4 rounded-full"
                      :style="{ backgroundColor: theme.colors.primary }"
                    ></div>
                    <span class="text-xs font-medium">{{ theme.name }}</span>
                  </div>
                </button>
              </div>
            </div>
            
            <!-- 主题预览 -->
            <div class="mb-6">
              <h4 class="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">当前主题预览</h4>
              <div class="p-4 rounded-lg" :style="getPreviewStyle()">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium">{{ currentThemeName }}</span>
                  <span class="text-xs opacity-75">{{ currentThemeType }}</span>
                </div>
                <div class="flex space-x-2">
                  <div 
                    v-for="(color, name) in currentThemeColors" 
                    :key="name"
                    class="w-6 h-6 rounded"
                    :style="{ backgroundColor: color }"
                    :title="name"
                  ></div>
                </div>
              </div>
            </div>
            
            <!-- 自动切换状态 -->
            <div v-if="autoSwitchEnabled" class="text-xs text-gray-600 dark:text-gray-400">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span>自动切换已启用</span>
              </div>
            </div>
          </div>
        `,
        data() {
          return {
            themes: this.themes,
            currentTheme: this.currentTheme,
            autoSwitchEnabled: this.settings.autoSwitchTime
          };
        },
        computed: {
          currentThemeName() {
            return this.themes[this.currentTheme]?.name || '未知主题';
          },
          currentThemeType() {
            return this.themes[this.currentTheme]?.type === 'dark' ? '深色' : '浅色';
          },
          currentThemeColors() {
            return this.themes[this.currentTheme]?.colors || {};
          }
        },
        methods: {
          switchTheme(themeKey) {
            this.currentTheme = themeKey;
            this.applyTheme(themeKey);
            this.onSettingChange('selectedTheme', themeKey);
          },
          getPreviewStyle() {
            const theme = this.themes[this.currentTheme];
            if (!theme) return {};
            
            return {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.primary}`
            };
          },
          applyTheme: this.applyTheme.bind(this)
        }
      };
      
      this.api.mount.registerComponent('right_sidebar', 'theme-panel', themePanelComponent);
    }
  }

  applyTheme(themeKey) {
    const theme = this.themes[themeKey];
    if (!theme) {
      console.warn(`🎨 [现代主题] 主题不存在: ${themeKey}`);
      return;
    }

    console.log(`🎨 [现代主题] 应用主题: ${theme.name}`);
    this.currentTheme = themeKey;

    // 生成并应用CSS变量
    const cssVars = this.generateCSSVariables(theme);
    this.applyCSSVariables(cssVars);
    
    // 应用主题类
    this.applyThemeClass(theme.type);
    
    // 触发主题更改事件
    if (this.api && this.api.events) {
      this.api.events.emit('theme:changed', {
        theme: themeKey,
        colors: theme.colors,
        type: theme.type
      });
    }
  }

  generateCSSVariables(theme) {
    return {
      '--theme-primary': theme.colors.primary,
      '--theme-secondary': theme.colors.secondary,
      '--theme-accent': theme.colors.accent,
      '--theme-background': theme.colors.background,
      '--theme-surface': theme.colors.surface,
      '--theme-text': theme.colors.text,
      '--theme-border-radius': this.getBorderRadiusValue()
    };
  }

  applyCSSVariables(vars) {
    const root = document.documentElement;
    Object.keys(vars).forEach(key => {
      root.style.setProperty(key, vars[key]);
    });
  }

  applyThemeClass(type) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${type}`);
  }

  getBorderRadiusValue() {
    const radiusMap = {
      'none': '0px',
      'small': '4px',
      'medium': '8px',
      'large': '12px'
    };
    return radiusMap[this.settings.borderRadius] || '8px';
  }

  generateThemeCSS(theme) {
    return `
      .theme-${theme.type.replace(' ', '-')} {
        --primary-color: ${theme.colors.primary};
        --secondary-color: ${theme.colors.secondary};
        --accent-color: ${theme.colors.accent};
        --background-color: ${theme.colors.background};
        --surface-color: ${theme.colors.surface};
        --text-color: ${theme.colors.text};
      }
    `;
  }

  showQuickThemeSwitcher() {
    // 显示快速主题切换器（可以是下拉菜单或模态框）
    console.log('🎨 [现代主题] 显示快速主题切换器');
    
    if (this.api && this.api.ui && this.api.ui.showContextMenu) {
      const themeOptions = Object.keys(this.themes).map(key => ({
        label: this.themes[key].name,
        icon: '<div class="w-3 h-3 rounded-full" style="background-color: ' + this.themes[key].colors.primary + '"></div>',
        onClick: () => {
          this.applyTheme(key);
          this.onSettingChange('selectedTheme', key);
        }
      }));
      
      this.api.ui.showContextMenu(themeOptions);
    }
  }

  startAutoSwitch() {
    this.stopAutoSwitch(); // 确保没有重复的定时器
    
    const checkTime = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const lightTime = this.parseTime(this.settings.lightThemeTime);
      const darkTime = this.parseTime(this.settings.darkThemeTime);
      
      let shouldUseDarkTheme;
      if (lightTime < darkTime) {
        shouldUseDarkTheme = currentTime >= darkTime || currentTime < lightTime;
      } else {
        shouldUseDarkTheme = currentTime >= darkTime && currentTime < lightTime;
      }
      
      const targetTheme = shouldUseDarkTheme ? 
        this.findThemeByType('dark') : 
        this.findThemeByType('light');
      
      if (targetTheme && this.currentTheme !== targetTheme) {
        console.log(`🎨 [现代主题] 自动切换到: ${this.themes[targetTheme].name}`);
        this.applyTheme(targetTheme);
        this.settings.selectedTheme = targetTheme;
      }
    };
    
    // 立即检查一次
    checkTime();
    
    // 每分钟检查一次
    this.autoSwitchTimer = setInterval(checkTime, 60000);
    console.log('🎨 [现代主题] 自动切换已启动');
  }

  stopAutoSwitch() {
    if (this.autoSwitchTimer) {
      clearInterval(this.autoSwitchTimer);
      this.autoSwitchTimer = null;
      console.log('🎨 [现代主题] 自动切换已停止');
    }
  }

  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  findThemeByType(type) {
    return Object.keys(this.themes).find(key => this.themes[key].type === type);
  }

  updateAnimationSettings(enabled) {
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty('--theme-transition-duration', '0.3s');
    } else {
      root.style.setProperty('--theme-transition-duration', '0s');
    }
  }

  updateBorderRadius(radius) {
    const root = document.documentElement;
    root.style.setProperty('--theme-border-radius', this.getBorderRadiusValue());
  }

  resetToDefaultTheme() {
    // 重置为系统默认主题
    const root = document.documentElement;
    const body = document.body;
    
    // 移除所有主题相关的CSS变量和类
    body.classList.remove('theme-light', 'theme-dark');
    
    // 清除CSS变量
    const varsToRemove = [
      '--theme-primary', '--theme-secondary', '--theme-accent',
      '--theme-background', '--theme-surface', '--theme-text',
      '--theme-border-radius', '--theme-transition-duration'
    ];
    
    varsToRemove.forEach(varName => {
      root.style.removeProperty(varName);
    });
    
    console.log('🎨 [现代主题] 已重置为默认主题');
  }
}

// 导出插件类 - 使用 CommonJS 格式
module.exports = ModernThemePlugin;
