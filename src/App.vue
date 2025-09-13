<template>
  <div id="app" class="h-screen flex flex-col overflow-hidden">
    <!-- 自定义标题栏 -->
    <TitleBar />
    
    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 侧边栏 -->
      <Sidebar v-if="showSidebar" />
      
      <!-- 文件列表/搜索面板 -->
      <FilePanel v-if="showFilePanel" />
      
      <!-- 主编辑区域 -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- 标签页 -->
        <TabBar />
        
        <!-- 路由视图 -->
        <div class="flex-1 overflow-hidden">
          <router-view />
        </div>
      </main>
    </div>
    
    <!-- 状态栏 -->
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TitleBar from './components/layout/TitleBar.vue';
import Sidebar from './components/layout/Sidebar.vue';
import FilePanel from './components/layout/FilePanel.vue';
import StatusBar from './components/layout/StatusBar.vue';
import TabBar from './components/layout/TabBar.vue';
import { useSettingsStore } from './stores/settings';
import { useAppStore } from './stores/app';

const settingsStore = useSettingsStore();
const appStore = useAppStore();

// 界面显示控制
const showSidebar = ref(true);
const showFilePanel = ref(true);

onMounted(async () => {
  // 初始化应用设置
  await settingsStore.loadSettings();
  
  // 应用主题
  applyTheme();
  
  // 应用语言
  // TODO: 实现国际化
});

function applyTheme() {
  const theme = settingsStore.theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// 监听设置变化
settingsStore.$subscribe(() => {
  applyTheme();
});
</script>

<style scoped>
/* 组件特定样式 */
</style>
