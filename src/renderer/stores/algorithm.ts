/**
 * 算法状态管理
 * 管理复习算法和 Diff 算法的注册列表
 * 当插件启用/禁用/卸载时，自动刷新列表
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RegisteredAlgorithm } from '../../types';

export const useAlgorithmStore = defineStore('algorithm', () => {
  // 状态
  const reviewAlgorithms = ref<RegisteredAlgorithm[]>([]);
  const diffAlgorithms = ref<RegisteredAlgorithm[]>([]);
  const currentReviewAlgorithmId = ref<string>('algo:review:builtin:sm2');
  const currentDiffAlgorithmId = ref<string>('algo:diff:builtin:simple');
  const isLoading = ref(false);
  const isInitialized = ref(false);

  // 计算属性
  const builtinReviewAlgorithms = computed(() => 
    reviewAlgorithms.value.filter(a => a.isBuiltin)
  );
  const pluginReviewAlgorithms = computed(() => 
    reviewAlgorithms.value.filter(a => !a.isBuiltin)
  );
  const builtinDiffAlgorithms = computed(() => 
    diffAlgorithms.value.filter(a => a.isBuiltin)
  );
  const pluginDiffAlgorithms = computed(() => 
    diffAlgorithms.value.filter(a => !a.isBuiltin)
  );

  /**
   * 初始化 - 加载所有算法
   */
  async function initialize(): Promise<void> {
    if (isInitialized.value) return;
    
    await loadAlgorithms();
    isInitialized.value = true;
  }

  /**
   * 加载算法列表
   */
  async function loadAlgorithms(): Promise<void> {
    console.log('[AlgorithmStore] Loading algorithms...');
    isLoading.value = true;
    
    try {
      // 加载复习算法
      const reviewRes = await window.ipc.algorithm.getReviewAlgorithms();
      console.log('[AlgorithmStore] Review algorithms response:', reviewRes);
      if (reviewRes.success && reviewRes.data) {
        reviewAlgorithms.value = reviewRes.data;
        console.log('[AlgorithmStore] Review algorithms loaded:', reviewRes.data.length, 'algorithms');
      }
      
      // 加载 Diff 算法
      const diffRes = await window.ipc.algorithm.getDiffAlgorithms();
      console.log('[AlgorithmStore] Diff algorithms response:', diffRes);
      if (diffRes.success && diffRes.data) {
        diffAlgorithms.value = diffRes.data;
        console.log('[AlgorithmStore] Diff algorithms loaded:', diffRes.data.length, 'algorithms');
      }
      
      // 加载当前选中的算法
      const currentReviewRes = await window.ipc.algorithm.getCurrentReview();
      if (currentReviewRes.success && currentReviewRes.data) {
        currentReviewAlgorithmId.value = currentReviewRes.data;
      }
      
      const currentDiffRes = await window.ipc.algorithm.getCurrentDiff();
      if (currentDiffRes.success && currentDiffRes.data) {
        currentDiffAlgorithmId.value = currentDiffRes.data;
      }
    } catch (error) {
      console.error('[AlgorithmStore] Failed to load algorithms:', error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 设置复习算法
   */
  async function setReviewAlgorithm(algorithmId: string): Promise<boolean> {
    const oldId = currentReviewAlgorithmId.value;
    currentReviewAlgorithmId.value = algorithmId;
    
    try {
      const res = await window.ipc.algorithm.setReview(algorithmId);
      if (!res.success) {
        console.error('[AlgorithmStore] Failed to set review algorithm:', res.error);
        currentReviewAlgorithmId.value = oldId;
        return false;
      }
      return true;
    } catch (error) {
      console.error('[AlgorithmStore] Failed to set review algorithm:', error);
      currentReviewAlgorithmId.value = oldId;
      return false;
    }
  }

  /**
   * 设置 Diff 算法
   */
  async function setDiffAlgorithm(algorithmId: string): Promise<boolean> {
    const oldId = currentDiffAlgorithmId.value;
    currentDiffAlgorithmId.value = algorithmId;
    
    try {
      const res = await window.ipc.algorithm.setDiff(algorithmId);
      if (!res.success) {
        console.error('[AlgorithmStore] Failed to set diff algorithm:', res.error);
        currentDiffAlgorithmId.value = oldId;
        return false;
      }
      return true;
    } catch (error) {
      console.error('[AlgorithmStore] Failed to set diff algorithm:', error);
      currentDiffAlgorithmId.value = oldId;
      return false;
    }
  }

  /**
   * 刷新算法列表（供插件变更后调用）
   */
  async function refresh(): Promise<void> {
    await loadAlgorithms();
    console.log('[AlgorithmStore] Algorithms refreshed');
  }

  /**
   * 重置状态
   */
  function reset(): void {
    reviewAlgorithms.value = [];
    diffAlgorithms.value = [];
    currentReviewAlgorithmId.value = 'algo:review:builtin:sm2';
    currentDiffAlgorithmId.value = 'algo:diff:builtin:simple';
    isInitialized.value = false;
  }

  return {
    // 状态
    reviewAlgorithms,
    diffAlgorithms,
    currentReviewAlgorithmId,
    currentDiffAlgorithmId,
    isLoading,
    isInitialized,

    // 计算属性
    builtinReviewAlgorithms,
    pluginReviewAlgorithms,
    builtinDiffAlgorithms,
    pluginDiffAlgorithms,

    // 方法
    initialize,
    loadAlgorithms,
    setReviewAlgorithm,
    setDiffAlgorithm,
    refresh,
    reset,
  };
});
