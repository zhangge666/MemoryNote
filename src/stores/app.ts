import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isLoading = ref(false);
  const currentView = ref('dashboard');
  const showSidebar = ref(true);
  const showFilePanel = ref(true);
  const activeTab = ref<string | null>(null);
  const openTabs = ref<Array<{ id: string; title: string; type: 'note' | 'review' | 'settings' }>>([]);

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

  function openTab(tab: { id: string; title: string; type: 'note' | 'review' | 'settings' }) {
    const existingTab = openTabs.value.find(t => t.id === tab.id && t.type === tab.type);
    if (!existingTab) {
      openTabs.value.push(tab);
    }
    activeTab.value = `${tab.type}-${tab.id}`;
  }

  function closeTab(tabKey: string) {
    const index = openTabs.value.findIndex(tab => `${tab.type}-${tab.id}` === tabKey);
    if (index > -1) {
      openTabs.value.splice(index, 1);
      
      // 如果关闭的是当前活动标签，切换到其他标签
      if (activeTab.value === tabKey) {
        if (openTabs.value.length > 0) {
          const newActiveTab = openTabs.value[Math.max(0, index - 1)];
          activeTab.value = `${newActiveTab.type}-${newActiveTab.id}`;
        } else {
          activeTab.value = null;
        }
      }
    }
  }

  function setActiveTab(tabKey: string) {
    activeTab.value = tabKey;
  }

  return {
    // 状态
    isLoading,
    currentView,
    showSidebar,
    showFilePanel,
    activeTab,
    openTabs,
    error,
    
    // 方法
    setLoading,
    setError,
    toggleSidebar,
    toggleFilePanel,
    openTab,
    closeTab,
    setActiveTab,
  };
});
