<template>
  <div v-if="tabs.length > 0" class="tab-bar border-b border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">
    <div class="flex items-center overflow-x-auto">
      <div
        v-for="tab in tabs"
        :key="`${tab.type}-${tab.id}`"
        class="tab-item"
        :class="{ 'tab-active': activeTab === `${tab.type}-${tab.id}` }"
        @click="setActiveTab(`${tab.type}-${tab.id}`)"
      >
        <!-- 标签图标 -->
        <div class="tab-icon">
          <svg v-if="tab.type === 'note'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 11.5V5z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="tab.type === 'review'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="tab.type === 'settings'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
          </svg>
        </div>
        
        <!-- 标签标题 -->
        <span class="tab-title">{{ tab.title }}</span>
        
        <!-- 关闭按钮 -->
        <button
          @click.stop="closeTab(`${tab.type}-${tab.id}`)"
          class="tab-close"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
      
      <!-- 新建标签按钮 -->
      <button
        @click="createNewNote"
        class="tab-new-btn"
        title="新建笔记"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../../stores/app';
import { useNotesStore } from '../../stores/notes';

const router = useRouter();
const appStore = useAppStore();
const notesStore = useNotesStore();

// 计算属性
const tabs = computed(() => appStore.openTabs);
const activeTab = computed(() => appStore.activeTab);

// 方法
function setActiveTab(tabKey: string) {
  appStore.setActiveTab(tabKey);
  
  // 导航到对应路由
  const tab = tabs.value.find(t => `${t.type}-${t.id}` === tabKey);
  if (tab) {
    switch (tab.type) {
      case 'note':
        router.push(`/note/${tab.id}`);
        break;
      case 'review':
        router.push('/review');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  }
}

function closeTab(tabKey: string) {
  appStore.closeTab(tabKey);
  
  // 如果没有打开的标签了，导航到首页
  if (appStore.openTabs.length === 0) {
    router.push('/');
  }
}

async function createNewNote() {
  try {
    const newNote = await notesStore.createNote({
      title: '新建笔记',
      content: '',
      category: '',
      tags: '',
    });
    
    appStore.openTab({
      id: newNote.id!.toString(),
      title: newNote.title,
      type: 'note'
    });
    
    router.push(`/note/${newNote.id}`);
  } catch (error) {
    console.error('创建笔记失败:', error);
  }
}
</script>

<style scoped>
.tab-bar {
  @apply flex-shrink-0;
  max-height: 40px;
}

.tab-item {
  @apply flex items-center space-x-2 px-4 py-2 cursor-pointer;
  @apply border-r border-gray-200 dark:border-dark-600;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
  @apply min-w-0 max-w-xs;
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.tab-active {
  @apply bg-gray-50 dark:bg-dark-700;
  @apply text-primary-600 dark:text-primary-400;
  @apply border-b-2 border-primary-500;
}

.tab-icon {
  @apply flex-shrink-0;
}

.tab-title {
  @apply truncate flex-1 min-w-0;
}

.tab-close {
  @apply flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-600;
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply transition-colors duration-200;
  @apply opacity-0 group-hover:opacity-100;
}

.tab-item:hover .tab-close {
  @apply opacity-100;
}

.tab-new-btn {
  @apply flex items-center justify-center w-10 h-10;
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700;
  @apply transition-colors duration-200;
}
</style>
