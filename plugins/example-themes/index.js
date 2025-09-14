/**
 * 示例主题插件
 * 展示如何使用插件系统添加多个主题
 */

class ExampleThemesPlugin {
  constructor() {
    this.manifest = {
      id: 'example-themes',
      name: '示例主题包',
      version: '1.0.0',
      description: '包含多个精美主题的示例插件',
      author: 'MemoryNote Team',
      type: 'theme',
      main: 'index.js',
      permissions: ['theme_modify', 'ui_modify'],
      dependencies: [],
      minAppVersion: '1.0.0'
    };

    this.themes = [
      {
        id: 'nord-theme',
        name: 'Nord 主题',
        description: '基于 Nord 配色方案的清新主题',
        variables: {
          'primary-color': '#5E81AC',
          'primary-50': '#ECEFF4',
          'primary-100': '#E5E9F0',
          'primary-600': '#5E81AC',
          'primary-700': '#81A1C1',
          'background-color': '#2E3440',
          'surface-color': '#3B4252',
          'text-color': '#ECEFF4',
          'text-muted': '#D8DEE9',
          'border-color': '#434C5E',
          'accent-color': '#88C0D0'
        },
        isDark: true
      },
      {
        id: 'github-light',
        name: 'GitHub Light',
        description: '模仿 GitHub 的明亮主题',
        variables: {
          'primary-color': '#0969da',
          'primary-50': '#dbeafe',
          'primary-100': '#c2e0ff',
          'primary-600': '#0969da',
          'primary-700': '#0550ae',
          'background-color': '#ffffff',
          'surface-color': '#f6f8fa',
          'text-color': '#24292f',
          'text-muted': '#656d76',
          'border-color': '#d0d7de',
          'accent-color': '#0969da'
        },
        isDark: false
      },
      {
        id: 'dracula-theme',
        name: 'Dracula',
        description: '流行的 Dracula 暗色主题',
        variables: {
          'primary-color': '#bd93f9',
          'primary-50': '#f3f0ff',
          'primary-100': '#e9e2ff',
          'primary-600': '#bd93f9',
          'primary-700': '#a855f7',
          'background-color': '#282a36',
          'surface-color': '#44475a',
          'text-color': '#f8f8f2',
          'text-muted': '#6272a4',
          'border-color': '#6272a4',
          'accent-color': '#50fa7b'
        },
        isDark: true
      },
      {
        id: 'solarized-light',
        name: 'Solarized Light',
        description: '经典的 Solarized 明亮主题',
        variables: {
          'primary-color': '#268bd2',
          'primary-50': '#eef6ff',
          'primary-100': '#d1e7ff',
          'primary-600': '#268bd2',
          'primary-700': '#2563eb',
          'background-color': '#fdf6e3',
          'surface-color': '#eee8d5',
          'text-color': '#657b83',
          'text-muted': '#93a1a1',
          'border-color': '#93a1a1',
          'accent-color': '#859900'
        },
        isDark: false
      },
      {
        id: 'monokai-theme',
        name: 'Monokai',
        description: '受 Sublime Text 启发的 Monokai 主题',
        variables: {
          'primary-color': '#f92672',
          'primary-50': '#fef7f0',
          'primary-100': '#fdebe5',
          'primary-600': '#f92672',
          'primary-700': '#e11d48',
          'background-color': '#272822',
          'surface-color': '#383830',
          'text-color': '#f8f8f2',
          'text-muted': '#75715e',
          'border-color': '#49483e',
          'accent-color': '#a6e22e'
        },
        isDark: true
      }
    ];

    this.commands = [
      {
        id: 'example-themes:cycle-themes',
        name: '循环切换主题',
        description: '在所有可用主题间循环切换',
        shortcut: 'Ctrl+Shift+T',
        callback: () => this.cycleThemes()
      },
      {
        id: 'example-themes:toggle-dark-light',
        name: '切换深色/浅色主题',
        description: '在深色和浅色主题之间切换',
        shortcut: 'Ctrl+Shift+D',
        callback: () => this.toggleDarkLight()
      }
    ];

    this.api = null;
    this.currentThemeIndex = 0;
  }

  async onLoad(api) {
    console.log('🎨 加载示例主题插件');
    this.api = api;

    // 注册所有主题
    this.themes.forEach(theme => {
      api.themes.register(theme);
      console.log(`  ✅ 注册主题: ${theme.name}`);
    });

    // 注册命令
    this.commands.forEach(command => {
      api.commands.register(command);
      console.log(`  ✅ 注册命令: ${command.name}`);
    });

    // 注册快捷键
    this.commands.forEach(command => {
      if (command.shortcut) {
        api.shortcuts.register({
          key: command.shortcut,
          commandId: command.id,
          description: command.description
        });
        console.log(`  ✅ 注册快捷键: ${command.shortcut} -> ${command.name}`);
      }
    });

    // 显示欢迎通知
    api.workspace.showNotification(
      `🎨 ${this.themes.length} 个主题已就绪！使用 Ctrl+Shift+T 切换主题`,
      'success'
    );
  }

  async onUnload() {
    console.log('🎨 卸载示例主题插件');
    
    if (this.api) {
      // 清理注册的资源
      this.themes.forEach(theme => {
        this.api.themes.unregister(theme.id);
      });

      this.commands.forEach(command => {
        this.api.commands.unregister(command.id);
        if (command.shortcut) {
          this.api.shortcuts.unregister(command.shortcut);
        }
      });
    }
  }

  async onEnable() {
    console.log('🎨 启用示例主题插件');
    
    // 加载用户上次选择的主题
    try {
      const savedTheme = await this.api.settings.get('currentTheme', 'nord-theme');
      this.api.themes.apply(savedTheme);
      console.log(`  ✅ 应用保存的主题: ${savedTheme}`);
    } catch (error) {
      console.warn('加载保存的主题失败，使用默认主题:', error);
      this.api.themes.apply('nord-theme');
    }
  }

  async onDisable() {
    console.log('🎨 禁用示例主题插件');
    // 恢复到默认主题
    this.api.themes.apply('default');
  }

  cycleThemes() {
    if (!this.api) return;

    this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
    const theme = this.themes[this.currentThemeIndex];
    
    this.api.themes.apply(theme.id);
    this.api.workspace.showNotification(`🎨 切换到主题: ${theme.name}`, 'info');
    
    // 保存用户选择
    this.api.settings.set('currentTheme', theme.id);
    
    console.log(`切换到主题: ${theme.name}`);
  }

  toggleDarkLight() {
    if (!this.api) return;

    const currentTheme = this.api.themes.getCurrent();
    const currentThemeObj = this.themes.find(t => t.id === currentTheme);
    
    if (!currentThemeObj) {
      this.cycleThemes();
      return;
    }

    // 查找相反明暗度的主题
    const targetThemes = this.themes.filter(t => t.isDark !== currentThemeObj.isDark);
    
    if (targetThemes.length > 0) {
      const randomTheme = targetThemes[Math.floor(Math.random() * targetThemes.length)];
      this.api.themes.apply(randomTheme.id);
      this.api.workspace.showNotification(
        `🌓 切换到${randomTheme.isDark ? '深色' : '浅色'}主题: ${randomTheme.name}`,
        'info'
      );
      this.api.settings.set('currentTheme', randomTheme.id);
    }
  }

  // 插件设置配置
  getSettings() {
    return [
      {
        key: 'autoSwitchTime',
        label: '自动切换时间间隔',
        type: 'number',
        default: 0,
        description: '设置自动切换主题的时间间隔（分钟），0 表示禁用'
      },
      {
        key: 'preferredThemes',
        label: '偏好主题',
        type: 'select',
        default: 'all',
        options: [
          { label: '全部主题', value: 'all' },
          { label: '仅深色主题', value: 'dark' },
          { label: '仅浅色主题', value: 'light' }
        ],
        description: '选择在循环切换时包含的主题类型'
      },
      {
        key: 'showNotifications',
        label: '显示切换通知',
        type: 'boolean',
        default: true,
        description: '切换主题时是否显示通知'
      }
    ];
  }

  async onSettingChange(key, value) {
    console.log(`主题插件设置变更: ${key} = ${value}`);
    
    if (key === 'autoSwitchTime' && value > 0) {
      // 设置自动切换定时器
      this.setupAutoSwitch(value);
    } else if (key === 'autoSwitchTime' && value === 0) {
      // 清除自动切换
      this.clearAutoSwitch();
    }
  }

  setupAutoSwitch(minutes) {
    this.clearAutoSwitch();
    this.autoSwitchTimer = setInterval(() => {
      this.cycleThemes();
    }, minutes * 60 * 1000);
    
    console.log(`设置自动切换主题，间隔: ${minutes} 分钟`);
  }

  clearAutoSwitch() {
    if (this.autoSwitchTimer) {
      clearInterval(this.autoSwitchTimer);
      this.autoSwitchTimer = null;
      console.log('清除自动切换主题');
    }
  }
}

// 导出插件类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExampleThemesPlugin;
} else {
  window.ExampleThemesPlugin = ExampleThemesPlugin;
}


