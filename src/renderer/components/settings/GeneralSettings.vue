<template>
  <div class="settings-section">
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.general.language') }}</label>
      <BaseSelect v-model="currentLanguage" disabled>
        <option value="zh-CN">简体中文</option>
        <option value="en-US">English</option>
      </BaseSelect>
    </div>
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.general.workspace') }}</label>
      <div class="workspace-input-group">
        <BaseInput 
          v-model="workspacePath"
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
          {{ isChangingWorkspace ? t('settings.general.processing') : t('settings.general.browse') }}
        </AppButton>
      </div>
    </div>
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.general.deleteConfirm') }}</label>
      <div class="setting-description">
        {{ t('settings.general.deleteConfirmDesc') }}
        <AppButton 
          variant="secondary"
          size="sm"
          class="reset-button"
          @click="resetDeleteConfirm"
          :disabled="!skipDeleteConfirm"
        >
          {{ skipDeleteConfirm ? t('settings.general.resetDeleteConfirm') : t('settings.general.deleteConfirmEnabled') }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@renderer/components/common/AppButton.vue';
import BaseSelect from '@renderer/components/common/BaseSelect.vue';
import BaseInput from '@renderer/components/common/BaseInput.vue';

const { t } = useI18n();

// 当前语言
const currentLanguage = ref('zh-CN');

// 工作目录相关
const workspacePath = ref('');
const isChangingWorkspace = ref(false);

// 删除确认相关
const skipDeleteConfirm = ref(false);

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

// Expose methods for parent component to call
defineExpose({
  loadWorkspace,
  loadDeleteConfirmConfig
});
</script>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--theme-border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 0.9375rem;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 100px; /* Ensure label is always visible with ellipsis */
  margin-right: 12px;
  flex: 1 1 auto; /* Allow grow and shrink */
}

.workspace-input {
  flex: 1;
  min-width: 0;
}

/* 工作目录输入组 */
.workspace-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.workspace-input-group :deep(.base-input-wrapper) {
  width: 100%;
  flex: 1;
  min-width: 0;
}
</style>