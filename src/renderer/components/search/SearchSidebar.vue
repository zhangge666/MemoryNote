<template>
  <div class="search-sidebar">
    <!-- 搜索输入 -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <BaseInput
          v-model="searchKeyword"
          type="search"
          :placeholder="t('search.placeholder')"
          class="flex-1"
          block
          @keydown.enter="handleSearch"
        />
        <button 
          class="search-btn" 
          @click="handleSearch" 
          :disabled="isLoading"
          :title="t('search.doSearch')"
        >
          <span v-if="isLoading" class="loading-icon spin">⟳</span>
          <span v-else>→</span>
        </button>
      </div>

      <!-- 高级选项 -->
      <div class="advanced-section">
        <button class="toggle-options-btn" @click="showAdvanced = !showAdvanced">
          <span class="btn-text">{{ t('search.advancedOptions') }}</span>
          <span class="btn-icon" :class="{ 'rotated': showAdvanced }">▼</span>
        </button>
        
        <transition name="expand">
          <div v-if="showAdvanced" class="options-panel">
            <BaseCheckbox v-model="caseSensitive" :label="t('search.caseSensitive')" />
            <BaseCheckbox v-model="useRegex" :label="t('search.useRegex')" />
          </div>
        </transition>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="results-section">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('search.searching') }}</p>
      </div>

      <div v-else-if="hasSearched && !hasResults" class="empty-state">
        <div class="empty-icon">¯\_(ツ)_/¯</div>
        <p class="empty-text">{{ t('search.noResults') }}</p>
        <p class="empty-desc">{{ t('search.noResultsDesc') }}</p>
      </div>

      <div v-else-if="hasResults" class="results-list">
        <div class="results-meta">
          <span class="results-count">{{ t('search.resultCount', { count: resultCount }) }}</span>
        </div>
        
        <div
          v-for="result in searchStore.results"
          :key="result.note.id"
          class="result-item"
          @click="openNote(result)"
        >
          <div class="result-header">
            <span class="result-icon">📄</span>
            <span class="result-title" :title="result.note.title">{{ result.note.title }}</span>
          </div>
          
          <div v-if="result.matches.length > 0" class="result-matches">
            <div
              v-for="(match, idx) in result.matches.slice(0, 3)"
              :key="idx"
              class="match-item"
            >
              <span class="match-line">{{ match.lineNumber }}</span>
              <span class="match-content" v-html="highlightMatch(match.content)"></span>
            </div>
            <div v-if="result.matches.length > 3" class="more-matches">
              +{{ result.matches.length - 3 }} {{ t('search.moreMatches') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-else-if="hasHistory" class="history-section">
        <div class="history-header">
          <span class="section-title">{{ t('search.recentHistory') }}</span>
          <button class="clear-history-btn" @click="clearHistory" :title="t('search.clearHistory')">
            🗑
          </button>
        </div>
        
        <div class="history-list">
          <div
            v-for="item in searchStore.history"
            :key="item.keyword"
            class="history-item"
            @click="searchFromHistory(item.keyword)"
          >
            <span class="history-icon">🕒</span>
            <span class="history-keyword">{{ item.keyword }}</span>
          </div>
        </div>
      </div>

      <!-- 初始空状态 -->
      <div v-else class="initial-state">
        <div class="initial-icon">🔍</div>
        <p>{{ t('search.startTyping') }}</p>
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
import BaseInput from '../common/BaseInput.vue';
import BaseCheckbox from '../common/BaseCheckbox.vue';

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
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--theme-sidebar-background);
  overflow: hidden; /* 防止自身出现滚动条，让 results-section 滚动 */
}

/* 头部区域固定 */
.search-header {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.search-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
}

.search-btn:hover:not(:disabled) {
  background: var(--theme-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.search-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
  font-size: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 高级选项 */
.advanced-section {
  display: flex;
  flex-direction: column;
}

.toggle-options-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--theme-text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-options-btn:hover {
  background: var(--theme-background-hover);
  color: var(--theme-text);
}

.btn-icon {
  font-size: 0.625rem;
  transition: transform 0.3s ease;
  opacity: 0.7;
}

.btn-icon.rotated {
  transform: rotate(180deg);
}

.options-panel {
  padding: 8px;
  margin-top: 4px;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--theme-border-light);
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

/* 结果区域 */
.results-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px; /* 给滚动条留点位置 */
}

.results-meta {
  padding: 0 4px 8px;
  font-size: 0.75rem;
  color: var(--theme-text-muted);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 20px;
}

.result-item {
  background: var(--theme-background-secondary);
  border: 1px solid var(--theme-border-light);
  border-radius: var(--radius-md);
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-item:hover {
  border-color: var(--theme-primary);
  background: var(--theme-background-hover);
  box-shadow: var(--shadow-sm);
  transform: translateX(2px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-width: 0; /* 关键：允许 flex 子项缩小 */
}

.result-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.result-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0; /* 关键：允许文本截断 */
}

.result-matches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  padding: 2px 4px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--theme-background) 50%, transparent);
}

.match-line {
  color: var(--theme-text-muted);
  font-family: var(--theme-font-mono);
  font-size: 0.7rem;
  flex-shrink: 0;
  width: 24px;
  text-align: right;
}

.match-content {
  color: var(--theme-text-secondary);
  word-break: break-all; /* 防止长单词撑开 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.match-content :deep(mark) {
  background: color-mix(in srgb, var(--theme-warning) 30%, transparent);
  color: var(--theme-text);
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
}

.more-matches {
  font-size: 0.7rem;
  color: var(--theme-text-muted);
  text-align: center;
  padding-top: 2px;
}

/* 历史记录 */
.history-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  margin-bottom: 4px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clear-history-btn {
  background: none;
  border: none;
  color: var(--theme-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.6;
}

.clear-history-btn:hover {
  opacity: 1;
  background: var(--theme-background-hover);
  color: var(--theme-error);
}

.history-list {
  display: flex;
  flex-wrap: wrap; /* 允许历史记录标签换行 */
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--theme-background-secondary);
  border: 1px solid var(--theme-border-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 100%;
}

.history-item:hover {
  background: var(--theme-background-hover);
  border-color: var(--theme-primary);
  transform: translateY(-1px);
}

.history-icon {
  font-size: 0.7rem;
  opacity: 0.5;
}

.history-keyword {
  font-size: 0.8rem;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* 限制单个标签最大宽度 */
}

/* 状态展示 */
.initial-state,
.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--theme-text-muted);
  text-align: center;
}

.initial-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.2;
}

.empty-text {
  font-size: 0.9rem;
  color: var(--theme-text-secondary);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: 0.75rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--theme-border);
  border-top-color: var(--theme-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

/* 过渡动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 100px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
}
</style>
