<template>
  <div class="universal-tab-manager h-full">
    <!-- 使用分屏系统 -->
    <SplitPanes v-if="useSplitPanes" />
    
    <!-- 使用传统标签页系统 -->
    <div v-else class="traditional-tabs h-full flex flex-col">
      <TabBar />
      <div class="flex-1 overflow-hidden">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../../stores/app';
import { useSplitPanesStore } from '../../stores/splitPanes';
import SplitPanes from './SplitPanes.vue';
import TabBar from './TabBar.vue';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const splitPanesStore = useSplitPanesStore();

// 控制是否使用分屏系统
const useSplitPanes = ref(false);

// 计算属性
const currentRouteTab = computed(() => {
  const routeName = route.name as string;
  const routePath = route.path;
  
  switch (routeName) {
    case 'Dashboard':
      return {
        id: 'main',
        title: '仪表板',
        type: 'dashboard' as const,
        route: '/'
      };
    case 'NoteEditor':
      const filePath = route.query.filePath as string || '';
      const fileName = route.query.fileName as string || '未命名';
      return {
        id: btoa(encodeURIComponent(filePath)).replace(/[+=\/]/g, ''),
        title: fileName.replace(/\.md$/, ''),
        type: 'note' as const,
        filePath: filePath,
        route: routePath
      };
    case 'ReviewCenter':
      return {
        id: 'review',
        title: '复习中心',
        type: 'review' as const,
        route: '/review'
      };
    case 'Settings':
      return {
        id: 'settings',
        title: '设置',
        type: 'settings' as const,
        route: '/settings'
      };
    default:
      // 处理插件页面
      if (routePath.startsWith('/plugin/')) {
        const pageId = route.params.pageId as string;
        return {
          id: pageId,
          title: pageId, // 这里可以从插件管理器获取真实标题
          type: 'plugin' as const,
          route: routePath
        };
      }
      return null;
  }
});

// 方法
function enableSplitMode() {
  useSplitPanes.value = true;
  
  // 将当前打开的标签页迁移到分屏系统
  migrateTabsToSplitPanes();
  
  console.log('🔄 启用分屏标签页模式');
}

function disableSplitMode() {
  // 将分屏标签页迁移回传统系统
  migrateTabsFromSplitPanes();
  
  useSplitPanes.value = false;
  
  console.log('🔄 禁用分屏标签页模式');
}

function migrateTabsToSplitPanes() {
  // 将传统标签页系统的标签页迁移到分屏系统
  const currentTabs = appStore.openTabs;
  const activeTab = appStore.activeTab;
  
  if (currentTabs.length > 0) {
    const mainPane = splitPanesStore.layout.panes[0];
    mainPane.tabs = currentTabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      type: tab.type,
      filePath: tab.filePath,
      route: tab.route
    }));
    
    if (activeTab) {
      mainPane.activeTab = activeTab;
      splitPanesStore.activePaneId = mainPane.id;
    }
  }
  
  // 确保当前路由对应的标签页也在分屏系统中
  if (currentRouteTab.value) {
    splitPanesStore.openTabInPane('main', currentRouteTab.value);
  }
}

function migrateTabsFromSplitPanes() {
  // 将分屏系统的所有标签页迁移回传统系统
  const allTabs = splitPanesStore.allTabs;
  const activePane = splitPanesStore.activePane;
  
  // 清空传统标签页系统
  appStore.openTabs.splice(0);
  
  // 添加所有标签页
  allTabs.forEach(tab => {
    appStore.openTab({
      id: tab.id,
      title: tab.title,
      type: tab.type as any,
      filePath: tab.filePath,
      route: tab.route
    });
  });
  
  // 设置活动标签页
  if (activePane?.activeTab) {
    appStore.setActiveTab(activePane.activeTab);
  }
}

function syncCurrentRouteToSplitPanes() {
  if (!useSplitPanes.value || !currentRouteTab.value) return;
  
  // 确保当前路由在分屏系统中有对应的标签页
  const activePane = splitPanesStore.activePane;
  if (activePane) {
    const existingTab = activePane.tabs.find(tab => 
      `${tab.type}-${tab.id}` === `${currentRouteTab.value!.type}-${currentRouteTab.value!.id}`
    );
    
    if (!existingTab) {
      splitPanesStore.openTabInPane(activePane.id, currentRouteTab.value);
    } else {
      splitPanesStore.setActiveTabInPane(activePane.id, `${currentRouteTab.value.type}-${currentRouteTab.value.id}`);
    }
  }
}

// 监听路由变化
watch(() => route.fullPath, () => {
  if (useSplitPanes.value) {
    syncCurrentRouteToSplitPanes();
  }
});

// 监听分屏系统的标签页变化，同步到路由
watch(() => splitPanesStore.activePane?.activeTab, (newActiveTab) => {
  if (!useSplitPanes.value || !newActiveTab) return;
  
  const activePane = splitPanesStore.activePane;
  if (!activePane) return;
  
  const activeTab = activePane.tabs.find(tab => `${tab.type}-${tab.id}` === newActiveTab);
  if (activeTab && activeTab.route && route.path !== activeTab.route) {
    router.push(activeTab.route);
  }
});

onMounted(() => {
  // 恢复分屏模式状态
  const savedSplitMode = localStorage.getItem('universal-tab-split-mode');
  if (savedSplitMode === 'true') {
    enableSplitMode();
  }
  
  // 确保当前路由在系统中有对应的标签页
  if (currentRouteTab.value) {
    if (useSplitPanes.value) {
      syncCurrentRouteToSplitPanes();
    } else {
      appStore.openTab(currentRouteTab.value);
    }
  }
});

// 监听分屏模式变化，保存状态
watch(useSplitPanes, (newValue) => {
  localStorage.setItem('universal-tab-split-mode', newValue.toString());
});

// 暴露方法给父组件
defineExpose({
  enableSplitMode,
  disableSplitMode,
  useSplitPanes: computed(() => useSplitPanes.value)
});
</script>

<style scoped>
.universal-tab-manager {
  @apply relative;
}

.traditional-tabs {
  @apply bg-white dark:bg-dark-800;
}
</style>
