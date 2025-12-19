<template>
  <div class="settings-section">
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.editor.fontSize') }}</label>
      <BaseInput v-model="fontSize" type="number" min="10" max="24" />
    </div>
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.editor.lineHeight') }}</label>
      <BaseInput v-model="lineHeight" type="number" min="1" max="3" step="0.1" />
    </div>
    <div class="setting-item">
      <div class="setting-info">
        <label class="setting-label">{{ t('settings.editor.autoSave') }}</label>
      </div>
      <BaseToggle v-model="autoSave" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseInput from '@renderer/components/common/BaseInput.vue';
import BaseToggle from '@renderer/components/common/BaseToggle.vue';

const { t } = useI18n();

// 编辑器配置
const fontSize = ref('14');
const lineHeight = ref('1.6');
const autoSave = ref(true);
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

.setting-info {
  flex: 1;
  margin-right: 1rem;
}

.setting-label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--theme-text);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 80px; /* Ensure label is always visible with ellipsis */
}

.setting-description {
  font-size: 0.8125rem;
  color: var(--theme-text-muted);
  line-height: 1.4;
}
</style>