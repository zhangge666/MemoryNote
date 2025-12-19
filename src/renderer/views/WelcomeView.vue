<template>
  <div class="welcome-view">
    <div class="welcome-container">
      <div class="logo-section">
        <div class="logo-circle">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1 class="app-title">{{ t('app.name') }}</h1>
        <p class="app-subtitle">{{ t('welcome.subtitle') }}</p>
      </div>

      <div class="quick-actions">
        <h2>{{ t('welcome.quickStart') }}</h2>
        <div class="action-grid">
          <button class="action-card" @click="createNewNote">
            <div class="action-icon">📝</div>
            <div class="action-title">{{ t('welcome.newNote') }}</div>
            <div class="action-desc">{{ t('welcome.newNoteDesc') }}</div>
          </button>
          
          <button class="action-card" @click="openJournal">
            <div class="action-icon">📔</div>
            <div class="action-title">{{ t('welcome.openJournal') }}</div>
            <div class="action-desc">{{ t('welcome.openJournalDesc') }}</div>
          </button>
          
          <button class="action-card" @click="openSettings">
            <div class="action-icon">⚙️</div>
            <div class="action-title">{{ t('welcome.settings') }}</div>
            <div class="action-desc">{{ t('welcome.settingsDesc') }}</div>
          </button>
          
          <button class="action-card" @click="showHelp">
            <div class="action-icon">❓</div>
            <div class="action-title">{{ t('welcome.help') }}</div>
            <div class="action-desc">{{ t('welcome.helpDesc') }}</div>
          </button>
        </div>
      </div>

      <div class="keyboard-shortcuts">
        <h2>{{ t('welcome.keyboardShortcuts') }}</h2>
        <div class="shortcut-list">
          <div class="shortcut-item">
            <span class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>P</kbd>
            </span>
            <span class="shortcut-desc">{{ t('welcome.openCommandPalette') }}</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>N</kbd>
            </span>
            <span class="shortcut-desc">{{ t('welcome.newNote') }}</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>S</kbd>
            </span>
            <span class="shortcut-desc">{{ t('welcome.saveNote') }}</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>F</kbd>
            </span>
            <span class="shortcut-desc">{{ t('welcome.find') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useTabStore } from '@renderer/stores/tab';

const { t } = useI18n();
const tabStore = useTabStore();

function createNewNote() {
  tabStore.openTab({
    title: t('navbar.notes'),
    type: 'editor',
    icon: '📝',
  });
}

function openJournal() {
  tabStore.openTab({
    title: t('navbar.journal'),
    type: 'editor',
    icon: '📔',
  });
}

function openSettings() {
  tabStore.openTab({
    title: t('navbar.settings'),
    type: 'settings',
    icon: '⚙️',
  });
}

function showHelp() {
  // TODO: 实现帮助功能
  console.log('Show help');
}
</script>

<style scoped>
.welcome-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: var(--theme-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-container {
  max-width: 800px;
  width: 100%;
}

.logo-section {
  text-align: center;
  margin-bottom: 3rem;
}

.logo-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--theme-primary) 30%, transparent);
}

.logo-icon {
  width: 50px;
  height: 50px;
  color: var(--theme-text-inverse);
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 1.125rem;
  color: var(--theme-text-secondary);
  margin: 0;
}

.quick-actions,
.keyboard-shortcuts {
  margin-bottom: 3rem;
}

.quick-actions h2,
.keyboard-shortcuts h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--theme-text);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  background: var(--theme-background-secondary);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-card:hover {
  border-color: var(--theme-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  background: var(--theme-background-hover);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--theme-text);
}

.action-desc {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--theme-background-secondary);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-md);
  transition: border-color 0.2s;
}

.shortcut-item:hover {
  border-color: var(--theme-primary);
}

.shortcut-keys {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

kbd {
  padding: 0.25rem 0.5rem;
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-family: var(--theme-font-mono);
  box-shadow: var(--shadow-sm);
  color: var(--theme-text-secondary);
}

.shortcut-desc {
  color: var(--theme-text-secondary);
  font-size: 0.875rem;
}
</style>


