<template>
  <div class="custom-theme-editor">
    <div class="editor-header">
      <h4 class="editor-title">{{ t('settings.theme.customTheme.title') }}</h4>
      <div class="editor-actions">
        <button class="action-btn" @click="handleImport">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 12V4M8 4L5 7M8 4L11 7M2 14H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ t('settings.theme.customTheme.import') }}
        </button>
        <button class="action-btn" @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 4V12M8 12L5 9M8 12L11 9M2 14H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ t('settings.theme.customTheme.export') }}
        </button>
        <button class="action-btn primary" @click="handleSave" :disabled="!hasChanges">
          {{ t('common.save') }}
        </button>
      </div>
    </div>

    <div class="editor-body">
      <div class="theme-base-info">
        <div class="info-field">
          <label>{{ t('settings.theme.customTheme.name') }}</label>
          <input v-model="customTheme.name" type="text" class="theme-input" />
        </div>
        <div class="info-field">
          <label>{{ t('settings.theme.customTheme.baseTheme') }}</label>
          <select v-model="baseThemeId" class="theme-select" @change="handleBaseThemeChange">
            <option value="light">Modern Light</option>
            <option value="dark">Midnight Blue</option>
            <option value="ocean-breeze">Ocean Breeze</option>
            <option value="purple-haze">Purple Haze</option>
            <option value="forest-green">Forest Green</option>
          </select>
        </div>
      </div>

      <div class="color-sections">
        <div class="color-section">
          <h5 class="section-title">{{ t('settings.theme.customTheme.sections.primary') }}</h5>
          <div class="color-grid">
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.primary')" 
              v-model="customTheme.colors.primary" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.primaryHover')" 
              v-model="customTheme.colors.primaryHover" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.secondary')" 
              v-model="customTheme.colors.secondary" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.accent')" 
              v-model="customTheme.colors.accent" 
            />
          </div>
        </div>

        <div class="color-section">
          <h5 class="section-title">{{ t('settings.theme.customTheme.sections.background') }}</h5>
          <div class="color-grid">
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.background')" 
              v-model="customTheme.colors.background" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.backgroundSecondary')" 
              v-model="customTheme.colors.backgroundSecondary" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.backgroundTertiary')" 
              v-model="customTheme.colors.backgroundTertiary" 
            />
          </div>
        </div>

        <div class="color-section">
          <h5 class="section-title">{{ t('settings.theme.customTheme.sections.text') }}</h5>
          <div class="color-grid">
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.text')" 
              v-model="customTheme.colors.text" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.textSecondary')" 
              v-model="customTheme.colors.textSecondary" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.textMuted')" 
              v-model="customTheme.colors.textMuted" 
            />
          </div>
        </div>

        <div class="color-section">
          <h5 class="section-title">{{ t('settings.theme.customTheme.sections.border') }}</h5>
          <div class="color-grid">
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.border')" 
              v-model="customTheme.colors.border" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.borderActive')" 
              v-model="customTheme.colors.borderActive" 
            />
          </div>
        </div>

        <div class="color-section">
          <h5 class="section-title">{{ t('settings.theme.customTheme.sections.status') }}</h5>
          <div class="color-grid">
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.success')" 
              v-model="customTheme.colors.success" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.warning')" 
              v-model="customTheme.colors.warning" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.error')" 
              v-model="customTheme.colors.error" 
            />
            <ThemeColorPicker 
              :label="t('settings.theme.customTheme.colors.info')" 
              v-model="customTheme.colors.info" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '@renderer/stores/theme';
import ThemeColorPicker from './ThemeColorPicker.vue';
import type { Theme, ThemeColors } from '@shared/types/theme';
import { lightTheme } from '@renderer/themes/light';

const { t } = useI18n();
const themeStore = useThemeStore();

const baseThemeId = ref('light');
const originalTheme = ref<Theme | null>(null);
const hasChanges = ref(false);

const customTheme = reactive<Theme>({
  id: 'custom',
  name: 'Custom Theme',
  version: '1.0.0',
  author: 'User',
  description: 'User customized theme',
  type: 'light',
  colors: { ...lightTheme.colors },
  fonts: lightTheme.fonts,
});

const handleBaseThemeChange = () => {
  const baseTheme = themeStore.getTheme(baseThemeId.value);
  if (baseTheme) {
    Object.assign(customTheme.colors, baseTheme.colors);
    customTheme.type = baseTheme.type;
    hasChanges.value = true;
  }
};

const handleSave = async () => {
  try {
    // Save custom theme to ThemeService
    await themeStore.saveCustomTheme({ ...customTheme });
    await themeStore.switchTheme(customTheme.id);
    hasChanges.value = false;
  } catch (error) {
    console.error('Failed to save custom theme:', error);
  }
};

const handleExport = () => {
  const themeJson = themeStore.exportTheme({ ...customTheme });
  const blob = new Blob([themeJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${customTheme.id}-theme.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = themeStore.importTheme(event.target?.result as string);
          Object.assign(customTheme, imported);
          baseThemeId.value = imported.type === 'light' ? 'light' : 'dark';
          hasChanges.value = true;
        } catch (error) {
          console.error('Failed to import theme:', error);
          alert(t('notification.error') + ': Invalid theme file');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

// Watch for changes
watch(() => customTheme.colors, () => {
  hasChanges.value = true;
}, { deep: true });
</script>

<style scoped>
.custom-theme-editor {
  background: var(--theme-background-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--theme-border);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--theme-border);
}

.editor-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  color: var(--theme-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--theme-background-hover);
  border-color: var(--theme-border-active);
}

.action-btn.primary {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--theme-primary-hover);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.theme-base-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text);
}

.theme-input,
.theme-select {
  padding: 0.5rem 0.75rem;
  background: var(--theme-input-background);
  border: 1px solid var(--theme-input-border);
  border-radius: 6px;
  color: var(--theme-input-text);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.theme-input:focus,
.theme-select:focus {
  outline: none;
  border-color: var(--theme-input-focus);
}

.color-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.color-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--theme-border-light);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
</style>
