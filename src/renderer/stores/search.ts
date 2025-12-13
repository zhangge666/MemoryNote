/**
 * 搜索状态管理
 * 阶段 10: 搜索系统
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  SearchOptions,
  SearchResult,
  SearchHistoryItem,
} from '../../shared/types/search';

export const useSearchStore = defineStore('search', () => {
  // 状态
  const results = ref<SearchResult[]>([]);
  const history = ref<SearchHistoryItem[]>([]);
  const keyword = ref('');
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // 搜索选项
  const caseSensitive = ref(false);
  const useRegex = ref(false);
  const selectedTags = ref<string[]>([]);
  const dateRange = ref<{ from: number; to: number } | null>(null);

  // 计算属性
  const hasResults = computed(() => results.value.length > 0);
  const resultCount = computed(() => results.value.length);
  const hasHistory = computed(() => history.value.length > 0);

  /**
   * 执行搜索
   */
  async function search(searchKeyword?: string): Promise<void> {
    const searchTerm = searchKeyword ?? keyword.value;
    
    if (!searchTerm.trim()) {
      results.value = [];
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const options: SearchOptions = {
        keyword: searchTerm.trim(),
        caseSensitive: caseSensitive.value,
        regex: useRegex.value,
        tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
        dateRange: dateRange.value || undefined,
        limit: 50,
      };

      const response = await window.ipc.search.query(options);
      
      if (response.success && response.data) {
        results.value = response.data;
        keyword.value = searchTerm;
      } else {
        error.value = response.error || 'Search failed';
        results.value = [];
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      results.value = [];
      console.error('Search failed:', e);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载搜索历史
   */
  async function loadHistory(limit = 20): Promise<void> {
    try {
      const response = await window.ipc.search.getHistory(limit);
      if (response.success && response.data) {
        history.value = response.data;
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }

  /**
   * 清空搜索历史
   */
  async function clearHistory(): Promise<void> {
    try {
      const response = await window.ipc.search.clearHistory();
      if (response.success) {
        history.value = [];
      }
    } catch (e) {
      console.error('Failed to clear search history:', e);
    }
  }

  /**
   * 从历史记录搜索
   */
  async function searchFromHistory(historyKeyword: string): Promise<void> {
    keyword.value = historyKeyword;
    await search(historyKeyword);
  }

  /**
   * 清空搜索结果
   */
  function clearResults(): void {
    results.value = [];
    keyword.value = '';
    error.value = null;
  }

  /**
   * 设置搜索选项
   */
  function setOptions(options: {
    caseSensitive?: boolean;
    useRegex?: boolean;
    tags?: string[];
    dateRange?: { from: number; to: number } | null;
  }): void {
    if (options.caseSensitive !== undefined) {
      caseSensitive.value = options.caseSensitive;
    }
    if (options.useRegex !== undefined) {
      useRegex.value = options.useRegex;
    }
    if (options.tags !== undefined) {
      selectedTags.value = options.tags;
    }
    if (options.dateRange !== undefined) {
      dateRange.value = options.dateRange;
    }
  }

  /**
   * 重置搜索状态
   */
  function reset(): void {
    results.value = [];
    keyword.value = '';
    isLoading.value = false;
    error.value = null;
    caseSensitive.value = false;
    useRegex.value = false;
    selectedTags.value = [];
    dateRange.value = null;
  }

  return {
    // 状态
    results,
    history,
    keyword,
    isLoading,
    error,
    caseSensitive,
    useRegex,
    selectedTags,
    dateRange,

    // 计算属性
    hasResults,
    resultCount,
    hasHistory,

    // 方法
    search,
    loadHistory,
    clearHistory,
    searchFromHistory,
    clearResults,
    setOptions,
    reset,
  };
});
