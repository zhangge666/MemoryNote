import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isLoading = ref(false);
  const currentView = ref('dashboard');
  const showSidebar = ref(true);
  const showFilePanel = ref(true);
  const showRightSidebar = ref(false);
  const rightSidebarWidth = ref(320);

  // 当前文件状态
  const currentFile = ref<{ path: string; name: string; content: string } | null>(null);

  // 错误状态
  const error = ref<string | null>(null);

  // 方法
  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }

  function setError(message: string | null) {
    error.value = message;
  }

  function toggleSidebar() {
    showSidebar.value = !showSidebar.value;
  }

  function toggleFilePanel() {
    showFilePanel.value = !showFilePanel.value;
  }

  function toggleRightSidebar() {
    showRightSidebar.value = !showRightSidebar.value;
  }

  function setRightSidebarWidth(width: number) {
    rightSidebarWidth.value = width;
  }

  function setCurrentFile(file: { path: string; name: string; content: string } | null) {
    currentFile.value = file;
  }

  return {
    // 状态
    isLoading,
    currentView,
    showSidebar,
    showFilePanel,
    showRightSidebar,
    rightSidebarWidth,
    currentFile,
    error,
    
    // 方法
    setLoading,
    setError,
    toggleSidebar,
    toggleFilePanel,
    toggleRightSidebar,
    setRightSidebarWidth,
    setCurrentFile,
  };
});