<template>
  <div class="w-full bg-white dark:bg-dark-800 flex flex-col h-full">
    <!-- 头部：搜索和过滤 -->
    <div class="p-4 border-b border-gray-200 dark:border-dark-600">
      <!-- 搜索框 -->
      <div class="relative mb-3">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('filePanel.searchPlaceholder')"
          class="input pl-10 pr-4"
          @input="onSearchInput"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <svg class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
      
      <!-- 过滤选项 -->
      <div class="flex space-x-2">
        <select
          v-model="selectedCategory"
          class="input text-xs py-1"
        >
          <option value="">{{ t('filePanel.allNotes') }}</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        
        <select
          v-model="sortBy"
          class="input text-xs py-1"
        >
          <option value="updated">{{ t('filePanel.sortByDate') }}</option>
          <option value="created">{{ t('filePanel.sortByDate') }}</option>
          <option value="title">{{ t('filePanel.sortByName') }}</option>
        </select>
      </div>
    </div>
    
    <!-- 文件列表 -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="p-4 text-center text-gray-500">
        {{ t('common.loading') }}
      </div>
      
      <div v-else-if="filteredNotes.length === 0" class="p-4 text-center text-gray-500">
        {{ searchQuery ? t('filePanel.noNotesFound') : t('filePanel.noNotesFound') }}
      </div>
      
      <div v-else class="p-2">
        <!-- 创建新文件夹按钮 -->
        <div class="mb-4 flex space-x-2">
          <button
            @click="createNewFolder"
            class="flex-1 btn btn-secondary btn-sm text-xs"
          >
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
            新建文件夹
          </button>
          <button
            @click="createNewNote"
            class="flex-1 btn btn-primary btn-sm text-xs"
          >
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            新建笔记
          </button>
        </div>

        <!-- 面包屑导航 -->
        <div v-if="currentPath.length > 0" class="mb-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <button @click="navigateToFolder(null)" class="hover:text-gray-700 dark:hover:text-gray-200">
            根目录
          </button>
          <template v-for="(folder, index) in currentPath" :key="folder.id">
            <svg class="w-3 h-3 mx-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            <button 
              @click="navigateToFolder(folder)"
              class="hover:text-gray-700 dark:hover:text-gray-200"
              :class="{ 'font-medium': index === currentPath.length - 1 }"
            >
              {{ folder.title }}
            </button>
          </template>
        </div>

        <!-- 树形文件列表 -->
        <div class="space-y-1">
          <div
            v-for="item in currentFolderItems"
            :key="item.id"
            class="note-item group"
            :class="{ 'note-item-active': currentNote?.id === item.id }"
          >
            <!-- 文件夹显示 -->
            <div v-if="item.is_folder" @click="navigateToFolder(item)" class="flex items-center cursor-pointer">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.title }}</span>
              <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="deleteNote(item)"
                  class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  title="删除文件夹"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 笔记显示 -->
            <div v-else @click="openNote(item)" class="cursor-pointer">
              <div class="flex-1 min-w-0">
                <div class="flex items-center">
                  <svg class="w-3 h-3 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                  </svg>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ item.title || '无标题' }}
                  </h3>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-5 line-clamp-2">
                  {{ getPreviewText(item.content) }}
                </p>
                <div class="flex items-center justify-between mt-2 ml-5">
                  <div class="flex items-center space-x-2">
                    <span v-if="item.category && item.category !== 'folder'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      {{ item.category }}
                    </span>
                    <div v-if="item.tags" class="flex flex-wrap gap-1">
                      <span
                        v-for="tag in getNoteTags(item.tags)"
                        :key="tag"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click.stop="deleteNote(item)"
                      class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      title="删除笔记"
                    >
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-5">
                  {{ formatDate(item.updated_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建文件夹对话框 -->
    <div v-if="showCreateFolderDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-80">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">创建新文件夹</h3>
        <input
          v-model="newFolderName"
          type="text"
          placeholder="请输入文件夹名称"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          @keyup.enter="confirmCreateFolder"
          @keyup.esc="cancelCreateFolder"
          autofocus
        />
        <div class="flex justify-end space-x-3 mt-4">
          <button
            @click="cancelCreateFolder"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            取消
          </button>
          <button
            @click="confirmCreateFolder"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            :disabled="!newFolderName.trim()"
          >
            创建
          </button>
        </div>
      </div>
    </div>
    
    <!-- 文档大纲 -->
    <div v-if="currentNote && showOutline" class="border-t border-gray-200 dark:border-dark-600 p-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">文档大纲</h4>
      <div class="space-y-1">
        <div
          v-for="heading in outline"
          :key="heading.id"
          @click="scrollToHeading(heading.id)"
          class="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 truncate"
          :style="{ paddingLeft: `${(heading.level - 1) * 12}px` }"
        >
          {{ heading.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNotesStore } from '../../stores/notes';
import { useAppStore } from '../../stores/app';
import type { Note } from '../../database/DatabaseManager';

const router = useRouter();
const { t } = useI18n();
const notesStore = useNotesStore();
const appStore = useAppStore();

// 响应式状态
const searchQuery = ref('');
const selectedCategory = ref('');
const sortBy = ref('updated');
const showOutline = ref(true);
const outline = ref<Array<{ id: string; level: number; text: string }>>([]);

// 树形结构相关状态
const currentFolder = ref<Note | null>(null);
const currentPath = ref<Note[]>([]);
const currentFolderItems = ref<Note[]>([]);

// 对话框状态
const showCreateFolderDialog = ref(false);
const newFolderName = ref('');

// 计算属性
const currentNote = computed(() => notesStore.currentNote);
const isLoading = computed(() => notesStore.isLoading);
const categories = computed(() => notesStore.categories);

const filteredNotes = computed(() => {
  let notes = notesStore.notes;
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    notes = notes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      (note.tags && note.tags.toLowerCase().includes(query))
    );
  }
  
  // 分类过滤
  if (selectedCategory.value) {
    notes = notes.filter(note => note.category === selectedCategory.value);
  }
  
  return notes;
});

const sortedNotes = computed(() => {
  const notes = [...filteredNotes.value];
  
  switch (sortBy.value) {
    case 'created':
      return notes.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    case 'title':
      return notes.sort((a, b) => a.title.localeCompare(b.title));
    case 'updated':
    default:
      return notes.sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime());
  }
});

// 方法
function onSearchInput() {
  notesStore.setSearchQuery(searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  notesStore.setSearchQuery('');
}

function openNote(note: Note) {
  notesStore.setCurrentNote(note);
  appStore.openTab({
    id: note.id!.toString(),
    title: note.title,
    type: 'note'
  });
  router.push(`/note/${note.id}`);
}

async function deleteNote(note: Note) {
  if (confirm(`确定要删除笔记"${note.title}"吗？`)) {
    try {
      await notesStore.deleteNote(note.id!);
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  }
}

function getPreviewText(content: string): string {
  // 移除Markdown标记并截取前100个字符
  const plainText = content
    .replace(/#+\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
}

function getNoteTags(tags: string): string[] {
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return '刚刚';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}小时前`;
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

function generateOutline() {
  if (!currentNote.value) {
    outline.value = [];
    return;
  }
  
  const content = currentNote.value.content;
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  
  outline.value = headings.map((heading, index) => {
    const level = heading.match(/^#+/)?.[0].length || 1;
    const text = heading.replace(/^#+\s+/, '');
    return {
      id: `heading-${index}`,
      level,
      text
    };
  });
}

function scrollToHeading(headingId: string) {
  // TODO: 实现滚动到指定标题
  console.log('滚动到标题:', headingId);
}

// 监听当前笔记变化，生成大纲
watch(currentNote, generateOutline, { immediate: true });

// 监听分类选择变化
watch(selectedCategory, (newCategory) => {
  notesStore.setSelectedCategory(newCategory);
});

// 文件夹导航方法
async function navigateToFolder(folder: Note | null) {
  currentFolder.value = folder;
  
  if (folder) {
    // 构建路径
    currentPath.value = [...currentPath.value];
    if (!currentPath.value.find(f => f.id === folder.id)) {
      currentPath.value.push(folder);
    } else {
      // 如果点击的是路径中的文件夹，截断路径
      const index = currentPath.value.findIndex(f => f.id === folder.id);
      currentPath.value = currentPath.value.slice(0, index + 1);
    }
  } else {
    // 返回根目录
    currentPath.value = [];
  }
  
  await loadCurrentFolderItems();
}

// 加载当前文件夹内容
async function loadCurrentFolderItems() {
  try {
    const parentId = currentFolder.value?.id;
    const items = await window.electronAPI.notes.getByParentId(parentId);
    currentFolderItems.value = items || [];
  } catch (error) {
    console.error('加载文件夹内容失败:', error);
    currentFolderItems.value = [];
  }
}

// 创建新文件夹
async function createNewFolder() {
  showCreateFolderDialog.value = true;
}

// 确认创建文件夹
async function confirmCreateFolder() {
  if (newFolderName.value && newFolderName.value.trim()) {
    try {
      await window.electronAPI.notes.createFolder(newFolderName.value.trim(), currentFolder.value?.id);
      await loadCurrentFolderItems();
      showCreateFolderDialog.value = false;
      newFolderName.value = '';
    } catch (error) {
      console.error('创建文件夹失败:', error);
      alert('创建文件夹失败，请重试。');
    }
  }
}

// 取消创建文件夹
function cancelCreateFolder() {
  showCreateFolderDialog.value = false;
  newFolderName.value = '';
}

// 创建新笔记
async function createNewNote() {
  try {
    const newNote = await notesStore.createNote({
      title: '新建笔记',
      content: '',
      category: '',
      tags: '',
      parent_id: currentFolder.value?.id,
    });
    
    await loadCurrentFolderItems();
    openNote(newNote);
  } catch (error) {
    console.error('创建笔记失败:', error);
    alert('创建笔记失败，请重试。');
  }
}

onMounted(() => {
  // 加载笔记
  notesStore.loadNotes();
  // 加载根目录内容
  loadCurrentFolderItems();
});
</script>

<style scoped>
.note-item {
  @apply p-3 rounded-lg cursor-pointer transition-colors duration-200;
  @apply hover:bg-gray-50 dark:hover:bg-dark-700;
  @apply border border-transparent;
}

.note-item-active {
  @apply bg-primary-50 dark:bg-primary-900/20;
  @apply border-primary-200 dark:border-primary-800;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
