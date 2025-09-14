# MemoryNote 插件开发指南

## 🚀 快速开始

MemoryNote 提供了强大的插件系统，允许开发者扩展应用功能。本指南将帮助您快速上手插件开发。

## 📋 插件基础结构

### 插件目录结构
```
plugins/
  your-plugin-name/
    ├── manifest.json      # 插件清单文件（必需）
    ├── index.js          # 主入口文件（必需）
    ├── styles.css        # 样式文件（可选）
    ├── icon.svg          # 插件图标（可选）
    └── themes/           # 主题文件目录（主题插件）
        ├── dark.css
        └── light.css
```

### 插件清单文件 (manifest.json)
```json
{
  "id": "your-plugin-id",
  "name": "Your Plugin Name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Your Name",
  "type": "theme|command|ui|editor|utility",
  "main": "index.js",
  "permissions": [
    "read_files",
    "write_files",
    "ui_modify",
    "settings_access",
    "command_register",
    "theme_modify",
    "shortcut_register"
  ],
  "dependencies": [],
  "minAppVersion": "1.0.0",
  "icon": "icon.svg",
  "homepage": "https://your-website.com",
  "keywords": ["tag1", "tag2"]
}
```

## 🔧 插件类型

### 1. 主题插件 (Theme Plugin)
主题插件用于提供新的外观样式。

```javascript
class MyThemePlugin {
  constructor() {
    this.manifest = { /* manifest info */ };
    this.themes = [
      {
        id: 'my-dark-theme',
        name: '我的暗色主题',
        description: '一个漂亮的暗色主题',
        variables: {
          'primary-color': '#007acc',
          'background-color': '#1e1e1e',
          'text-color': '#ffffff',
          // 更多 CSS 变量...
        },
        isDark: true
      }
    ];
  }

  async onLoad(api) {
    // 注册主题
    this.themes.forEach(theme => {
      api.themes.register(theme);
    });
  }

  async onUnload() {
    // 清理资源
  }
}
```

### 2. 命令插件 (Command Plugin)
命令插件用于添加新的功能命令。

```javascript
class MyCommandPlugin {
  async onLoad(api) {
    // 注册命令
    api.commands.register({
      id: 'my-plugin:hello-world',
      name: '打招呼',
      description: '显示一个问候消息',
      callback: () => {
        api.workspace.showNotification('Hello, World!', 'info');
      }
    });

    // 注册快捷键
    api.shortcuts.register({
      key: 'Ctrl+Shift+H',
      commandId: 'my-plugin:hello-world',
      description: '快速打招呼'
    });
  }
}
```

### 3. UI插件 (UI Plugin)
UI插件用于添加自定义界面组件。

```javascript
class MyUIPlugin {
  async onLoad(api) {
    // 注册UI组件
    api.ui.registerComponent({
      id: 'my-sidebar-panel',
      name: '我的侧边栏',
      component: MySidebarComponent, // Vue组件
      placement: 'sidebar'
    });
  }
}
```

## 🔌 Plugin API 参考

### 应用信息 (app)
```javascript
api.app.version    // 应用版本
api.app.name       // 应用名称
```

### 工作区操作 (workspace)
```javascript
// 获取当前文件
const file = await api.workspace.getCurrentFile();

// 打开文件
await api.workspace.openFile('/path/to/file.md');

// 创建文件
await api.workspace.createFile('/path/to/new-file.md', 'content');

// 显示通知
api.workspace.showNotification(message, type);
```

### 命令系统 (commands)
```javascript
// 注册命令
api.commands.register({
  id: 'plugin:command-id',
  name: '命令名称',
  description: '命令描述',
  callback: () => { /* 执行逻辑 */ }
});

// 执行命令
await api.commands.execute('plugin:command-id');

// 取消注册命令
api.commands.unregister('plugin:command-id');
```

### 快捷键系统 (shortcuts)
```javascript
// 注册快捷键
api.shortcuts.register({
  key: 'Ctrl+Shift+X',
  commandId: 'plugin:command-id',
  description: '快捷键描述'
});

// 取消注册快捷键
api.shortcuts.unregister('Ctrl+Shift+X');
```

### 主题系统 (themes)
```javascript
// 注册主题
api.themes.register({
  id: 'theme-id',
  name: '主题名称',
  variables: { /* CSS变量 */ },
  isDark: true
});

// 应用主题
api.themes.apply('theme-id');

// 获取当前主题
const current = api.themes.getCurrent();

// 取消注册主题
api.themes.unregister('theme-id');
```

### 设置系统 (settings)
```javascript
// 获取设置
const value = await api.settings.get('key', defaultValue);

// 保存设置
await api.settings.set('key', value);

// 注册设置页面
api.settings.registerSection([
  {
    key: 'my-setting',
    label: '我的设置',
    type: 'boolean',
    default: true,
    description: '设置描述'
  }
]);
```

### 事件系统 (events)
```javascript
// 监听事件
api.events.on('file-opened', (file) => {
  console.log('文件已打开:', file.path);
});

// 发送事件
api.events.emit('my-custom-event', data);

// 移除监听
api.events.off('file-opened', handler);
```

## 📝 插件生命周期

### 生命周期方法
```javascript
class MyPlugin {
  // 插件加载时调用
  async onLoad(api) {
    console.log('插件加载');
    this.api = api;
    // 注册资源...
  }

  // 插件卸载时调用
  async onUnload() {
    console.log('插件卸载');
    // 清理资源...
  }

  // 插件启用时调用（可选）
  async onEnable() {
    console.log('插件启用');
  }

  // 插件禁用时调用（可选）
  async onDisable() {
    console.log('插件禁用');
  }

  // 插件设置变更时调用（可选）
  async onSettingChange(key, value) {
    console.log(`设置变更: ${key} = ${value}`);
  }
}
```

## 🛠️ 开发最佳实践

### 1. 错误处理
```javascript
async onLoad(api) {
  try {
    // 插件逻辑
    api.commands.register(/* ... */);
  } catch (error) {
    console.error('插件加载失败:', error);
    api.workspace.showNotification('插件加载失败', 'error');
  }
}
```

### 2. 资源清理
```javascript
async onUnload() {
  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer);
  }
  
  // 清理事件监听
  if (this.eventHandler) {
    api.events.off('event-name', this.eventHandler);
  }
  
  // 清理DOM元素
  if (this.element) {
    this.element.remove();
  }
}
```

### 3. 设置管理
```javascript
getSettings() {
  return [
    {
      key: 'enableFeature',
      label: '启用功能',
      type: 'boolean',
      default: true,
      description: '是否启用此功能'
    },
    {
      key: 'interval',
      label: '时间间隔',
      type: 'number',
      default: 5,
      description: '执行间隔（秒）'
    }
  ];
}
```

### 4. 权限使用
确保只申请必要的权限：

```json
{
  "permissions": [
    "ui_modify",        // 修改UI
    "command_register", // 注册命令
    "theme_modify"      // 修改主题
  ]
}
```

## 📦 插件分发

### 打包插件
1. 创建插件目录
2. 编写插件代码和清单文件
3. 打包为 ZIP 文件
4. 通过插件管理器安装

### 插件商店
未来将提供插件商店功能，支持：
- 在线浏览和搜索插件
- 一键安装和更新
- 用户评价和反馈
- 插件认证和安全检查

## 🔒 安全考虑

### 权限系统
插件只能使用清单文件中声明的权限：

```json
{
  "permissions": [
    "read_files",      // 读取文件
    "write_files",     // 写入文件
    "network_access",  // 网络访问
    "system_commands"  // 执行系统命令
  ]
}
```

### 沙箱环境
插件运行在受限环境中：
- 无法直接访问 Node.js API
- 文件访问限制在插件目录内
- 网络请求需要权限声明

## 🐛 调试和测试

### 开发工具
```javascript
// 在插件中使用 console.log 进行调试
console.log('调试信息:', data);

// 使用 try-catch 捕获错误
try {
  // 插件逻辑
} catch (error) {
  console.error('插件错误:', error);
}
```

### 热重载
开发时可以使用热重载功能：
1. 修改插件文件
2. 在插件管理器中重新加载插件
3. 测试新功能

## 📚 示例插件

查看 `plugins/example-themes/` 目录中的示例主题插件，了解完整的插件实现。

## 🤝 社区和支持

- 官方文档：https://memorynote.com/docs/plugins
- 社区论坛：https://community.memorynote.com
- GitHub 仓库：https://github.com/memorynote/plugins
- 问题反馈：https://github.com/memorynote/memorynote/issues

祝您插件开发愉快！🎉


