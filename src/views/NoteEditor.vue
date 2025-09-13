<template>
  <div class="h-full flex flex-col">
    <!-- 笔记标题栏 -->
    <div class="border-b border-gray-200 dark:border-dark-600 p-4">
      <div class="flex items-center justify-between">
        <input
          v-model="noteTitle"
          type="text"
          placeholder="请输入标题..."
          class="flex-1 text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          @blur="saveNote"
        />
        
        <!-- 更多选项按钮 -->
        <div class="relative ml-4">
          <button
            @click="toggleMoreOptions"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400 transition-colors duration-200"
            :class="{ 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100': showMoreOptions }"
            title="更多选项"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>
          
          <!-- 下拉菜单 -->
          <div
            v-if="showMoreOptions"
            class="more-options-menu absolute right-0 top-full mt-1 w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg py-2 z-50"
            @click.stop
          >
            <!-- 文件操作区域 -->
            <div class="menu-section">
              <div class="menu-section-title">文件操作</div>
              <button @click="saveNote" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                保存
                <span class="text-xs text-gray-400 ml-auto">Ctrl+S</span>
              </button>
              <button @click="undoAction" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
                </svg>
                撤销
                <span class="text-xs text-gray-400 ml-auto">Ctrl+Z</span>
              </button>
              <button @click="redoAction" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                重做
                <span class="text-xs text-gray-400 ml-auto">Ctrl+Y</span>
              </button>
              <button @click="showFindReplace = true" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
                查找替换
                <span class="text-xs text-gray-400 ml-auto">Ctrl+F</span>
              </button>
              <button @click="toggleBookmark" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                </svg>
                {{ isBookmarked ? '取消收藏' : '收藏' }}
              </button>
              <button @click="renameNote" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
                重命名
              </button>
              <button @click="deleteNote" class="menu-item text-red-600 dark:text-red-400">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                删除
              </button>
              <button @click="openInExplorer" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                </svg>
                在文件管理器中打开
              </button>
            </div>
            
            <div class="menu-divider"></div>
            
            <!-- 阅读编辑模式区域 -->
            <div class="menu-section">
              <div class="menu-section-title">阅读编辑模式</div>
              <button @click="setViewMode('edit')" class="menu-item" :class="{ 'bg-gray-50 dark:bg-dark-700': viewMode === 'edit' }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
                编辑模式
              </button>
              <button @click="setViewMode('read')" class="menu-item" :class="{ 'bg-gray-50 dark:bg-dark-700': viewMode === 'read' }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                阅读模式
              </button>
              <button @click="setViewMode('source')" class="menu-item" :class="{ 'bg-gray-50 dark:bg-dark-700': viewMode === 'source' }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                源码模式
              </button>
              <button @click="toggleToolbar" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                </svg>
                {{ showToolbar ? '隐藏工具栏' : '显示工具栏' }}
              </button>
            </div>
            
            <div class="menu-divider"></div>
            
            <!-- 区域分割区域 -->
            <div class="menu-section">
              <div class="menu-section-title">区域分割</div>
              <button @click="setLayoutMode('single')" class="menu-item" :class="{ 'bg-gray-50 dark:bg-dark-700': layoutMode === 'single' }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clip-rule="evenodd"/>
                </svg>
                单屏模式
              </button>
              <button @click="setLayoutMode('vertical')" class="menu-item" :class="{ 'bg-gray-50 dark:bg-dark-700': layoutMode === 'vertical' }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v4h10V5H5zm0 6v4h10v-4H5z" clip-rule="evenodd"/>
                </svg>
                上下分屏
              </button>
              <button @click="setLayoutMode('horizontal')" class="menu-item" :class="{ 'bg-gray-50 dark:bg-dark-700': layoutMode === 'horizontal' }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h4V5H5zm6 0v10h4V5h-4z" clip-rule="evenodd"/>
                </svg>
                左右分屏
              </button>
            </div>
            
            <div class="menu-divider"></div>
            
            <!-- 发布和导出区域 -->
            <div class="menu-section">
              <div class="menu-section-title">发布导出</div>
              <button @click="publishDocument" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                </svg>
                {{ isPublished ? '取消发布' : '发布文档' }}
              </button>
              <button @click="exportDocument('html')" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                导出为HTML
              </button>
              <button @click="exportDocument('pdf')" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"/>
                </svg>
                导出为PDF
              </button>
              <button @click="exportAsTextFile" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                </svg>
                导出为文件
              </button>
              <button @click="importFiles" class="menu-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
                导入文件
              </button>
            </div>
          </div>
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
        @save="saveNote"
        :view-mode="viewMode"
        :layout-mode="layoutMode"
        :show-toolbar="showToolbar"
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

// 更多选项菜单状态
const showMoreOptions = ref(false);
const showFindReplace = ref(false);
const viewMode = ref<'edit' | 'read' | 'source'>('edit');
const layoutMode = ref<'single' | 'horizontal' | 'vertical'>('single');
const isBookmarked = ref(false);
const isPublished = ref(false);
const showToolbar = ref(true);

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

async function deleteNote() {
  if (!currentNote.value) return;
  
  if (confirm(`确定要删除笔记"${noteTitle.value}"吗？此操作不可撤销。`)) {
    try {
      await notesStore.deleteNote(currentNote.value.id!);
      router.push('/dashboard');
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  }
}

async function renameNote(newName: string) {
  if (!currentNote.value) return;
  
  try {
    noteTitle.value = newName;
    await saveNote();
  } catch (error) {
    console.error('重命名笔记失败:', error);
  }
}

// 更多选项菜单方法
function toggleMoreOptions() {
  showMoreOptions.value = !showMoreOptions.value;
}

function undoAction() {
  // 发送键盘事件给 MarkdownEditor 处理
  const event = new KeyboardEvent('keydown', {
    key: 'z',
    ctrlKey: true,
    bubbles: true
  });
  document.dispatchEvent(event);
  showMoreOptions.value = false;
}

function redoAction() {
  // 发送键盘事件给 MarkdownEditor 处理
  const event = new KeyboardEvent('keydown', {
    key: 'y',
    ctrlKey: true,
    bubbles: true
  });
  document.dispatchEvent(event);
  showMoreOptions.value = false;
}

function toggleBookmark() {
  isBookmarked.value = !isBookmarked.value;
  showMoreOptions.value = false;
}

async function openInExplorer() {
  // 通过 Electron API 在文件管理器中打开
  if (window.electronAPI?.fs?.showItemInFolder) {
    window.electronAPI.fs.showItemInFolder();
  }
  showMoreOptions.value = false;
}

// 导入文件
async function importFiles() {
  try {
    const result = await window.electronAPI.fs.showOpenDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      for (const filePath of result.filePaths) {
        const content = await window.electronAPI.fs.readFile(filePath);
        const fileName = filePath.split(/[/\\]/).pop()?.replace(/\.(md|markdown|txt)$/i, '') || 'Imported Note';
        
        // 创建新笔记
        const newNote = await notesStore.createNote({
          title: fileName,
          content: content,
          category: 'Imported',
          tags: 'imported',
        });
        
        console.log(`成功导入文件: ${fileName}`);
      }
      
      // 刷新笔记列表
      await notesStore.loadNotes();
    }
  } catch (error) {
    console.error('导入文件失败:', error);
    alert('导入文件失败，请检查文件格式和权限。');
  }
  showMoreOptions.value = false;
}

// 导出为文本文件
async function exportAsTextFile() {
  try {
    const result = await window.electronAPI.fs.showSaveDialog(`${noteTitle.value}.md`);
    if (!result.canceled && result.filePath) {
      await window.electronAPI.fs.writeFile(result.filePath, noteContent.value);
      console.log(`文件已保存到: ${result.filePath}`);
      alert('文件导出成功！');
    }
  } catch (error) {
    console.error('导出文件失败:', error);
    alert('导出文件失败，请检查权限。');
  }
  showMoreOptions.value = false;
}

function setViewMode(mode: 'edit' | 'read' | 'source') {
  viewMode.value = mode;
  showMoreOptions.value = false;
}

function setLayoutMode(mode: 'single' | 'horizontal' | 'vertical') {
  layoutMode.value = mode;
  showMoreOptions.value = false;
}

function toggleToolbar() {
  showToolbar.value = !showToolbar.value;
  showMoreOptions.value = false;
}

function publishDocument() {
  isPublished.value = !isPublished.value;
  showMoreOptions.value = false;
  
  if (isPublished.value) {
    console.log('文档已发布，其他人可以通过订阅功能查看');
  } else {
    console.log('文档已取消发布');
  }
}

function exportDocument(format: 'html' | 'pdf' | 'md') {
  showMoreOptions.value = false;
  
  const renderedContent = ''; // 这里需要从MarkdownEditor获取渲染内容
  
  switch (format) {
    case 'html':
      exportAsHTML(renderedContent);
      break;
    case 'pdf':
      exportAsPDF();
      break;
    case 'md':
      exportAsMarkdown();
      break;
  }
}

function exportAsHTML(renderedContent: string) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${noteTitle.value}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 2px; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; font-style: italic; }
  </style>
</head>
<body>
${renderedContent}
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${noteTitle.value}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsPDF() {
  window.print();
}

function exportAsMarkdown() {
  const blob = new Blob([noteContent.value], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${noteTitle.value}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// 点击外部关闭菜单
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.closest('.more-options-menu') && !target.closest('button')) {
    showMoreOptions.value = false;
  }
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
  
  // 添加点击外部关闭菜单事件
  document.addEventListener('click', handleClickOutside);
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
  
  // 移除事件监听器
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

/* 更多选项菜单样式 */
.more-options-menu {
  max-height: 80vh;
  overflow-y: auto;
}

.menu-section {
  @apply px-1 py-1;
}

.menu-section-title {
  @apply px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.menu-item {
  @apply w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md;
  @apply transition-colors duration-150;
}

.menu-item svg {
  @apply mr-3 flex-shrink-0;
}

.menu-item:hover {
  @apply text-gray-900 dark:text-gray-100;
}

.menu-divider {
  @apply border-t border-gray-200 dark:border-dark-600 my-1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .more-options-menu {
    @apply w-56 right-0;
  }
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
