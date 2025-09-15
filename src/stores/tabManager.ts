import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 标签页类型定义
export interface Tab {
  id: string;
  title: string;
  type: 'note' | 'review' | 'settings' | 'dashboard' | 'plugin';
  filePath?: string;
  route?: string;
  pluginId?: string;
  isPinned?: boolean;
  hasUnsavedChanges?: boolean;
  icon?: string;
}

// 面板定义
export interface TabPane {
  id: string;
  tabs: Tab[];
  activeTabId: string | null;
}

// 分屏布局定义
export interface SplitLayout {
  id: string;
  type: 'single' | 'horizontal' | 'vertical';
  panes: TabPane[];
  sizes: number[]; // 面板大小比例
  children?: SplitLayout[]; // 嵌套布局支持
}

export const useTabManagerStore = defineStore('tabManager', () => {
  // 核心状态
  const currentLayout = ref<SplitLayout>({
    id: 'root',
    type: 'single',
    panes: [{
      id: 'main',
      tabs: [],
      activeTabId: null
    }],
    sizes: [100]
  });

  const activePaneId = ref<string>('main');
  const draggedTab = ref<{ tab: Tab; sourcePaneId: string } | null>(null);
  const lastClosedTab = ref<Tab | null>(null);

  // 计算属性
  const activePane = computed(() => 
    findPaneInLayout(currentLayout.value, activePaneId.value)
  );

  const activeTab = computed(() => {
    const pane = activePane.value;
    if (!pane || !pane.activeTabId) return null;
    return pane.tabs.find(tab => tab.id === pane.activeTabId) || null;
  });

  const allTabs = computed(() => {
    const tabs: (Tab & { paneId: string })[] = [];
    collectTabsFromLayout(currentLayout.value, tabs);
    return tabs;
  });

  const totalTabCount = computed(() => allTabs.value.length);

  const isSplitMode = computed(() => currentLayout.value.type !== 'single');

  // 辅助函数
  function findPaneInLayout(layout: SplitLayout, paneId: string): TabPane | null {
    for (const pane of layout.panes) {
      if (pane.id === paneId) return pane;
    }
    if (layout.children) {
      for (const child of layout.children) {
        const found = findPaneInLayout(child, paneId);
        if (found) return found;
      }
    }
    return null;
  }

  function collectTabsFromLayout(layout: SplitLayout, tabs: (Tab & { paneId: string })[]) {
    for (const pane of layout.panes) {
      pane.tabs.forEach(tab => {
        tabs.push({ ...tab, paneId: pane.id });
      });
    }
    if (layout.children) {
      layout.children.forEach(child => collectTabsFromLayout(child, tabs));
    }
  }

  function generatePaneId(): string {
    return 'pane_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateTabId(): string {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 标签页操作
  function openTab(tab: Omit<Tab, 'id'>, paneId?: string): Tab {
    console.log('🔧 tabManager.openTab 调用:', tab);
    const targetPaneId = paneId || activePaneId.value;
    console.log('🔧 目标面板ID:', targetPaneId);
    const pane = findPaneInLayout(currentLayout.value, targetPaneId);
    console.log('🔧 找到面板:', pane);
    
    if (!pane) {
      console.error('Pane not found:', targetPaneId);
      return tab as Tab;
    }

    // 检查是否已存在相同标签页
    const existingTab = pane.tabs.find(t => {
      // 对于笔记类型，比较文件路径
      if (t.type === 'note' && tab.type === 'note') {
        return t.filePath === tab.filePath;
      }
      // 对于插件类型，比较插件ID
      if (t.type === 'plugin' && tab.type === 'plugin') {
        return t.pluginId === tab.pluginId;
      }
      // 对于其他类型（settings, dashboard, review），比较类型和路由
      return t.type === tab.type && t.route === tab.route;
    });

    if (existingTab) {
      // 激活已存在的标签页
      console.log('🔧 标签页已存在，激活:', existingTab);
      pane.activeTabId = existingTab.id;
      activePaneId.value = targetPaneId;
      return existingTab;
    }

    // 创建新标签页
    const newTab: Tab = {
      id: generateTabId(),
      ...tab
    };

    console.log('🔧 创建新标签页:', newTab);
    pane.tabs.push(newTab);
    pane.activeTabId = newTab.id;
    activePaneId.value = targetPaneId;
    console.log('🔧 面板现有标签页数量:', pane.tabs.length);
    console.log('🔧 当前活动标签页ID:', pane.activeTabId);

    // 保存更新后的状态
    saveLayout();
    return newTab;
  }

  function closeTab(tabId: string, paneId?: string): boolean {
    console.log('🔧 closeTab 调用:', { tabId, paneId });
    const targetPaneId = paneId || findTabPane(tabId);
    if (!targetPaneId) {
      console.log('🔧 closeTab: 未找到目标面板ID');
      return false;
    }

    const pane = findPaneInLayout(currentLayout.value, targetPaneId);
    if (!pane) {
      console.log('🔧 closeTab: 未找到面板');
      return false;
    }

    const tabIndex = pane.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) {
      console.log('🔧 closeTab: 未找到标签页');
      return false;
    }

    console.log('🔧 closeTab: 关闭前标签页数量:', pane.tabs.length);
    const closedTab = pane.tabs[tabIndex];
    lastClosedTab.value = closedTab;
    pane.tabs.splice(tabIndex, 1);
    console.log('🔧 closeTab: 关闭后标签页数量:', pane.tabs.length);

    // 如果关闭的是活动标签页，选择新的活动标签页
    if (pane.activeTabId === tabId) {
      if (pane.tabs.length > 0) {
        // 选择相邻的标签页
        const newActiveIndex = Math.max(0, tabIndex - 1);
        pane.activeTabId = pane.tabs[newActiveIndex].id;
        console.log('🔧 closeTab: 设置新活动标签页:', pane.activeTabId);
      } else {
        pane.activeTabId = null;
        console.log('🔧 closeTab: 面板为空，调用autoCloseEmptyPane');
        // 如果面板没有标签页了，且是分屏模式，自动关闭空面板
        autoCloseEmptyPane(targetPaneId);
      }
    }

    // 保存更新后的状态
    saveLayout();
    return true;
  }

  function setActiveTab(tabId: string, paneId?: string): boolean {
    console.log('🔧 setActiveTab 调用:', { tabId, paneId });
    const targetPaneId = paneId || findTabPane(tabId);
    console.log('🔧 目标面板ID:', targetPaneId);
    
    if (!targetPaneId) {
      console.log('🔧 未找到目标面板ID');
      return false;
    }

    const pane = findPaneInLayout(currentLayout.value, targetPaneId);
    console.log('🔧 找到的面板:', pane);
    if (!pane) {
      console.log('🔧 未找到面板');
      return false;
    }

    const tab = pane.tabs.find(t => t.id === tabId);
    console.log('🔧 找到的标签:', tab);
    if (!tab) {
      console.log('🔧 未找到标签');
      return false;
    }

    pane.activeTabId = tabId;
    activePaneId.value = targetPaneId;
    console.log('🔧 设置成功 - 活动标签ID:', tabId, '活动面板ID:', targetPaneId);
    
    // 保存更新后的状态
    saveLayout();
    return true;
  }

  function findTabPane(tabId: string): string | null {
    for (const tabWithPane of allTabs.value) {
      if (tabWithPane.id === tabId) {
        return tabWithPane.paneId;
      }
    }
    return null;
  }

  // 分屏操作
  function enableSplit(orientation: 'horizontal' | 'vertical'): boolean {
    if (isSplitMode.value) return false;

    const currentPane = currentLayout.value.panes[0];
    const newPaneId = generatePaneId();

    currentLayout.value = {
      id: 'root',
      type: orientation,
      panes: [
        currentPane,
        {
          id: newPaneId,
          tabs: [],
          activeTabId: null
        }
      ],
      sizes: [50, 50]
    };

    return true;
  }

  function disableSplit(): boolean {
    if (!isSplitMode.value) return false;

    // 合并所有标签页到主面板
    const allTabsFlat: Tab[] = [];
    let newActiveTabId: string | null = null;

    currentLayout.value.panes.forEach(pane => {
      allTabsFlat.push(...pane.tabs);
      if (pane.activeTabId && pane.id === activePaneId.value) {
        newActiveTabId = pane.activeTabId;
      }
    });

    currentLayout.value = {
      id: 'root',
      type: 'single',
      panes: [{
        id: 'main',
        tabs: allTabsFlat,
        activeTabId: newActiveTabId || (allTabsFlat.length > 0 ? allTabsFlat[0].id : null)
      }],
      sizes: [100]
    };

    activePaneId.value = 'main';
    return true;
  }

  function addPane(orientation?: 'horizontal' | 'vertical'): string {
    const newPaneId = generatePaneId();

    if (currentLayout.value.type === 'single') {
      // 从单面板转换为分屏
      const splitOrientation = orientation || 'horizontal';
      currentLayout.value = {
        id: 'root',
        type: splitOrientation,
        panes: [
          ...currentLayout.value.panes,
          {
            id: newPaneId,
            tabs: [],
            activeTabId: null
          }
        ],
        sizes: [50, 50]
      };
    } else {
      // 在现有分屏中添加面板
      const newPaneCount = currentLayout.value.panes.length + 1;
      const newSize = 100 / newPaneCount;
      
      currentLayout.value.panes.push({
        id: newPaneId,
        tabs: [],
        activeTabId: null
      });
      
      // 重新分配大小
      currentLayout.value.sizes = new Array(newPaneCount).fill(newSize);
    }

    return newPaneId;
  }

  function removePane(paneId: string): boolean {
    console.log('🔧 removePane 调用:', paneId);
    console.log('🔧 removePane: 当前面板数量:', currentLayout.value.panes.length);
    
    if (currentLayout.value.panes.length <= 1) {
      console.log('🔧 removePane: 只有一个面板，无法删除');
      return false;
    }

    const paneIndex = currentLayout.value.panes.findIndex(p => p.id === paneId);
    if (paneIndex === -1) {
      console.log('🔧 removePane: 未找到要删除的面板');
      return false;
    }

    // 将要删除面板的标签页移动到其他面板
    const paneToRemove = currentLayout.value.panes[paneIndex];
    console.log('🔧 removePane: 要删除的面板标签页数量:', paneToRemove.tabs.length);
    
    if (paneToRemove.tabs.length > 0) {
      const targetPane = currentLayout.value.panes.find(p => p.id !== paneId);
      if (targetPane) {
        console.log('🔧 removePane: 将标签页移动到面板:', targetPane.id);
        targetPane.tabs.push(...paneToRemove.tabs);
        if (!targetPane.activeTabId && paneToRemove.activeTabId) {
          targetPane.activeTabId = paneToRemove.activeTabId;
        }
      }
    }

    // 删除面板
    currentLayout.value.panes.splice(paneIndex, 1);
    console.log('🔧 removePane: 删除后面板数量:', currentLayout.value.panes.length);
    
    // 重新分配大小
    const newPaneCount = currentLayout.value.panes.length;
    if (newPaneCount === 1) {
      // 回到单面板模式
      console.log('🔧 removePane: 回到单面板模式');
      currentLayout.value.type = 'single';
      currentLayout.value.sizes = [100];
      activePaneId.value = currentLayout.value.panes[0].id;
    } else {
      const newSize = 100 / newPaneCount;
      currentLayout.value.sizes = new Array(newPaneCount).fill(newSize);
    }

    return true;
  }

  // 拖拽操作
  function startDragTab(tab: Tab, sourcePaneId: string) {
    draggedTab.value = { tab, sourcePaneId };
  }

  function dropTabToPane(targetPaneId: string): boolean {
    if (!draggedTab.value) return false;

    const { tab, sourcePaneId } = draggedTab.value;
    
    if (sourcePaneId === targetPaneId) {
      draggedTab.value = null;
      return false;
    }

    // 从源面板移除
    const sourcePane = findPaneInLayout(currentLayout.value, sourcePaneId);
    const targetPane = findPaneInLayout(currentLayout.value, targetPaneId);
    
    if (!sourcePane || !targetPane) {
      draggedTab.value = null;
      return false;
    }

    const tabIndex = sourcePane.tabs.findIndex(t => t.id === tab.id);
    if (tabIndex === -1) {
      draggedTab.value = null;
      return false;
    }

    // 移除标签页
    sourcePane.tabs.splice(tabIndex, 1);
    if (sourcePane.activeTabId === tab.id) {
      sourcePane.activeTabId = sourcePane.tabs.length > 0 ? sourcePane.tabs[0].id : null;
    }

    // 添加到目标面板
    targetPane.tabs.push(tab);
    targetPane.activeTabId = tab.id;
    activePaneId.value = targetPaneId;

    draggedTab.value = null;
    return true;
  }

  function moveTabToNewPane(tabId: string, orientation: 'horizontal' | 'vertical'): boolean {
    const sourcePaneId = findTabPane(tabId);
    if (!sourcePaneId) return false;

    const sourcePane = findPaneInLayout(currentLayout.value, sourcePaneId);
    if (!sourcePane) return false;

    const tab = sourcePane.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    // 创建新面板
    const newPaneId = addPane(orientation);
    
    // 移动标签页
    startDragTab(tab, sourcePaneId);
    return dropTabToPane(newPaneId);
  }

  // 批量操作
  function closeAllTabs(paneId?: string): boolean {
    if (paneId) {
      const pane = findPaneInLayout(currentLayout.value, paneId);
      if (!pane) return false;
      
      if (pane.tabs.length > 0) {
        lastClosedTab.value = pane.tabs[pane.tabs.length - 1];
      }
      
      pane.tabs = [];
      pane.activeTabId = null;
      
      // 保存更新后的状态
      saveLayout();
      return true;
    } else {
      // 关闭所有面板的所有标签页
      const allTabsBeforeClose = allTabs.value;
      if (allTabsBeforeClose.length > 0) {
        lastClosedTab.value = allTabsBeforeClose[allTabsBeforeClose.length - 1];
      }

      currentLayout.value.panes.forEach(pane => {
        pane.tabs = [];
        pane.activeTabId = null;
      });
      
      // 保存更新后的状态
      saveLayout();
      return true;
    }
  }

  function closeOtherTabs(keepTabId: string): boolean {
    const paneId = findTabPane(keepTabId);
    if (!paneId) return false;

    const pane = findPaneInLayout(currentLayout.value, paneId);
    if (!pane) return false;

    const keepTab = pane.tabs.find(t => t.id === keepTabId);
    if (!keepTab) return false;

    const closedTabs = pane.tabs.filter(t => t.id !== keepTabId);
    if (closedTabs.length > 0) {
      lastClosedTab.value = closedTabs[closedTabs.length - 1];
    }

    pane.tabs = [keepTab];
    pane.activeTabId = keepTabId;
    return true;
  }

  function reopenLastClosedTab(): boolean {
    if (!lastClosedTab.value) return false;

    const tab = lastClosedTab.value;
    lastClosedTab.value = null;
    
    // 重新打开时，移除旧的ID，让openTab生成新的ID
    const { id, ...tabWithoutId } = tab;
    openTab(tabWithoutId);
    return true;
  }

  // 文件路径更新
  function updateFilePathInTabs(oldPath: string, newPath: string, newName: string) {
    currentLayout.value.panes.forEach(pane => {
      pane.tabs.forEach(tab => {
        if (tab.filePath === oldPath) {
          tab.filePath = newPath;
          tab.title = newName.replace(/\.md$/, '');
        }
      });
    });
  }

  // 自动关闭空面板
  function autoCloseEmptyPane(paneId: string) {
    // 只在分屏模式下自动关闭空面板
    if (!isSplitMode.value || currentLayout.value.panes.length <= 1) {
      return;
    }

    const pane = findPaneInLayout(currentLayout.value, paneId);
    if (!pane || pane.tabs.length > 0) {
      return;
    }

    console.log('🔧 自动关闭空面板:', paneId);
    removePane(paneId);
  }

  // 持久化
  function saveLayout() {
    try {
      localStorage.setItem('tabManager_layout', JSON.stringify(currentLayout.value));
      localStorage.setItem('tabManager_activePaneId', activePaneId.value);
      // 不保存lastClosedTab到localStorage，避免意外恢复
    } catch (error) {
      console.error('Failed to save tab layout:', error);
    }
  }

  function loadLayout() {
    try {
      const savedLayout = localStorage.getItem('tabManager_layout');
      const savedActivePaneId = localStorage.getItem('tabManager_activePaneId');
      
      if (savedLayout) {
        currentLayout.value = JSON.parse(savedLayout);
      }
      
      if (savedActivePaneId) {
        activePaneId.value = savedActivePaneId;
      }
    } catch (error) {
      console.error('Failed to load tab layout:', error);
    }
  }

  return {
    // 状态
    currentLayout,
    activePaneId,
    draggedTab,
    lastClosedTab,
    
    // 计算属性
    activePane,
    activeTab,
    allTabs,
    totalTabCount,
    isSplitMode,
    
    // 标签页操作
    openTab,
    closeTab,
    setActiveTab,
    findTabPane,
    
    // 分屏操作
    enableSplit,
    disableSplit,
    addPane,
    removePane,
    
    // 拖拽操作
    startDragTab,
    dropTabToPane,
    moveTabToNewPane,
    
    // 批量操作
    closeAllTabs,
    closeOtherTabs,
    reopenLastClosedTab,
    
    // 文件操作
    updateFilePathInTabs,
    
    // 面板管理
    autoCloseEmptyPane,
    
    // 持久化
    saveLayout,
    loadLayout
  };
});

