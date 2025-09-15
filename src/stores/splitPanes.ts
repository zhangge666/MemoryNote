import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface SplitPane {
  id: string;
  tabs: Array<{ id: string; title: string; type: string; filePath?: string; route?: string }>;
  activeTab: string | null;
}

export interface SplitLayout {
  orientation: 'horizontal' | 'vertical'; // horizontal = 左右分屏, vertical = 上下分屏
  panes: SplitPane[];
  sizes: number[]; // 每个面板的大小比例
}

export const useSplitPanesStore = defineStore('splitPanes', () => {
  // 分屏状态
  const splitEnabled = ref(false);
  const layout = ref<SplitLayout>({
    orientation: 'horizontal',
    panes: [
      {
        id: 'main',
        tabs: [],
        activeTab: null
      }
    ],
    sizes: [100]
  });

  // 计算属性
  const activePaneId = ref<string>('main');
  const activePane = computed(() => 
    layout.value.panes.find(pane => pane.id === activePaneId.value)
  );

  // 获取所有标签页
  const allTabs = computed(() => {
    const tabs: Array<{ id: string; title: string; type: string; filePath?: string; route?: string; paneId: string }> = [];
    layout.value.panes.forEach(pane => {
      pane.tabs.forEach(tab => {
        tabs.push({ ...tab, paneId: pane.id });
      });
    });
    return tabs;
  });

  // 方法
  function enableSplit(orientation: 'horizontal' | 'vertical' = 'horizontal') {
    if (layout.value.panes.length === 1 && layout.value.panes[0].tabs.length > 0) {
      // 创建新的分屏面板
      const newPane: SplitPane = {
        id: `pane-${Date.now()}`,
        tabs: [],
        activeTab: null
      };

      layout.value.orientation = orientation;
      layout.value.panes.push(newPane);
      layout.value.sizes = [50, 50]; // 平分
      splitEnabled.value = true;
      activePaneId.value = newPane.id;
      
      console.log('🔄 启用分屏模式:', orientation);
    }
  }

  function disableSplit() {
    if (layout.value.panes.length > 1) {
      // 合并所有标签页到主面板
      const allTabsFromPanes = layout.value.panes.flatMap(pane => pane.tabs);
      const firstActiveTab = layout.value.panes.find(pane => pane.activeTab)?.activeTab || null;

      layout.value.panes = [{
        id: 'main',
        tabs: allTabsFromPanes,
        activeTab: firstActiveTab
      }];
      layout.value.sizes = [100];
      splitEnabled.value = false;
      activePaneId.value = 'main';
      
      console.log('🔄 禁用分屏模式');
    }
  }

  function addPane(orientation?: 'horizontal' | 'vertical') {
    const newPane: SplitPane = {
      id: `pane-${Date.now()}`,
      tabs: [],
      activeTab: null
    };

    if (orientation && orientation !== layout.value.orientation) {
      layout.value.orientation = orientation;
    }

    layout.value.panes.push(newPane);
    
    // 重新计算大小比例
    const paneCount = layout.value.panes.length;
    layout.value.sizes = Array(paneCount).fill(100 / paneCount);
    
    activePaneId.value = newPane.id;
    splitEnabled.value = true;
    
    console.log('➕ 添加新分屏面板:', newPane.id);
  }

  function removePane(paneId: string) {
    const paneIndex = layout.value.panes.findIndex(pane => pane.id === paneId);
    if (paneIndex === -1 || layout.value.panes.length <= 1) return;

    const paneToRemove = layout.value.panes[paneIndex];
    
    // 如果要删除的面板有标签页，移动到其他面板
    if (paneToRemove.tabs.length > 0) {
      const targetPaneIndex = paneIndex === 0 ? 1 : 0;
      const targetPane = layout.value.panes[targetPaneIndex];
      targetPane.tabs.push(...paneToRemove.tabs);
      
      // 如果目标面板没有活动标签页，使用被移动的标签页
      if (!targetPane.activeTab && paneToRemove.activeTab) {
        targetPane.activeTab = paneToRemove.activeTab;
      }
    }

    // 删除面板
    layout.value.panes.splice(paneIndex, 1);
    
    // 重新计算大小比例
    const paneCount = layout.value.panes.length;
    layout.value.sizes = Array(paneCount).fill(100 / paneCount);
    
    // 更新活动面板
    if (activePaneId.value === paneId) {
      activePaneId.value = layout.value.panes[0].id;
    }
    
    // 如果只剩一个面板，禁用分屏
    if (layout.value.panes.length === 1) {
      splitEnabled.value = false;
    }
    
    console.log('➖ 删除分屏面板:', paneId);
  }

  function openTabInPane(
    paneId: string, 
    tab: { id: string; title: string; type: string; filePath?: string; route?: string }
  ) {
    const pane = layout.value.panes.find(p => p.id === paneId);
    if (!pane) return;

    // 检查标签页是否已存在
    const existingTab = pane.tabs.find(t => t.id === tab.id && t.type === tab.type);
    if (!existingTab) {
      pane.tabs.push(tab);
    }
    
    pane.activeTab = `${tab.type}-${tab.id}`;
    activePaneId.value = paneId;
    
    console.log('📂 在面板中打开标签页:', { paneId, tab: tab.title });
  }

  function closeTabInPane(paneId: string, tabKey: string) {
    const pane = layout.value.panes.find(p => p.id === paneId);
    if (!pane) return;

    const tabIndex = pane.tabs.findIndex(tab => `${tab.type}-${tab.id}` === tabKey);
    if (tabIndex === -1) return;

    const isClosingActiveTab = pane.activeTab === tabKey;
    
    // 删除标签页
    pane.tabs.splice(tabIndex, 1);
    
    // 如果关闭的是活动标签页，需要切换到其他标签页
    if (isClosingActiveTab) {
      if (pane.tabs.length > 0) {
        const newActiveIndex = Math.max(0, tabIndex - 1);
        const newActiveTab = pane.tabs[newActiveIndex];
        pane.activeTab = `${newActiveTab.type}-${newActiveTab.id}`;
      } else {
        pane.activeTab = null;
      }
    }
    
    console.log('❌ 关闭标签页:', { paneId, tabKey });
  }

  function setActiveTabInPane(paneId: string, tabKey: string) {
    const pane = layout.value.panes.find(p => p.id === paneId);
    if (!pane) return;

    pane.activeTab = tabKey;
    activePaneId.value = paneId;
    
    console.log('🎯 设置活动标签页:', { paneId, tabKey });
  }

  function moveTabToPane(fromPaneId: string, toPaneId: string, tabKey: string) {
    const fromPane = layout.value.panes.find(p => p.id === fromPaneId);
    const toPane = layout.value.panes.find(p => p.id === toPaneId);
    
    if (!fromPane || !toPane || fromPaneId === toPaneId) return;

    const tabIndex = fromPane.tabs.findIndex(tab => `${tab.type}-${tab.id}` === tabKey);
    if (tabIndex === -1) return;

    const tab = fromPane.tabs[tabIndex];
    
    // 从源面板移除
    fromPane.tabs.splice(tabIndex, 1);
    if (fromPane.activeTab === tabKey) {
      if (fromPane.tabs.length > 0) {
        const newActiveIndex = Math.max(0, tabIndex - 1);
        const newActiveTab = fromPane.tabs[newActiveIndex];
        fromPane.activeTab = `${newActiveTab.type}-${newActiveTab.id}`;
      } else {
        fromPane.activeTab = null;
      }
    }
    
    // 添加到目标面板
    toPane.tabs.push(tab);
    toPane.activeTab = tabKey;
    activePaneId.value = toPaneId;
    
    console.log('🔄 移动标签页:', { fromPaneId, toPaneId, tabKey });
  }

  function updatePaneSizes(sizes: number[]) {
    if (sizes.length === layout.value.panes.length) {
      layout.value.sizes = sizes;
    }
  }

  function setOrientation(orientation: 'horizontal' | 'vertical') {
    layout.value.orientation = orientation;
    console.log('🔄 设置分屏方向:', orientation);
  }

  // 保存和恢复布局
  function saveLayout() {
    const layoutData = {
      splitEnabled: splitEnabled.value,
      layout: layout.value,
      activePaneId: activePaneId.value
    };
    localStorage.setItem('split-panes-layout', JSON.stringify(layoutData));
  }

  function restoreLayout() {
    const savedLayout = localStorage.getItem('split-panes-layout');
    if (savedLayout) {
      try {
        const layoutData = JSON.parse(savedLayout);
        splitEnabled.value = layoutData.splitEnabled || false;
        layout.value = layoutData.layout || layout.value;
        activePaneId.value = layoutData.activePaneId || 'main';
        
        console.log('📂 恢复分屏布局');
      } catch (error) {
        console.error('恢复分屏布局失败:', error);
      }
    }
  }

  // 清理空面板
  function cleanupEmptyPanes() {
    const nonEmptyPanes = layout.value.panes.filter(pane => pane.tabs.length > 0);
    
    if (nonEmptyPanes.length === 0) {
      // 保留一个空的主面板
      layout.value.panes = [{
        id: 'main',
        tabs: [],
        activeTab: null
      }];
      layout.value.sizes = [100];
      splitEnabled.value = false;
      activePaneId.value = 'main';
    } else if (nonEmptyPanes.length !== layout.value.panes.length) {
      layout.value.panes = nonEmptyPanes;
      const paneCount = nonEmptyPanes.length;
      layout.value.sizes = Array(paneCount).fill(100 / paneCount);
      
      // 确保活动面板仍然存在
      if (!nonEmptyPanes.find(pane => pane.id === activePaneId.value)) {
        activePaneId.value = nonEmptyPanes[0].id;
      }
      
      // 如果只剩一个面板，禁用分屏
      if (nonEmptyPanes.length === 1) {
        splitEnabled.value = false;
      }
    }
  }

  return {
    // 状态
    splitEnabled,
    layout,
    activePaneId,
    activePane,
    allTabs,
    
    // 方法
    enableSplit,
    disableSplit,
    addPane,
    removePane,
    openTabInPane,
    closeTabInPane,
    setActiveTabInPane,
    moveTabToPane,
    updatePaneSizes,
    setOrientation,
    saveLayout,
    restoreLayout,
    cleanupEmptyPanes
  };
});
