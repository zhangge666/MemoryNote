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
  background: var(--color-background);
}

.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}

.settings-nav {
  padding: 1rem 0.5rem;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text);
  text-align: left;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.settings-nav-item:hover {
  background: var(--color-hover);
}

.settings-nav-item.active {
  background: var(--color-primary);
  color: white;
}

.settings-nav-icon {
  font-size: 1.25rem;
}

.settings-nav-text {
  font-size: 0.875rem;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.settings-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.settings-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.settings-body {
  flex: 1;
  padding: 2rem;
}

.settings-section {
  max-width: 600px;
}
</style>