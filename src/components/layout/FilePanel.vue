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
        <div
          v-for="note in sortedNotes"
          :key="note.id"
          @click="openNote(note)"
          class="note-item group"
          :class="{ 'note-item-active': currentNote?.id === note.id }"
        >
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ note.title || t('editor.title') }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {{ getPreviewText(note.content) }}
            </p>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center space-x-2">
                <span v-if="note.category" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  {{ note.category }}
                </span>
                <div v-if="note.tags" class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in getNoteTags(note.tags)"
                    :key="tag"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {{ formatDate(note.updated_at) }}
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex-shrink-0 ml-2">
            <button
              @click.stop="deleteNote(note)"
              class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="删除笔记"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
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

onMounted(() => {
  // 加载笔记
  notesStore.loadNotes();
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
