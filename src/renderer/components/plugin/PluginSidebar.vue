<template>
  <div class="plugin-sidebar">
    <div class="plugin-sidebar-header">
      <span class="plugin-icon">{{ pluginView?.icon || '🧩' }}</span>
      <h3 class="plugin-title">{{ pluginView?.title || 'Plugin' }}</h3>
    </div>
    
    <div class="plugin-sidebar-content">
      <!-- Sample Sidebar Plugin 内容 -->
      <div v-if="pluginId === 'sample-sidebar-view'" class="sample-plugin-content">
        <div class="greeting-card">
          <p>{{ greeting }}</p>
          <span class="timestamp">{{ currentTime }}</span>
        </div>

        <div class="action-buttons">
          <button class="action-btn primary" @click="addItem">
            ➕ {{ t('plugins.addItem') || 'Add Item' }}
          </button>
          <button class="action-btn secondary" @click="clearItems">
            🗑️ {{ t('plugins.clearAll') || 'Clear All' }}
          </button>
        </div>

        <div class="items-section">
          <h4>{{ t('plugins.items') || 'Items' }} ({{ items.length }})</h4>
          <ul v-if="items.length > 0" class="items-list">
            <li v-for="(item, index) in items" :key="item.id" class="item">
              <span class="item-text">{{ item.text }}</span>
              <span class="item-time">{{ item.time }}</span>
              <button class="item-remove" @click="removeItem(index)">×</button>
            </li>
          </ul>
          <div v-else class="empty-state">
            <p>{{ t('plugins.noItems') || 'No items yet. Click "Add Item" to add one!' }}</p>
          </div>
        </div>
      </div>

      <!-- 通用插件占位符 -->
      <div v-else class="generic-plugin-content">
        <div class="plugin-placeholder">
          <span class="placeholder-icon">🧩</span>
          <p>{{ t('plugins.viewNotImplemented') || 'Plugin view content' }}</p>
        </div>
      </div>
    </div>

    <div class="plugin-sidebar-footer">
      <small>{{ pluginInfo?.manifest?.name }} v{{ pluginInfo?.manifest?.version }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePluginStore } from '@renderer/stores/plugin';
import type { PluginView, PluginInfo } from '@shared/types/plugin';

const props = defineProps<{
  viewId: string;
}>();

const { t } = useI18n();
const pluginStore = usePluginStore();

// 解析插件视图ID
const pluginId = computed(() => {
  // viewId 格式: plugin:sample-sidebar-view
  return props.viewId.replace('plugin:', '');
});

// 获取插件视图信息
const pluginView = computed<PluginView | null>(() => {
  for (const plugin of pluginStore.enabledPlugins) {
    if (plugin.manifest.contributes?.views) {
      for (const view of plugin.manifest.contributes.views) {
        if (view.id === pluginId.value) {
          return view;
        }
      }
    }
  }
  return null;
});

// 获取插件信息
const pluginInfo = computed<PluginInfo | null>(() => {
  for (const plugin of pluginStore.enabledPlugins) {
    if (plugin.manifest.contributes?.views) {
      for (const view of plugin.manifest.contributes.views) {
        if (view.id === pluginId.value) {
          return plugin;
        }
      }
    }
  }
  return null;
});

// Sample Plugin 相关状态
const greeting = ref('Hello from Sample Plugin!');
const currentTime = ref(new Date().toLocaleTimeString());
const items = ref<Array<{ id: number; text: string; time: string }>>([]);

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

// 添加项目
const addItem = () => {
  items.value.push({
    id: Date.now(),
    text: `Item ${items.value.length + 1}`,
    time: new Date().toLocaleTimeString(),
  });
};

// 移除项目
const removeItem = (index: number) => {
  items.value.splice(index, 1);
};

// 清除所有项目
const clearItems = () => {
  items.value = [];
};

// 定时更新时间
let timeInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  timeInterval = setInterval(updateTime, 1000);
});

// 清理
watch(() => props.viewId, () => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  timeInterval = setInterval(updateTime, 1000);
});
</script>

<style scoped>
.plugin-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
}

.plugin-sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.plugin-icon {
  font-size: 1.25rem;
}

.plugin-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.plugin-sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.plugin-sidebar-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.plugin-sidebar-footer small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

/* Sample Plugin 样式 */
.sample-plugin-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.greeting-card {
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.greeting-card p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.greeting-card .timestamp {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

.action-btn.secondary {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-btn.secondary:hover {
  background: var(--color-hover);
}

.items-section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
  background: var(--color-background);
  border-radius: 6px;
  transition: background 0.2s;
}

.item:hover {
  background: var(--color-hover);
}

.item-text {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--color-text);
}

.item-time {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin-right: 0.5rem;
}

.item-remove {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.item-remove:hover {
  background: var(--color-error, #ef4444);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-style: italic;
}

/* 通用插件占位符 */
.generic-plugin-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.plugin-placeholder {
  text-align: center;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}
</style>
