<template>
  <div class="w-full bg-white dark:bg-gray-800 flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
    <!-- 头部工具栏 -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        文件资源管理器
      </h2>
      
      <div class="flex items-center space-x-1">
        <!-- 新建文件按钮 -->
        <button
          @click="showCreateFileDialog"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="新建笔记 (Ctrl+N)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </button>
        
        <!-- 新建文件夹按钮 -->
        <button
          @click="showCreateFolderDialog"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="新建文件夹 (Ctrl+Shift+N)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        
        <!-- 折叠所有按钮 -->
        <button
          @click="collapseAll"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="折叠所有文件夹"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        
        <!-- 刷新按钮 -->
        <button
          @click="refreshFiles"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="刷新文件列表"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
        
        <!-- 更多选项按钮 -->
        <button
          @click="showMoreOptions = !showMoreOptions"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="更多选项"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文件..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
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
    </div>
    
    <!-- 文件树视图 -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filesStore.loading" class="p-4 text-center text-gray-500">
        <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <span class="text-sm">加载中...</span>
      </div>
      
      <div v-else-if="filesStore.error" class="p-4 text-center text-red-500">
        <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm">{{ filesStore.error }}</p>
        <button @click="refreshFiles" class="mt-2 text-blue-500 hover:text-blue-600 text-sm">重试</button>
      </div>
      
      <div v-else class="py-2">
        <div v-if="filteredTreeNodes.length === 0" class="p-8 text-center text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-sm">{{ searchQuery ? '没有找到匹配的文件' : '当前目录为空' }}</p>
          <p class="text-xs text-gray-400 mt-1">点击工具栏的 + 号开始创建文件</p>
        </div>
        
        <div v-else>
          <TreeNodeComponent
            v-for="node in filteredTreeNodes"
            :key="node.path"
            :node="node"
            :selected-path="filesStore.selectedFile?.path"
            :show-details="showFileDetails"
            @toggle="handleToggleNode"
            @select="handleSelectNode"
            @context-menu="handleContextMenu"
            @double-click="handleDoubleClick"
            @quick-create="handleQuickCreate"
            @more-actions="handleMoreActions"
          />
                </div>
              </div>
            </div>
    
    <!-- 底部状态栏 -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{{ fileCount }} 个文件</span>
        <button
          @click="showFileDetails = !showFileDetails"
          class="hover:text-gray-700 dark:hover:text-gray-300"
          :title="showFileDetails ? '隐藏详细信息' : '显示详细信息'"
        >
          {{ showFileDetails ? '隐藏详情' : '显示详情' }}
        </button>
            </div>
          </div>
          
    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :target="contextMenu.target"
      @close="closeContextMenu"
      @new-file="handleNewFile"
      @new-folder="handleNewFolder"
      @open="handleOpen"
      @open-new-tab="handleOpenNewTab"
      @rename="handleRename"
      @duplicate="handleDuplicate"
      @delete="handleDelete"
      @copy-path="handleCopyPath"
      @copy-link="handleCopyLink"
      @collapse-all="collapseAll"
      @expand-all="expandAll"
      @reveal-in-explorer="handleRevealInExplorer"
      @properties="handleProperties"
    />

    <!-- 创建文件对话框 -->
    <div v-if="showCreateDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-96 max-w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {{ dialogType === 'file' ? '创建新笔记' : '创建新文件夹' }}
        </h3>
        <input
          ref="createInputRef"
          v-model="newItemName"
          type="text"
          :placeholder="dialogType === 'file' ? '输入笔记标题...' : '输入文件夹名称...'"
          class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          @keyup.enter="confirmCreate"
          @keyup.esc="cancelCreate"
        />
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="cancelCreate"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
            <button
            @click="confirmCreate"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            :disabled="!newItemName.trim()"
            :class="{ 'opacity-50 cursor-not-allowed': !newItemName.trim() }"
          >
            创建
            </button>
        </div>
      </div>
    </div>
    
    <!-- 重命名对话框 -->
    <div v-if="showRenameDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-96 max-w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">重命名</h3>
        <input
          ref="renameInputRef"
          v-model="newName"
          type="text"
          placeholder="输入新名称..."
          class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          @keyup.enter="confirmRename"
          @keyup.esc="cancelRename"
        />
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="cancelRename"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="confirmRename"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            :disabled="!newName.trim()"
            :class="{ 'opacity-50 cursor-not-allowed': !newName.trim() }"
          >
            重命名
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useFilesStore } from '../../stores/files';
import { useTabManagerStore } from '../../stores/tabManager';
import { useAppStore } from '../../stores/app';
import type { FileItem, TreeNode } from '../../stores/files';
import TreeNodeComponent from '../ui/TreeNode.vue';
import ContextMenu from '../ui/ContextMenu.vue';

const router = useRouter();
const filesStore = useFilesStore();
const tabManager = useTabManagerStore();
const appStore = useAppStore();

// 响应式状态
const searchQuery = ref('');
const showMoreOptions = ref(false);
const showFileDetails = ref(false);

// 对话框状态
const showCreateDialog = ref(false);
const dialogType = ref<'file' | 'folder'>('file');
const newItemName = ref('');
const createInputRef = ref<HTMLInputElement>();

const showRenameDialog = ref(false);
const renamingItem = ref<FileItem | null>(null);
const newName = ref('');
const renameInputRef = ref<HTMLInputElement>();

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  target: null as FileItem | null
});

// 计算属性
const filteredTreeNodes = computed(() => {
  let nodes = filesStore.flattenedTree;
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    nodes = nodes.filter(node => node.name.toLowerCase().includes(query));
  }
  return nodes;
});

const fileCount = computed(() => {
  return filteredTreeNodes.value.filter(node => node.isFile).length;
});

// 方法
async function handleToggleNode(node: TreeNode) {
  await filesStore.toggleNode(node);
}

async function handleSelectNode(node: TreeNode) {
  if (node.isFile) {
    await openFile(node);
  }
}

function handleContextMenu(node: TreeNode, event: MouseEvent) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    target: node
  };
}

function handleDoubleClick(node: TreeNode) {
  if (node.isFile) {
    openFile(node);
  }
}

function handleQuickCreate(node: TreeNode) {
  // 快速在文件夹中创建新笔记
  if (node.isDirectory) {
    filesStore.setCurrentWorkingDirectory(node.path);
  }
  dialogType.value = 'file';
  newItemName.value = '';
  showCreateDialog.value = true;
}

function handleMoreActions(node: TreeNode, event: MouseEvent) {
  handleContextMenu(node, event);
}

function closeContextMenu() {
  contextMenu.value.visible = false;
}

// 右键菜单处理函数
function handleNewFile() {
  // 如果右键点击的是文件夹，设置为当前工作目录
  if (contextMenu.value.target?.isDirectory) {
    filesStore.setCurrentWorkingDirectory(contextMenu.value.target.path);
  }
  showCreateFileDialog();
  closeContextMenu();
}

function handleNewFolder() {
  // 如果右键点击的是文件夹，设置为当前工作目录
  if (contextMenu.value.target?.isDirectory) {
    filesStore.setCurrentWorkingDirectory(contextMenu.value.target.path);
  }
  showCreateFolderDialog();
  closeContextMenu();
}

function handleOpen() {
  if (contextMenu.value.target?.isFile) {
    openFile(contextMenu.value.target);
  }
  closeContextMenu();
}

function handleOpenNewTab() {
  // TODO: 实现在新标签中打开
  handleOpen();
}

function handleRename() {
  if (contextMenu.value.target) {
    startRename(contextMenu.value.target);
  }
  closeContextMenu();
}

function handleDuplicate() {
  // TODO: 实现复制文件功能
  closeContextMenu();
}

function handleDelete() {
  if (contextMenu.value.target) {
    deleteItem(contextMenu.value.target);
  }
  closeContextMenu();
}

async function handleCopyPath() {
  if (contextMenu.value.target) {
    try {
      await navigator.clipboard.writeText(contextMenu.value.target.path);
      // TODO: 显示成功提示
    } catch (error) {
      console.error('复制路径失败:', error);
    }
  }
  closeContextMenu();
}

async function handleCopyLink() {
  if (contextMenu.value.target?.isFile) {
    try {
      const fileName = contextMenu.value.target.name.replace(/\.(md|markdown)$/i, '');
      const link = `[[${fileName}]]`;
      await navigator.clipboard.writeText(link);
      // TODO: 显示成功提示
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  }
  closeContextMenu();
}

function handleRevealInExplorer() {
  // TODO: 实现在文件管理器中显示
  closeContextMenu();
}

function handleProperties() {
  // TODO: 实现属性对话框
  closeContextMenu();
}

// 工具栏功能
function showCreateFileDialog() {
  dialogType.value = 'file';
  newItemName.value = '';
  showCreateDialog.value = true;
  nextTick(() => {
    createInputRef.value?.focus();
  });
}

function showCreateFolderDialog() {
  dialogType.value = 'folder';
  newItemName.value = '';
  showCreateDialog.value = true;
  nextTick(() => {
    createInputRef.value?.focus();
  });
}

async function collapseAll() {
  filesStore.expandedNodes.clear();
  await filesStore.refreshTree();
}

async function expandAll() {
  // TODO: 实现展开所有功能
  console.log('展开所有功能待实现');
}

async function refreshFiles() {
  await filesStore.refreshTree();
}

function cancelCreate() {
  showCreateDialog.value = false;
  newItemName.value = '';
}

async function confirmCreate() {
  if (!newItemName.value.trim()) return;
  
  try {
    if (dialogType.value === 'file') {
      let fileName = newItemName.value;
      if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
        fileName += '.md';
      }
      await filesStore.createFile(fileName, `# ${newItemName.value}\n\n`);
  } else {
      await filesStore.createDirectory(newItemName.value);
    }
    
    await filesStore.refreshTree();
    
    // 清除当前工作目录
    filesStore.setCurrentWorkingDirectory('');
    
    cancelCreate();
  } catch (error) {
    console.error('创建失败:', error);
    alert(error instanceof Error ? error.message : '创建失败');
  }
}

function startRename(item: FileItem) {
  renamingItem.value = item;
  // 如果是文件，去掉扩展名进行编辑
  if (item.isFile && item.name.endsWith('.md')) {
    newName.value = item.name.replace(/\.md$/, '');
  } else {
    newName.value = item.name;
  }
  showRenameDialog.value = true;
  nextTick(() => {
    renameInputRef.value?.focus();
    renameInputRef.value?.select();
  });
}

function cancelRename() {
  showRenameDialog.value = false;
  renamingItem.value = null;
  newName.value = '';
}

async function confirmRename() {
  if (!renamingItem.value || !newName.value.trim()) return;
  
  try {
    let finalName = newName.value.trim();
    
    // 如果是文件且没有扩展名，自动添加.md扩展名
    if (renamingItem.value.isFile && !finalName.includes('.')) {
      finalName += '.md';
    }
    
    const oldPath = renamingItem.value.path;
    const newPath = await filesStore.renameItem(renamingItem.value, finalName);
    
    // 更新标签页信息（如果该文件已在标签页中打开）
    if (renamingItem.value.isFile) {
      tabManager.updateFilePathInTabs(oldPath, newPath, finalName);
    }
    
    await filesStore.refreshTree();
    cancelRename();
  } catch (error) {
    console.error('重命名失败:', error);
    alert(error instanceof Error ? error.message : '重命名失败');
  }
}

async function deleteItem(item: FileItem) {
  const confirmMsg = item.isDirectory ? 
    `确定要删除文件夹 "${item.name}" 及其所有内容吗？` : 
    `确定要删除文件 "${item.name}" 吗？`;
    
  if (confirm(confirmMsg)) {
    try {
      await filesStore.deleteItem(item);
      await filesStore.refreshTree();
    } catch (error) {
      console.error('删除失败:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    }
  }
}

async function openFile(file: FileItem) {
  try {
    filesStore.selectFile(file);
    const content = await filesStore.readFile(file.path);
    
    // 获取文件名（不含扩展名）作为标签标题
    const fileName = file.name.replace(/\.(md|markdown)$/i, '');
    
    // 创建或激活标签页
    tabManager.openTab({
      title: fileName,
      type: 'note',
      filePath: file.path,
      route: '/note-editor'
    });
    
    // 导航到笔记编辑页面
    router.push({
      name: 'NoteEditor',
      query: {
        filePath: file.path,
        fileName: file.name
      }
    });
    
    // 更新应用状态
    appStore.setCurrentFile({
      path: file.path,
      name: file.name,
      content: content
    });
    
  } catch (error) {
    console.error('打开文件失败:', error);
    alert('打开文件失败');
  }
}

function clearSearch() {
  searchQuery.value = '';
}

// 键盘快捷键
function handleKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'n':
        if (event.shiftKey) {
          event.preventDefault();
          showCreateFolderDialog();
        } else {
          event.preventDefault();
          showCreateFileDialog();
        }
        break;
      case 'r':
        event.preventDefault();
        refreshFiles();
        break;
    }
  }
}

// 初始化
onMounted(async () => {
  await filesStore.initialize();
  document.addEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.8);
}

/* 动画效果 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>