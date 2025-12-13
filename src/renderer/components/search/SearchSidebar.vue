<template>
  <div class="search-sidebar">
    <!-- 搜索输入 -->
    <div class="search-input-wrapper">
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        :placeholder="t('search.placeholder')"
        @keyup.enter="handleSearch"
      />
      <button class="search-btn" @click="handleSearch" :disabled="isLoading">
        <span v-if="isLoading" class="loading-icon">⏳</span>
        <span v-else>🔍</span>
      </button>
    </div>

    <!-- 高级选项 -->
    <div class="advanced-options">
      <button class="toggle-options-btn" @click="showAdvanced = !showAdvanced">
        {{ t('search.advancedOptions') }}
        <span :class="{ 'rotated': showAdvanced }">▼</span>
      </button>
      
      <div v-if="showAdvanced" class="options-panel">
        <label class="option-item">
          <input
            v-model="caseSensitive"
            type="checkbox"
          />
          <span>{{ t('search.caseSensitive') }}</span>
        </label>
        <label class="option-item">
          <input
            v-model="useRegex"
            type="checkbox"
          />
          <span>{{ t('search.useRegex') }}</span>
        </label>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="results-section">
      <div v-if="isLoading" class="loading">
        {{ t('search.searching') }}
      </div>

      <div v-else-if="hasSearched && !hasResults" class="empty">
        <div class="empty-icon">🔍</div>
        <p>{{ t('search.noResults') }}</p>
        <p class="empty-desc">{{ t('search.noResultsDesc') }}</p>
      </div>

      <div v-else-if="hasResults" class="results-list">
        <div class="results-header">
          <span class="results-count">{{ t('search.resultCount', { count: resultCount }) }}</span>
        </div>
        
        <div
          v-for="result in searchStore.results"
          :key="result.note.id"
          class="result-item"
          @click="openNote(result)"
        >
          <div class="result-header">
            <span class="result-icon">📝</span>
            <span class="result-title">{{ result.note.title }}</span>
          </div>
          
          <div v-if="result.matches.length > 0" class="result-matches">
            <div
              v-for="(match, idx) in result.matches.slice(0, 3)"
              :key="idx"
              class="match-item"
            >
              <span class="match-line">{{ t('search.line', { line: match.lineNumber }) }}</span>
              <span class="match-content" v-html="highlightMatch(match.content)"></span>
            </div>
            <div v-if="result.matches.length > 3" class="more-matches">
              {{ t('search.matchCount', { count: result.matches.length - 3 }) }} more...
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-else-if="hasHistory" class="history-section">
        <div class="history-header">
          <span class="section-title">{{ t('search.recentHistory') }}</span>
          <button class="clear-history-btn" @click="clearHistory">
            {{ t('search.clearHistory') }}
          </button>
        </div>
        
        <div class="history-list">
          <div
            v-for="item in searchStore.history"
            :key="item.keyword"
            class="history-item"
            @click="searchFromHistory(item.keyword)"
          >
            <span class="history-icon">🕐</span>
            <span class="history-keyword">{{ item.keyword }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>{{ t('search.placeholder') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSearchStore } from '../../stores/search';
import { useTabStore } from '../../stores/tab';
import type { SearchResult } from '@shared/types/search';

const { t } = useI18n();
const searchStore = useSearchStore();
const tabStore = useTabStore();

// 本地状态
const searchKeyword = ref('');
const showAdvanced = ref(false);
const hasSearched = ref(false);

// 计算属性
const isLoading = computed(() => searchStore.isLoading);
const hasResults = computed(() => searchStore.hasResults);
const resultCount = computed(() => searchStore.resultCount);
const hasHistory = computed(() => searchStore.hasHistory);
const caseSensitive = computed({
  get: () => searchStore.caseSensitive,
  set: (val) => searchStore.setOptions({ caseSensitive: val }),
});
const useRegex = computed({
  get: () => searchStore.useRegex,
  set: (val) => searchStore.setOptions({ useRegex: val }),
});

// 同步搜索关键词
watch(() => searchStore.keyword, (newVal) => {
  searchKeyword.value = newVal;
});

// 加载搜索历史
onMounted(async () => {
  await searchStore.loadHistory();
});

// 搜索处理
async function handleSearch() {
  if (!searchKeyword.value.trim()) return;
  
  hasSearched.value = true;
  await searchStore.search(searchKeyword.value);
}

// 从历史搜索
async function searchFromHistory(keyword: string) {
  searchKeyword.value = keyword;
  hasSearched.value = true;
  await searchStore.searchFromHistory(keyword);
}

// 清除历史
async function clearHistory() {
  await searchStore.clearHistory();
}

// 打开笔记
function openNote(result: SearchResult) {
  const note = result.note;
  
  // 检查是否已经打开该笔记
  const existingTab = tabStore.allTabs.find(tab =>
    tab.type === 'editor' && tab.data?.noteId === note.id
  );

  if (existingTab) {
    tabStore.activateTab(existingTab.id);
  } else {
    tabStore.openTab({
      title: note.title,
      type: 'editor',
      icon: '📝',
      filePath: note.filePath,
      data: {
        noteId: note.id,
        content: note.content || '',
        filePath: note.filePath,
      },
    });
  }
}

// 高亮匹配文本
function highlightMatch(content: string): string {
  const keyword = searchStore.keyword;
  if (!keyword) return escapeHtml(content);
  
  try {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, caseSensitive.value ? 'g' : 'gi');
    return escapeHtml(content).replace(regex, '<mark>$1</mark>');
  } catch {
    return escapeHtml(content);
  }
}

// 转义 HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 暴露刷新方法
defineExpose({
  refresh: async () => {
    await searchStore.loadHistory();
  },
});
</script>

<style scoped>
.search-sidebar {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 搜索输入 */
.search-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background-secondary);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-btn {
  padding: 10px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 高级选项 */
.advanced-options {
  margin-bottom: 16px;
}

.toggle-options-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-options-btn:hover {
  background: var(--color-background-secondary);
}

.toggle-options-btn span {
  transition: transform 0.2s;
  font-size: 10px;
}

.toggle-options-btn span.rotated {
  transform: rotate(180deg);
}

.options-panel {
  margin-top: 8px;
  padding: 12px;
  background: var(--color-background-secondary);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
}

.option-item input {
  accent-color: var(--color-primary);
}

/* 结果区域 */
.results-section {
  flex: 1;
  overflow-y: auto;
}

.loading,
.empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--color-text-secondary);
}

.empty-state .empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

/* 结果列表 */
.results-header {
  margin-bottom: 12px;
}

.results-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  padding: 12px;
  background: var(--color-background-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.result-icon {
  font-size: 14px;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-matches {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.match-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}

.match-line {
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.match-content {
  color: var(--color-text-secondary);
  word-break: break-word;
  line-height: 1.4;
}

.match-content :deep(mark) {
  background: var(--color-warning);
  color: var(--color-text);
  padding: 0 2px;
  border-radius: 2px;
}

.more-matches {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* 历史区域 */
.history-section {
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.clear-history-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-history-btn:hover {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--color-background-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: var(--color-background-tertiary);
}

.history-icon {
  font-size: 12px;
  opacity: 0.6;
}

.history-keyword {
  font-size: 13px;
  color: var(--color-text);
}
</style>
