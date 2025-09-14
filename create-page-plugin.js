const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 确保插件目录存在
const pluginDir = path.join(__dirname, 'plugins', 'example-page-plugin');
fs.mkdirSync(pluginDir, { recursive: true });

// 创建 manifest.json
const manifest = {
  "id": "example-page-plugin",
  "name": "示例页面插件",
  "version": "1.0.0",
  "description": "演示如何创建插件页面的示例插件",
  "author": "MemoryNote Team",
  "type": "page",
  "main": "index.js",
  "permissions": [
    "ui_modify",
    "settings_access"
  ],
  "minAppVersion": "1.0.0",
  "icon": "🏠",
  "pages": [
    {
      "id": "dashboard",
      "title": "插件仪表板",
      "icon": "<svg class='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'><path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'></path></svg>",
      "route": "/plugin/example-page-plugin-dashboard",
      "showInSidebar": true,
      "sidebarOrder": 10
    },
    {
      "id": "tools",
      "title": "插件工具",
      "icon": "<svg class='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'><path fill-rule='evenodd' d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' clip-rule='evenodd'></path></svg>",
      "route": "/plugin/example-page-plugin-tools",
      "showInSidebar": true,
      "sidebarOrder": 11
    }
  ]
};

fs.writeFileSync(path.join(pluginDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// 创建主入口文件
const mainCode = `
// 示例页面插件主文件
class ExamplePagePlugin {
  constructor() {
    this.api = null;
    this.isEnabled = false;
    this.dashboardComponent = null;
    this.toolsComponent = null;
  }

  async onLoad(api) {
    this.api = api;
    console.log('📄 示例页面插件加载完成');
    
    // 创建仪表板页面组件
    this.dashboardComponent = this.createDashboardComponent();
    
    // 创建工具页面组件
    this.toolsComponent = this.createToolsComponent();
  }

  async onEnable() {
    this.isEnabled = true;
    console.log('✅ 示例页面插件已启用');
    
    // 注册页面
    this.api.pages.register({
      id: 'dashboard',
      title: '插件仪表板',
      icon: "<svg class='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'><path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'></path></svg>",
      route: '/plugin/example-page-plugin-dashboard',
      showInSidebar: true,
      sidebarOrder: 10
    }, this.dashboardComponent);
    
    this.api.pages.register({
      id: 'tools',
      title: '插件工具',
      icon: "<svg class='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'><path fill-rule='evenodd' d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' clip-rule='evenodd'></path></svg>",
      route: '/plugin/example-page-plugin-tools',
      showInSidebar: true,
      sidebarOrder: 11
    }, this.toolsComponent);
  }

  async onDisable() {
    this.isEnabled = false;
    console.log('❌ 示例页面插件已禁用');
    
    // 取消注册页面
    this.api.pages.unregister('dashboard');
    this.api.pages.unregister('tools');
  }

  async onUnload() {
    this.api = null;
    console.log('🗑️ 示例页面插件已卸载');
  }

  // 创建仪表板组件
  createDashboardComponent() {
    return {
      name: 'PluginDashboard',
      template: \`
        <div class="plugin-dashboard p-6">
          <div class="max-w-6xl mx-auto">
            <!-- 头部 -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                🏠 插件仪表板
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                欢迎使用示例页面插件！这是一个演示如何创建插件页面的例子。
              </p>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span class="text-white font-semibold">📊</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">总页面访问</p>
                    <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ stats.pageViews }}</p>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span class="text-white font-semibold">⚡</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">插件状态</p>
                    <p class="text-2xl font-semibold text-green-600">{{ stats.status }}</p>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span class="text-white font-semibold">🔧</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">可用工具</p>
                    <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ stats.toolsCount }}</p>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span class="text-white font-semibold">⏱️</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">运行时间</p>
                    <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ stats.uptime }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 功能区域 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- 快速操作 -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  ⚡ 快速操作
                </h2>
                <div class="space-y-3">
                  <button 
                    @click="performAction('create')"
                    class="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                  >
                    <div class="font-medium text-blue-900 dark:text-blue-100">📝 创建新内容</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">创建新的笔记或文档</div>
                  </button>
                  
                  <button 
                    @click="performAction('import')"
                    class="w-full text-left p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                  >
                    <div class="font-medium text-green-900 dark:text-green-100">📥 导入数据</div>
                    <div class="text-sm text-green-700 dark:text-green-300">从外部源导入数据</div>
                  </button>
                  
                  <button 
                    @click="performAction('export')"
                    class="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                  >
                    <div class="font-medium text-purple-900 dark:text-purple-100">📤 导出数据</div>
                    <div class="text-sm text-purple-700 dark:text-purple-300">导出数据到外部格式</div>
                  </button>
                </div>
              </div>

              <!-- 最近活动 -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  📈 最近活动
                </h2>
                <div class="space-y-3">
                  <div v-for="activity in recentActivities" :key="activity.id" class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-sm">{{ activity.icon }}</span>
                    </div>
                    <div class="ml-3 flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ activity.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ activity.time }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      \`,
      data() {
        return {
          stats: {
            pageViews: 1234,
            status: '活跃',
            toolsCount: 8,
            uptime: '2天4小时'
          },
          recentActivities: [
            { id: 1, icon: '📝', title: '创建了新笔记', time: '5分钟前' },
            { id: 2, icon: '🔧', title: '使用了工具功能', time: '15分钟前' },
            { id: 3, icon: '📊', title: '查看了统计数据', time: '1小时前' },
            { id: 4, icon: '⚙️', title: '更新了设置', time: '2小时前' }
          ]
        };
      },
      methods: {
        performAction(type) {
          const actions = {
            create: '创建新内容',
            import: '导入数据',
            export: '导出数据'
          };
          this.api.workspace.showNotification(\`执行了操作：\${actions[type]}\`, 'success');
        }
      },
      props: ['api', 'config']
    };
  }

  // 创建工具组件
  createToolsComponent() {
    return {
      name: 'PluginTools',
      template: \`
        <div class="plugin-tools p-6">
          <div class="max-w-4xl mx-auto">
            <!-- 头部 -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                🔧 插件工具
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                这里展示了一些实用的工具和功能。
              </p>
            </div>

            <!-- 工具网格 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="tool in tools" :key="tool.id" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white text-lg">{{ tool.icon }}</span>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ tool.name }}</h3>
                  </div>
                </div>
                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ tool.description }}</p>
                <button 
                  @click="useTool(tool.id)"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  使用工具
                </button>
              </div>
            </div>

            <!-- 工具使用记录 -->
            <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">📊 使用记录</h2>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">工具</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">使用次数</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">最后使用</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="record in usageRecords" :key="record.toolId">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{{ record.toolName }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ record.count }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ record.lastUsed }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      \`,
      data() {
        return {
          tools: [
            { id: 'text-processor', name: '文本处理器', icon: '📝', description: '处理和格式化文本内容' },
            { id: 'data-converter', name: '数据转换器', icon: '🔄', description: '在不同数据格式之间转换' },
            { id: 'backup-manager', name: '备份管理器', icon: '💾', description: '管理数据备份和恢复' },
            { id: 'export-tool', name: '导出工具', icon: '📤', description: '将数据导出为各种格式' },
            { id: 'search-engine', name: '搜索引擎', icon: '🔍', description: '高级搜索和筛选功能' },
            { id: 'statistics', name: '统计分析', icon: '📊', description: '生成详细的统计报告' }
          ],
          usageRecords: [
            { toolId: 'text-processor', toolName: '文本处理器', count: 23, lastUsed: '2小时前' },
            { toolId: 'data-converter', toolName: '数据转换器', count: 15, lastUsed: '1天前' },
            { toolId: 'backup-manager', toolName: '备份管理器', count: 8, lastUsed: '3天前' },
            { toolId: 'export-tool', toolName: '导出工具', count: 12, lastUsed: '5小时前' }
          ]
        };
      },
      methods: {
        useTool(toolId) {
          const tool = this.tools.find(t => t.id === toolId);
          if (tool) {
            this.api.workspace.showNotification(\`使用了工具：\${tool.name}\`, 'info');
            
            // 更新使用记录
            const record = this.usageRecords.find(r => r.toolId === toolId);
            if (record) {
              record.count++;
              record.lastUsed = '刚刚';
            } else {
              this.usageRecords.unshift({
                toolId,
                toolName: tool.name,
                count: 1,
                lastUsed: '刚刚'
              });
            }
          }
        }
      },
      props: ['api', 'config']
    };
  }

  // 获取设置配置
  getSettings() {
    return [
      {
        key: 'showWelcomeMessage',
        label: '显示欢迎消息',
        type: 'boolean',
        default: true,
        description: '在页面加载时显示欢迎消息'
      },
      {
        key: 'defaultPage',
        label: '默认页面',
        type: 'select',
        default: 'dashboard',
        options: [
          { label: '仪表板', value: 'dashboard' },
          { label: '工具', value: 'tools' }
        ],
        description: '插件激活时显示的默认页面'
      },
      {
        key: 'refreshInterval',
        label: '刷新间隔(秒)',
        type: 'range',
        default: 30,
        min: 10,
        max: 300,
        step: 10,
        description: '数据自动刷新的时间间隔'
      }
    ];
  }

  // 设置变更处理
  onSettingChange(key, value) {
    console.log(\`设置已更改: \${key} = \${value}\`);
    
    if (key === 'showWelcomeMessage' && value) {
      this.api.workspace.showNotification('欢迎使用示例页面插件！', 'info');
    }
  }
}

// 导出插件类
module.exports = ExamplePagePlugin;
`;

fs.writeFileSync(path.join(pluginDir, 'index.js'), mainCode);

// 创建 ZIP 文件
const zipFilePath = path.join(__dirname, 'example-page-plugin.zip');
const output = fs.createWriteStream(zipFilePath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('✅ 示例页面插件创建完成！');
  console.log(`📦 插件包大小: ${archive.pointer()} bytes`);
  console.log(`📁 插件包位置: ${zipFilePath}`);
  console.log('');
  console.log('📋 插件包含以下功能:');
  console.log('  🏠 仪表板页面 - 显示统计信息和快速操作');
  console.log('  🔧 工具页面 - 展示各种实用工具');
  console.log('  ⚙️ 设置选项 - 可配置的插件行为');
  console.log('  🎨 响应式设计 - 支持明暗主题');
  console.log('');
  console.log('🚀 安装方式:');
  console.log('  1. 打开 MemoryNote 应用');
  console.log('  2. 进入插件管理页面');
  console.log('  3. 点击"安装插件"');
  console.log('  4. 选择"ZIP文件安装"');
  console.log(`  5. 选择文件: ${zipFilePath}`);
  console.log('  6. 启用插件后即可在侧边栏看到新的页面图标');
});

archive.on('error', (err) => {
  console.error('❌ 创建插件包失败:', err);
});

archive.pipe(output);
archive.directory(pluginDir, false);
archive.finalize();
