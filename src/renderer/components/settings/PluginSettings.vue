<template>
  <div class="plugin-settings">
    <!-- 插件操作栏 -->
    <div class="plugin-actions">
      <AppButton 
        variant="primary" 
        @click="handleInstallPlugin"
        :disabled="isLoading"
      >
        <span class="action-icon">📦</span>
        {{ t('settings.plugin.installFromZip') }}
      </AppButton>
      <AppButton 
        variant="secondary" 
        @click="handleRefresh"
        :disabled="isLoading"
      >
        <span class="action-icon">🔄</span>
        {{ t('common.refresh') }}
      </AppButton>
      <AppButton 
        variant="danger" 
        @click="handleUninstallAll"
        :disabled="isLoading || plugins.length === 0"
      >
        <span class="action-icon">🗑️</span>
        {{ t('settings.plugin.uninstallAll') }}
      </AppButton>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="plugin-error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
      <button class="error-dismiss" @click="clearError">×</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="plugin-loading">
      <span class="loading-spinner"></span>
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- 插件列表 -->
    <div class="plugin-list">
      <div v-if="plugins.length === 0 && !isLoading" class="plugin-empty">
        <span class="empty-icon">🧩</span>
        <h3>{{ t('settings.plugin.noPlugins') }}</h3>
        <p>{{ t('settings.plugin.noPluginsDesc') }}</p>
      </div>

      <div 
        v-for="plugin in plugins" 
        :key="plugin.manifest.id" 
        class="plugin-card"
        :class="{ disabled: !plugin.enabled, 'has-error': plugin.error }"
      >
        <div class="plugin-icon">
          {{ plugin.manifest.icon || '🧩' }}
        </div>
        <div class="plugin-info">
          <div class="plugin-header">
            <h3 class="plugin-name">{{ plugin.manifest.name }}</h3>
            <span class="plugin-version">v{{ plugin.manifest.version }}</span>
            <span 
              class="plugin-status"
              :class="plugin.enabled ? 'enabled' : 'disabled'"
            >
              {{ plugin.enabled ? t('settings.plugin.enabled') : t('settings.plugin.disabled') }}
            </span>
          </div>
          <p class="plugin-description">{{ plugin.manifest.description }}</p>
          <div class="plugin-meta">
            <span class="plugin-author">
              <span class="meta-label">{{ t('settings.plugin.author') }}:</span>
              {{ plugin.manifest.author }}
            </span>
            <span class="plugin-date">
              <span class="meta-label">{{ t('settings.plugin.installedAt') }}:</span>
              {{ formatDate(plugin.installedAt) }}
            </span>
          </div>
          <div v-if="plugin.error" class="plugin-error-message">
            {{ plugin.error }}
          </div>
        </div>
        <div class="plugin-controls">
          <AppButton
            v-if="plugin.enabled"
            variant="secondary"
            size="sm"
            @click="handleDisable(plugin.manifest.id)"
            :disabled="isLoading"
          >
            {{ t('settings.plugin.disable') }}
          </AppButton>
          <AppButton
            v-else
            variant="primary"
            size="sm"
            @click="handleEnable(plugin.manifest.id)"
            :disabled="isLoading"
          >
            {{ t('settings.plugin.enable') }}
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            @click="handleUninstall(plugin.manifest.id, plugin.manifest.name)"
            :disabled="isLoading"
          >
            {{ t('settings.plugin.uninstall') }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePluginStore } from '@renderer/stores/plugin';
import AppButton from '@renderer/components/common/AppButton.vue';

const { t } = useI18n();
const pluginStore = usePluginStore();

// 计算属性
const plugins = computed(() => pluginStore.plugins);
const isLoading = computed(() => pluginStore.isLoading);
const error = computed(() => pluginStore.error);

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

// 清除错误
function clearError() {
  pluginStore.error = null;
}

// 安装插件
async function handleInstallPlugin() {
  await pluginStore.selectAndInstall();
}

// 刷新插件列表
async function handleRefresh() {
  await pluginStore.refresh();
}

// 启用插件
async function handleEnable(pluginId: string) {
  await pluginStore.enablePlugin(pluginId);
}

// 禁用插件
async function handleDisable(pluginId: string) {
  await pluginStore.disablePlugin(pluginId);
}

// 卸载插件
async function handleUninstall(pluginId: string, pluginName: string) {
  const result = await window.electronAPI.dialog.showMessage({
    type: 'warning',
    title: t('settings.plugin.uninstallConfirm'),
    message: t('settings.plugin.uninstallConfirmDesc', { name: pluginName }),
    buttons: [t('common.ok'), t('common.cancel')],
  });

  if (result.response === 0) {
    await pluginStore.uninstallPlugin(pluginId);
  }
}

// 卸载所有插件
async function handleUninstallAll() {
  const result = await window.electronAPI.dialog.showMessage({
    type: 'warning',
    title: t('settings.plugin.uninstallAllConfirm'),
    message: t('settings.plugin.uninstallAllConfirmDesc'),
    buttons: [t('common.ok'), t('common.cancel')],
  });

  if (result.response === 0) {
    const uninstallResult = await pluginStore.uninstallAllPlugins();
    if (uninstallResult) {
      // 显示结果提示
      if (uninstallResult.failed === 0) {
        console.log(t('settings.plugin.uninstallAllSuccess', { success: uninstallResult.success }));
      } else {
        console.log(t('settings.plugin.uninstallAllPartial', { success: uninstallResult.success, failed: uninstallResult.failed }));
      }
    }
  }
}

// 初始化
onMounted(async () => {
  await pluginStore.initialize();
});
</script>

<style scoped>
.plugin-settings {
  max-width: 800px;
}

.plugin-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.action-icon {
  margin-right: 0.5rem;
}

.plugin-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--theme-error) 10%, transparent);
  border: 1px solid var(--theme-error);
  border-radius: var(--radius-md);
  color: var(--theme-error);
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 1.25rem;
}

.error-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.error-dismiss:hover {
  opacity: 1;
}

.plugin-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  justify-content: center;
  color: var(--theme-text-secondary);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--theme-border);
  border-top-color: var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plugin-empty {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--theme-background-secondary);
  border: 1px dashed var(--theme-border-light);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.plugin-empty h3 {
  margin: 0 0 0.5rem;
  color: var(--theme-text);
}

.plugin-empty p {
  margin: 0;
  color: var(--theme-text-secondary);
}

.plugin-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--theme-background-secondary);
  border: 1px solid var(--theme-border-light);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.plugin-card:hover {
  border-color: var(--theme-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.plugin-card.disabled {
  opacity: 0.7;
  background: var(--theme-background);
}

.plugin-card.has-error {
  border-color: var(--theme-error);
}

.plugin-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-background);
  border-radius: var(--radius-md);
  flex-shrink: 0;
  border: 1px solid var(--theme-border-light);
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.plugin-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--theme-text);
}

.plugin-version {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--theme-background);
  border-radius: var(--radius-sm);
  color: var(--theme-text-secondary);
  border: 1px solid var(--theme-border-light);
}

.plugin-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
}

.plugin-status.enabled {
  background: color-mix(in srgb, var(--theme-success) 10%, transparent);
  color: var(--theme-success);
}

.plugin-status.disabled {
  background: var(--theme-background-tertiary);
  color: var(--theme-text-muted);
}

.plugin-description {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  line-height: 1.5;
}

.plugin-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: var(--theme-text-muted);
}

.meta-label {
  color: var(--theme-text-secondary);
}

.plugin-error-message {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: color-mix(in srgb, var(--theme-error) 10%, transparent);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--theme-error);
}

.plugin-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
