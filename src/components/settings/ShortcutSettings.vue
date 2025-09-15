<template>
  <div class="space-y-6">
    <!-- 快捷键管理 -->
    <div class="bg-white dark:bg-dark-800 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">快捷键设置</h3>
        <div class="flex items-center space-x-2">
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索快捷键..."
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
          />
          <button
            @click="resetAllShortcuts"
            class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            重置全部
          </button>
        </div>
      </div>
      
      <!-- 快捷键列表 -->
      <div class="space-y-4">
        <!-- 系统快捷键 -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">系统快捷键</h4>
          <div class="space-y-2">
            <div
              v-for="shortcut in filteredSystemShortcuts"
              :key="shortcut.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ shortcut.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ shortcut.description }}</div>
              </div>
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-1">
                  <kbd
                    v-for="key in parseShortcut(shortcut.key)"
                    :key="key"
                    class="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                  >
                    {{ key }}
                  </kbd>
                </div>
                <button
                  @click="editShortcut(shortcut)"
                  class="px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                >
                  编辑
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 插件快捷键 -->
        <div v-for="plugin in pluginsWithShortcuts" :key="plugin.id">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <div v-if="plugin.icon" v-html="plugin.icon" class="w-4 h-4 mr-2"></div>
            {{ plugin.name }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="shortcut in plugin.shortcuts"
              :key="shortcut.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ shortcut.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ shortcut.description }}</div>
              </div>
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-1">
                  <kbd
                    v-for="key in parseShortcut(shortcut.key)"
                    :key="key"
                    class="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                  >
                    {{ key }}
                  </kbd>
                </div>
                <button
                  @click="editShortcut(shortcut)"
                  class="px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                >
                  编辑
                </button>
                <button
                  @click="removeShortcut(shortcut)"
                  class="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredShortcuts.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p>没有找到匹配的快捷键</p>
        </div>
      </div>
    </div>
    
    <!-- 快捷键编辑对话框 -->
    <div v-if="editingShortcut" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-dark-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">编辑快捷键</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              命令名称
            </label>
            <input
              :value="editingShortcut.name"
              readonly
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              快捷键
            </label>
            <input
              v-model="newShortcutKey"
              type="text"
              placeholder="请按下快捷键组合..."
              @keydown="captureShortcut"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              支持 Ctrl、Alt、Shift 组合键
            </p>
          </div>
          
          <div v-if="shortcutConflict" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p class="text-sm text-red-600 dark:text-red-400">
              快捷键冲突：{{ shortcutConflict }}
            </p>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="cancelEditShortcut"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            取消
          </button>
          <button
            @click="saveShortcut"
            :disabled="!newShortcutKey || !!shortcutConflict"
            class="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePluginsStore } from '../../stores/plugins';
import type { Shortcut } from '../../plugins/types';

const pluginsStore = usePluginsStore();

// 搜索文本
const searchText = ref('');

// 快捷键数据
const systemShortcuts = ref<Shortcut[]>([]);
const pluginShortcuts = ref<Shortcut[]>([]);

// 编辑相关
const editingShortcut = ref<Shortcut | null>(null);
const newShortcutKey = ref('');
const shortcutConflict = ref('');

// 系统默认快捷键
const defaultSystemShortcuts: Shortcut[] = [
  {
    key: 'Ctrl+N',
    commandId: 'system:new-note',
    name: '新建笔记',
    description: '创建一个新的笔记文档'
  },
  {
    key: 'Ctrl+O',
    commandId: 'system:open-file',
    name: '打开文件',
    description: '打开现有的笔记文件'
  },
  {
    key: 'Ctrl+S',
    commandId: 'system:save-file',
    name: '保存文件',
    description: '保存当前编辑的文档'
  },
  {
    key: 'Ctrl+F',
    commandId: 'system:search',
    name: '搜索',
    description: '在当前文档中搜索内容'
  },
  {
    key: 'Ctrl+Shift+P',
    commandId: 'system:command-palette',
    name: '命令面板',
    description: '打开命令面板'
  },
  {
    key: 'Ctrl+,',
    commandId: 'system:settings',
    name: '设置',
    description: '打开应用设置'
  }
];

// 过滤后的系统快捷键
const filteredSystemShortcuts = computed(() => {
  if (!searchText.value) return systemShortcuts.value;
  const search = searchText.value.toLowerCase();
  return systemShortcuts.value.filter(shortcut =>
    shortcut.name.toLowerCase().includes(search) ||
    shortcut.description.toLowerCase().includes(search) ||
    shortcut.key.toLowerCase().includes(search)
  );
});

// 有快捷键的插件
const pluginsWithShortcuts = computed(() => {
  const plugins: Array<{
    id: string;
    name: string;
    icon?: string;
    shortcuts: Shortcut[];
  }> = [];
  
  pluginsStore.enabledPluginsList.forEach(plugin => {
    const shortcuts = pluginShortcuts.value.filter(s => s.commandId.startsWith(plugin.manifest.id + ':'));
    if (shortcuts.length > 0) {
      plugins.push({
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        icon: plugin.manifest.icon,
        shortcuts
      });
    }
  });
  
  if (!searchText.value) return plugins;
  
  const search = searchText.value.toLowerCase();
  return plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(search) ||
    plugin.shortcuts.some(s =>
      s.name.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search) ||
      s.key.toLowerCase().includes(search)
    )
  ).map(plugin => ({
    ...plugin,
    shortcuts: plugin.shortcuts.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search) ||
      s.key.toLowerCase().includes(search)
    )
  }));
});

// 所有过滤后的快捷键
const filteredShortcuts = computed(() => [
  ...filteredSystemShortcuts.value,
  ...pluginsWithShortcuts.value.flatMap(p => p.shortcuts)
]);

// 解析快捷键组合
function parseShortcut(key: string): string[] {
  return key.split('+').map(k => k.trim());
}

// 捕获快捷键输入
function captureShortcut(event: KeyboardEvent) {
  event.preventDefault();
  
  const keys: string[] = [];
  if (event.ctrlKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');
  if (event.metaKey) keys.push('Meta');
  
  const key = event.key;
  if (key !== 'Control' && key !== 'Alt' && key !== 'Shift' && key !== 'Meta') {
    keys.push(key.toUpperCase());
  }
  
  if (keys.length > 1) { // 至少有修饰键 + 一个普通键
    newShortcutKey.value = keys.join('+');
    checkShortcutConflict(newShortcutKey.value);
  }
}

// 检查快捷键冲突
function checkShortcutConflict(key: string) {
  const allShortcuts = [...systemShortcuts.value, ...pluginShortcuts.value];
  const conflicting = allShortcuts.find(s => s.key === key && s !== editingShortcut.value);
  
  if (conflicting) {
    shortcutConflict.value = conflicting.name;
  } else {
    shortcutConflict.value = '';
  }
}

// 编辑快捷键
function editShortcut(shortcut: Shortcut) {
  editingShortcut.value = shortcut;
  newShortcutKey.value = shortcut.key;
  shortcutConflict.value = '';
}

// 取消编辑
function cancelEditShortcut() {
  editingShortcut.value = null;
  newShortcutKey.value = '';
  shortcutConflict.value = '';
}

// 保存快捷键
function saveShortcut() {
  if (!editingShortcut.value || !newShortcutKey.value || shortcutConflict.value) return;
  
  const oldKey = editingShortcut.value.key;
  const newKey = newShortcutKey.value;
  
  // 更新快捷键
  if (pluginsStore.pluginManager) {
    const success = pluginsStore.pluginManager.updateShortcut(oldKey, newKey);
    if (success) {
      // 更新本地数据
      const shortcut = [...systemShortcuts.value, ...pluginShortcuts.value]
        .find(s => s === editingShortcut.value);
      if (shortcut) {
        shortcut.key = newKey;
      }
      
      console.log('快捷键更新成功:', oldKey, '->', newKey);
    } else {
      console.error('快捷键更新失败');
    }
  }
  
  cancelEditShortcut();
}

// 移除快捷键
function removeShortcut(shortcut: Shortcut) {
  if (confirm(`确定要移除快捷键 "${shortcut.name}" 吗？`)) {
    // 移除插件快捷键
    const index = pluginShortcuts.value.indexOf(shortcut);
    if (index > -1) {
      pluginShortcuts.value.splice(index, 1);
    }
    
    // 从插件管理器中移除
    if (pluginsStore.pluginManager) {
      // TODO: 实现移除快捷键的方法
      console.log('移除快捷键:', shortcut.key);
    }
  }
}

// 重置所有快捷键
function resetAllShortcuts() {
  if (confirm('确定要重置所有快捷键到默认设置吗？此操作不可撤销。')) {
    systemShortcuts.value = [...defaultSystemShortcuts];
    loadShortcuts();
    console.log('快捷键已重置');
  }
}

// 加载快捷键
function loadShortcuts() {
  // 加载系统快捷键
  try {
    const savedShortcuts = localStorage.getItem('system-shortcuts');
    if (savedShortcuts) {
      systemShortcuts.value = JSON.parse(savedShortcuts);
    } else {
      systemShortcuts.value = [...defaultSystemShortcuts];
    }
  } catch (error) {
    console.error('加载系统快捷键失败:', error);
    systemShortcuts.value = [...defaultSystemShortcuts];
  }
  
  // 加载插件快捷键
  if (pluginsStore.pluginManager) {
    pluginShortcuts.value = pluginsStore.pluginManager.getAllShortcuts();
  }
}

// 保存快捷键
function saveShortcuts() {
  try {
    localStorage.setItem('system-shortcuts', JSON.stringify(systemShortcuts.value));
    console.log('快捷键设置已保存');
  } catch (error) {
    console.error('保存快捷键设置失败:', error);
  }
}

// 重置快捷键
function resetShortcuts() {
  systemShortcuts.value = [...defaultSystemShortcuts];
  saveShortcuts();
}

onMounted(() => {
  loadShortcuts();
});

// 暴露方法给父组件
defineExpose({
  saveShortcuts,
  resetShortcuts
});
</script>


