# MemoryNote 插件系统示例

## 主题切换插件示例

### 插件文件结构
```
plugins/
  theme-switcher/
    ├── manifest.json
    ├── main.js
    ├── styles.css
    └── themes/
        ├── dark-theme.css
        ├── light-theme.css
        └── nord-theme.css
```

### manifest.json
```json
{
  "id": "theme-switcher",
  "name": "主题切换器",
  "version": "1.0.0",
  "description": "允许用户在多个主题之间切换",
  "author": "MemoryNote Team",
  "main": "main.js",
  "permissions": ["ui_modify", "settings_access"],
  "dependencies": [],
  "minAppVersion": "1.0.0"
}
```

### main.js
```javascript
class ThemeSwitcherPlugin {
  constructor() {
    this.id = 'theme-switcher';
    this.themes = [
      {
        id: 'dark',
        name: '深色主题',
        cssFile: 'themes/dark-theme.css'
      },
      {
        id: 'light', 
        name: '浅色主题',
        cssFile: 'themes/light-theme.css'
      },
      {
        id: 'nord',
        name: 'Nord主题',
        cssFile: 'themes/nord-theme.css'
      }
    ];
  }

  onLoad() {
    // 注册命令
    this.addCommand({
      id: 'switch-theme',
      name: '切换主题',
      callback: () => this.showThemeSelector()
    });

    // 添加状态栏按钮
    this.addStatusBarItem({
      text: '主题',
      tooltip: '切换主题',
      onClick: () => this.showThemeSelector()
    });

    // 添加设置页面
    this.addSettingTab(new ThemeSettingTab(this.app, this));
  }

  onUnload() {
    this.removeStatusBarItem();
    this.removeSettingTab();
  }

  showThemeSelector() {
    const modal = new ThemeModal(this.app, this.themes, (theme) => {
      this.applyTheme(theme);
    });
    modal.open();
  }

  applyTheme(theme) {
    // 移除当前主题
    document.querySelectorAll('link[data-theme]').forEach(link => {
      link.remove();
    });

    // 应用新主题
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/plugins/theme-switcher/${theme.cssFile}`;
    link.setAttribute('data-theme', theme.id);
    document.head.appendChild(link);

    // 保存用户选择
    this.saveSettings({ currentTheme: theme.id });
  }
}

// 导出插件
module.exports = ThemeSwitcherPlugin;
```

### themes/dark-theme.css
```css
:root {
  --primary-color: #bb9af7;
  --background-color: #1a1b26;
  --surface-color: #24283b;
  --text-color: #c0caf5;
  --text-muted: #9aa5ce;
  --border-color: #414868;
  --accent-color: #7aa2f7;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
}

.file-panel, .sidebar {
  background-color: var(--surface-color);
  border-color: var(--border-color);
}

.markdown-editor {
  background-color: var(--background-color);
  color: var(--text-color);
}
```

## 快捷键插件示例

### 文件跳转插件
```javascript
class QuickSwitcherPlugin {
  onLoad() {
    // 注册快捷键
    this.addCommand({
      id: 'quick-switcher',
      name: '快速切换文件',
      hotkey: 'Ctrl+P',
      callback: () => this.openQuickSwitcher()
    });
  }

  openQuickSwitcher() {
    const modal = new QuickSwitcherModal(this.app);
    modal.open();
  }
}
```

## UI组件插件示例

### 侧边栏插件
```javascript
class SidebarPlugin {
  onLoad() {
    // 添加侧边栏面板
    this.addRibbonIcon('calendar', '日历视图', () => {
      this.activateView('calendar-view');
    });

    // 注册视图
    this.registerView('calendar-view', (leaf) => {
      return new CalendarView(leaf);
    });
  }
}

class CalendarView {
  constructor(leaf) {
    this.leaf = leaf;
  }

  getViewType() {
    return 'calendar-view';
  }

  getDisplayText() {
    return '日历';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h2', { text: '日历视图' });
    
    // 渲染日历组件
    this.renderCalendar(container);
  }
}
```

## 插件开发建议

1. **从简单开始**: 先实现主题切换，再逐步添加复杂功能
2. **模块化设计**: 每个功能独立成插件，便于维护
3. **API稳定性**: 设计稳定的插件API，避免频繁破坏性更新
4. **文档完善**: 提供详细的插件开发文档和示例
5. **社区建设**: 鼓励用户贡献插件，建立插件生态

## 技术栈选择

- **插件加载**: Dynamic imports + Module Federation
- **权限管理**: 基于白名单的API访问控制
- **主题系统**: CSS Variables + 动态样式注入
- **组件系统**: Vue 3 动态组件
- **配置管理**: JSON配置 + 响应式存储


