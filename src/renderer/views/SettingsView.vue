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
        <!-- 通用设置 -->
        <div v-if="activeCategory === 'general'" class="settings-section">
          <div class="setting-item">
            <label class="setting-label">{{ t('settings.language') }}</label>
            <select class="setting-select">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div class="setting-item">
            <label class="setting-label">{{ t('settings.workspace') }}</label>
            <div class="workspace-input-group">
              <input 
                type="text" 
                class="setting-input workspace-input" 
                :value="workspacePath" 
                readonly 
                :title="workspacePath"
              />
              <AppButton 
                variant="primary"
                size="md"
                @click="selectWorkspace"
                :disabled="isChangingWorkspace"
                :loading="isChangingWorkspace"
              >
                {{ isChangingWorkspace ? t('settings.processing') : t('settings.browse') }}
              </AppButton>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">{{ t('settings.deleteConfirm') }}</label>
            <div class="setting-description">
              {{ t('settings.deleteConfirmDesc') }}
              <AppButton 
                variant="secondary"
                size="sm"
                class="reset-button"
                @click="resetDeleteConfirm"
                :disabled="!skipDeleteConfirm"
              >
                {{ skipDeleteConfirm ? t('settings.resetDeleteConfirm') : t('settings.deleteConfirmEnabled') }}
              </AppButton>
            </div>
          </div>
        </div>

        <!-- 主题设置 -->
        <ThemeSettings v-if="activeCategory === 'themes'" />

        <!-- 编辑器设置 -->
        <div v-else-if="activeCategory === 'editor'" class="settings-section">
          <div class="setting-item">
            <label class="setting-label">{{ t('settings.fontSize') }}</label>
            <input type="number" class="setting-input" value="14" min="10" max="24" />
          </div>
          <div class="setting-item">
            <label class="setting-label">{{ t('settings.lineHeight') }}</label>
            <input type="number" class="setting-input" value="1.6" min="1" max="3" step="0.1" />
          </div>
          <div class="setting-item">
            <label class="setting-label">{{ t('settings.autoSave') }}</label>
            <input type="checkbox" class="setting-checkbox" checked />
          </div>
        </div>

        <!-- 复习设置 -->
        <div v-else-if="activeCategory === 'review'" class="settings-section">
          <ReviewSettings />
        </div>

        <!-- 快捷键设置 -->
        <div v-else-if="activeCategory === 'keybindings'" class="settings-section">
          <KeybindingSettings />
        </div>

        <!-- 插件设置 -->
        <div v-else-if="activeCategory === 'plugins'" class="settings-section">
          <PluginSettings />
        </div>

        <!-- AI 设置 -->
        <div v-else-if="activeCategory === 'ai'" class="settings-section">
          <AISettings />
        </div>

        <!-- 关于 -->
        <div v-else-if="activeCategory === 'about'" class="settings-section">
          <div class="about-info">
            <div class="about-logo">📝</div>
            <h2>{{ t('app.name') }}</h2>
            <p class="about-version">Version 0.1.0</p>
            <p class="about-desc">{{ t('app.description') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import KeybindingSettings from '@renderer/components/settings/KeybindingSettings.vue';
import ThemeSettings from '@renderer/components/settings/ThemeSettings.vue';
import ReviewSettings from '@renderer/components/settings/ReviewSettings.vue';
import PluginSettings from '@renderer/components/settings/PluginSettings.vue';
import AISettings from '@renderer/components/settings/AISettings.vue';
import AppButton from '@renderer/components/common/AppButton.vue';

const { t } = useI18n();
const activeCategory = ref('general');

// 工作目录相关
const workspacePath = ref('');
const isChangingWorkspace = ref(false);

// 删除确认相关
const skipDeleteConfirm = ref(false);

const categories = [
  { id: 'general', icon: '🌐', label: 'settings.general' },
  { id: 'themes', icon: '🎨', label: 'settings.themes' },
  { id: 'editor', icon: '✏️', label: 'settings.editor' },
  { id: 'review', icon: '📚', label: 'settings.review.title' },
  { id: 'keybindings', icon: '⌨️', label: 'settings.keybindings' },
  { id: 'plugins', icon: '🧩', label: 'settings.plugins' },
  { id: 'ai', icon: '🤖', label: 'settings.ai.title' },
  { id: 'about', icon: 'ℹ️', label: 'settings.about' },
];

const currentCategory = computed(() => {
  return categories.find(c => c.id === activeCategory.value);
});

// 加载工作目录配置
const loadWorkspace = async () => {
  try {
    const response = await window.electronAPI.invoke<{ workspace?: string }>('config:get', 'app');
    if (response.success && response.data?.workspace) {
      workspacePath.value = response.data.workspace;
    }
  } catch (error) {
    console.error('Failed to load workspace config:', error);
  }
};

// 加载删除确认配置
const loadDeleteConfirmConfig = async () => {
  try {
    const response = await window.electronAPI.invoke<{ skipDeleteConfirm?: boolean }>('config:get', 'ui');
    if (response && response.success) {
      skipDeleteConfirm.value = response.data?.skipDeleteConfirm || false;
    }
  } catch (error) {
    console.error('Failed to load delete confirm config:', error);
  }
};

// 重置删除确认
const resetDeleteConfirm = async () => {
  try {
    const response = await window.electronAPI.invoke<{ skipDeleteConfirm?: boolean }>('config:get', 'ui');
    const uiConfig: { skipDeleteConfirm?: boolean } = (response && response.success) ? response.data || {} : {};
    uiConfig.skipDeleteConfirm = false;
    await window.electronAPI.invoke('config:set', 'ui', uiConfig);
    skipDeleteConfirm.value = false;
    
    await window.electronAPI.dialog.showMessage({
      type: 'info',
      title: t('common.tip'),
      message: t('common.deleteConfirmRestored'),
      buttons: [t('common.ok')],
    });
  } catch (error) {
    console.error('Failed to reset delete confirm:', error);
  }
};

// 选择工作目录
const selectWorkspace = async () => {
  try {
    const selectedPath = await window.electronAPI.dialog.selectDirectory({
      title: t('common.selectWorkspace'),
      defaultPath: workspacePath.value || undefined,
    });

    if (selectedPath) {
      // 检查是否与当前工作目录相同
      if (selectedPath === workspacePath.value) {
        await window.electronAPI.dialog.showMessage({
          type: 'info',
          title: t('common.tip'),
          message: t('common.sameAsCurrentWorkspace'),
          buttons: [t('common.ok')],
        });
        return;
      }

      isChangingWorkspace.value = true;
      
      // 显示确认对话框
      const response = await window.electronAPI.dialog.showMessage({
        type: 'question',
        title: t('common.changeWorkspace'),
        message: t('common.changeWorkspaceConfirm'),
        detail: `${t('common.currentWorkspace')}: ${workspacePath.value}\n${t('common.newWorkspace')}: ${selectedPath}\n\n${t('common.changeWorkspaceDetail')}`,
        buttons: [t('common.ok'), t('common.cancel')],
      });

      if (response.response === 0) {
        // 用户点击了"确定"
        try {
          // 调用热切换工作区
          await window.electronAPI.invoke('app:switch-workspace', selectedPath);
          
          // 更新显示的工作目录路径
          workspacePath.value = selectedPath;
          
          // 成功消息已经由 useWorkspace 中的通知显示了
        } catch (error) {
          console.error('Failed to switch workspace:', error);
          
          await window.electronAPI.dialog.showMessage({
            type: 'error',
            title: t('common.error'),
            message: t('common.switchWorkspaceFailed'),
            detail: error instanceof Error ? error.message : t('common.unknownError'),
            buttons: [t('common.ok')],
          });
        }
      }
      
      isChangingWorkspace.value = false;
    }
  } catch (error) {
    console.error('Failed to select workspace:', error);
    isChangingWorkspace.value = false;
  }
};

onMounted(() => {
  loadWorkspace();
  loadDeleteConfirmConfig();
});
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

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 0.9375rem;
  color: var(--color-text);
}

.setting-select,
.setting-input {
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  min-width: 200px;
}

.setting-select:focus,
.setting-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.setting-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* 工作目录输入组 */
.workspace-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.workspace-input {
  flex: 1;
  min-width: 0;
}

/* 重置按钮 */
.reset-button {
  margin-left: 0.5rem;
}

.setting-description {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.setting-description {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.about-info {
  text-align: center;
  padding: 2rem;
}

.about-logo {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.about-info h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.about-version {
  color: var(--color-text-secondary);
  margin: 0 0 1rem;
}

.about-desc {
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>


