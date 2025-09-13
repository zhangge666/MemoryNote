<template>
  <div class="h-full flex flex-col">
    <!-- 编辑器工具栏 -->
    <div class="border-b border-gray-200 dark:border-dark-600 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <input
            v-model="noteTitle"
            type="text"
            placeholder="请输入标题..."
            class="text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            @blur="saveNote"
          />
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="saveNote"
            class="btn btn-primary btn-sm"
            :disabled="!hasChanges"
          >
            保存
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑器内容区域 -->
    <div class="flex-1">
      <MarkdownEditor
        v-model="noteContent"
        :show-line-numbers="showLineNumbers"
        placeholder="开始写笔记..."
        @change="onContentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '../stores/notes';
import { useSettingsStore } from '../stores/settings';
import MarkdownEditor from '../components/editor/MarkdownEditor.vue';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const settingsStore = useSettingsStore();

// 响应式状态
const noteTitle = ref('');
const noteContent = ref('');
const hasChanges = ref(false);
const saveTimer = ref<number | null>(null);

// 计算属性
const currentNote = computed(() => notesStore.currentNote);
const showLineNumbers = computed(() => settingsStore.showLineNumbers);

// 方法
async function loadNote(id: string) {
  try {
    const note = await notesStore.loadNoteById(parseInt(id));
    if (note) {
      noteTitle.value = note.title;
      noteContent.value = note.content;
      hasChanges.value = false;
    }
  } catch (error) {
    console.error('加载笔记失败:', error);
  }
}

async function saveNote() {
  if (!currentNote.value || !hasChanges.value) return;
  
  try {
    await notesStore.updateNote(currentNote.value.id!, {
      title: noteTitle.value,
      content: noteContent.value,
    });
    hasChanges.value = false;
  } catch (error) {
    console.error('保存笔记失败:', error);
  }
}

function onContentChange() {
  hasChanges.value = true;
  
  // 自动保存
  if (saveTimer.value) {
    clearTimeout(saveTimer.value);
  }
  
  saveTimer.value = window.setTimeout(() => {
    saveNote();
  }, 2000); // 2秒后自动保存
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadNote(newId as string);
  }
}, { immediate: true });

// 监听标题变化
watch(noteTitle, () => {
  hasChanges.value = true;
});

onMounted(() => {
  // 如果有路由参数，加载对应笔记
  if (route.params.id) {
    loadNote(route.params.id as string);
  }
});

onUnmounted(() => {
  // 清理定时器
  if (saveTimer.value) {
    clearTimeout(saveTimer.value);
  }
  
  // 保存未保存的更改
  if (hasChanges.value) {
    saveNote();
  }
});
</script>

<style scoped>
.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

.prose {
  @apply text-gray-900;
}

.dark .prose {
  @apply text-gray-100;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  @apply text-gray-900 dark:text-gray-100;
}

.prose p {
  @apply text-gray-700 dark:text-gray-300;
}

.prose code {
  @apply bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded;
}

.prose pre {
  @apply bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto;
}

.prose blockquote {
  @apply border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400;
}
</style>
