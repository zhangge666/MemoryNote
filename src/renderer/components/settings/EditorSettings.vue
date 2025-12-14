<template>
  <div class="settings-section">
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.editor.fontSize') }}</label>
      <input type="number" class="setting-input" value="14" min="10" max="24" />
    </div>
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.editor.lineHeight') }}</label>
      <input type="number" class="setting-input" value="1.6" min="1" max="3" step="0.1" />
    </div>
    <div class="setting-item">
      <label class="setting-label">{{ t('settings.editor.autoSave') }}</label>
      <input type="checkbox" class="setting-checkbox" checked />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
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
</style>