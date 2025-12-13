<template>
  <div class="empty-state">
    <div class="empty-content">
      <!-- 应用 Logo -->
      <div class="app-logo">
        <div class="logo-icon-mask"></div>
      </div>

      <!-- 应用名称 -->
      <h1 class="app-title">{{ t('app.name') }}</h1>
      <p class="app-subtitle">{{ t('welcome.subtitle') }}</p>

      <!-- 快速开始 -->
      <div class="quick-actions">
        <button class="action-btn" @click="createNote">
          <svg viewBox="0 0 20 20" fill="none" class="action-icon">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ t('welcome.newNote') }}</span>
          <kbd class="kbd">Ctrl+N</kbd>
        </button>
        <button class="action-btn" @click="openSearch">
          <svg viewBox="0 0 20 20" fill="none" class="action-icon">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ t('welcome.find') }}</span>
          <kbd class="kbd">Ctrl+F</kbd>
        </button>
        <button class="action-btn" @click="openCommandPalette">
          <svg viewBox="0 0 20 20" fill="none" class="action-icon">
            <path d="M8 4h8M8 8h8M8 12h8M4 4h.01M4 8h.01M4 12h.01" 
                  stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ t('welcome.openCommandPalette') }}</span>
          <kbd class="kbd">Ctrl+P</kbd>
        </button>
      </div>

      <!-- 快捷键提示 -->
      <div class="shortcuts-grid">
        <div class="shortcut-item">
          <div class="shortcut-keys">
            <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>P</kbd>
          </div>
          <span class="shortcut-desc">{{ t('command.palette') }}</span>
        </div>
        <div class="shortcut-item">
          <div class="shortcut-keys">
            <kbd>Ctrl</kbd><span>+</span><kbd>S</kbd>
          </div>
          <span class="shortcut-desc">{{ t('editor.save') }}</span>
        </div>
        <div class="shortcut-item">
          <div class="shortcut-keys">
            <kbd>Ctrl</kbd><span>+</span><kbd>W</kbd>
          </div>
          <span class="shortcut-desc">{{ t('tabs.close') }}</span>
        </div>
        <div class="shortcut-item">
          <div class="shortcut-keys">
            <kbd>Ctrl</kbd><span>+</span><kbd>Tab</kbd>
          </div>
          <span class="shortcut-desc">切换标签</span>
        </div>
        <div class="shortcut-item">
          <div class="shortcut-keys">
            <kbd>Ctrl</kbd><span>+</span><kbd>,</kbd>
          </div>
          <span class="shortcut-desc">{{ t('settings.title') }}</span>
        </div>
        <div class="shortcut-item">
          <div class="shortcut-keys">
            <kbd>Ctrl</kbd><span>+</span><kbd>B</kbd>
          </div>
          <span class="shortcut-desc">{{ t('navbar.toggleSidebar') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useCommandStore } from '@renderer/stores/command';
import { useTabStore } from '@renderer/stores/tab';

const { t } = useI18n();
const commandStore = useCommandStore();
const tabStore = useTabStore();

function createNote() {
  tabStore.openTab({
    title: '未命名笔记',
    type: 'note',
    icon: '📝',
  });
}

function openSearch() {
  // TODO: 打开搜索
  console.log('Open search');
}

function openCommandPalette() {
  commandStore.commandPaletteVisible = true;
}
</script>

<style scoped>
.empty-state {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: 40px;
  overflow: auto;
}

.empty-content {
  max-width: 700px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* Logo */
.app-logo {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.empty-state:hover .app-logo {
  opacity: 0.8;
}

.logo-icon-mask {
  width: 100%;
  height: 100%;
  background-color: var(--color-text);
  -webkit-mask-image: url('/icon.svg');
  mask-image: url('/icon.svg');
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

/* 标题 */
.app-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.3;
  letter-spacing: -0.02em;
  margin: 0;
  transition: opacity 0.3s ease;
}

.empty-state:hover .app-title {
  opacity: 0.45;
}

.app-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  opacity: 0.5;
  margin: -16px 0 0 0;
  transition: opacity 0.3s ease;
}

.empty-state:hover .app-subtitle {
  opacity: 0.7;
}

/* 快速操作 */
.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.action-btn:hover {
  background: var(--color-hover);
  border-color: var(--color-border-active);
  color: var(--color-text);
  opacity: 0.8;
  transform: translateY(-1px);
}

.action-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  line-height: 1;
}

/* 快捷键网格 */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
  margin-top: 16px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.empty-state:hover .shortcuts-grid {
  opacity: 0.7;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-background-secondary);
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.shortcut-item:hover {
  background: var(--color-hover);
  border-color: var(--color-border);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.shortcut-keys kbd {
  min-width: 28px;
  text-align: center;
  padding: 3px 6px;
}

.shortcut-keys span {
  color: var(--color-text-muted);
  font-size: 11px;
}

.shortcut-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .empty-state {
    padding: 24px;
  }

  .app-title {
    font-size: 24px;
  }

  .quick-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: flex-start;
  }

  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

