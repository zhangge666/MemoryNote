<template>
  <div class="settings-view">
    <div class="settings-sidebar">
      <div class="settings-nav">
        <button
          v-for="category in categories"
          :key="category.id"
          class="settings-nav-item"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          <span class="settings-nav-icon">{{ category.icon }}</span>
          <span class="settings-nav-text">{{ t(category.label) }}</span>
        </button>
      </div>
    </div>
    <div class="settings-content">
      <div class="settings-header">
        <h1>{{ t(currentCategory?.label || '') }}</h1>
      </div>
      <div class="settings-body">
        <component :is="getComponentForCategory(activeCategory)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import KeybindingSettings from '@renderer/components/settings/KeybindingSettings.vue';
import ThemeSettings from '@renderer/components/settings/ThemeSettings.vue';
import ReviewSettings from '@renderer/components/settings/ReviewSettings.vue';
import PluginSettings from '@renderer/components/settings/PluginSettings.vue';
import AISettings from '@renderer/components/settings/AISettings.vue';
import GeneralSettings from '@renderer/components/settings/GeneralSettings.vue';
import EditorSettings from '@renderer/components/settings/EditorSettings.vue';
import AboutSettings from '@renderer/components/settings/AboutSettings.vue';

const { t } = useI18n();
const activeCategory = ref('general');

const categories = [
  { id: 'general', icon: '🌐', label: 'settings.general.title' },
  { id: 'themes', icon: '🎨', label: 'settings.theme.title' },
  { id: 'editor', icon: '✏️', label: 'settings.editor.title' },
  { id: 'review', icon: '📚', label: 'settings.review.title' },
  { id: 'keybindings', icon: '⌨️', label: 'settings.keybindings.title' },
  { id: 'plugins', icon: '🧩', label: 'settings.plugin.title' },
  { id: 'ai', icon: '🤖', label: 'settings.ai.title' },
  { id: 'about', icon: 'ℹ️', label: 'settings.about.title' },
];

const currentCategory = computed(() => {
  return categories.find(c => c.id === activeCategory.value);
});

// Get the component for the current category
function getComponentForCategory(category: string) {
  switch (category) {
    case 'general':
      return GeneralSettings;
    case 'themes':
      return ThemeSettings;
    case 'editor':
      return EditorSettings;
    case 'review':
      return ReviewSettings;
    case 'keybindings':
      return KeybindingSettings;
    case 'plugins':
      return PluginSettings;
    case 'ai':
      return AISettings;
    case 'about':
      return AboutSettings;
    default:
      return 'div';
  }
}
</script>

<style scoped>
.settings-view {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--theme-background);
  color: var(--theme-text);
  overflow: hidden;
}

/* 侧边栏 - 玻璃拟态风格 */
.settings-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--theme-sidebar-background);
  border-right: 1px solid var(--theme-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  gap: var(--spacing-xs);
  backdrop-filter: blur(10px);
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--theme-text-secondary);
  text-align: left;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: var(--theme-font-size-sm);
  font-weight: 500;
}

.settings-nav-item:hover {
  background: var(--theme-background-hover);
  color: var(--theme-text);
}

.settings-nav-item.active {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  box-shadow: var(--shadow-sm);
}

.settings-nav-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.settings-nav-text {
  font-size: 0.9rem;
}

/* 内容区域 */
.settings-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--theme-background);
}

.settings-header {
  padding: 32px 40px 20px;
  border-bottom: 1px solid var(--theme-border-light);
  margin-bottom: 0;
  background: var(--theme-background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.settings-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text);
  letter-spacing: -0.5px;
}

.settings-body {
  flex: 1;
  padding: 32px 40px;
  max-width: 800px; /* 限制内容宽度，增加阅读体验 */
}

/* 滚动条美化 (如果未在全局生效) */
.settings-sidebar::-webkit-scrollbar {
  width: 4px;
}

.settings-content::-webkit-scrollbar {
  width: 8px;
}
</style>