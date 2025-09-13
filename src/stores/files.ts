import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './settings';
import * as path from 'path-browserify';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: Date;
  created: Date;
}

export interface TreeNode extends FileItem {
  children?: TreeNode[];
  isExpanded?: boolean;
  level?: number;
  parent?: TreeNode;
}

export const useFilesStore = defineStore('files', () => {
  const settingsStore = useSettingsStore();
  
  // 状态
  const currentPath = ref('');
  const files = ref<FileItem[]>([]);
  const selectedFile = ref<FileItem | null>(null);
  const loading = ref(false);
  const error = ref('');
  
  // 树形结构状态
  const treeData = ref<TreeNode[]>([]);
  const expandedNodes = ref<Set<string>>(new Set());
  const useTreeView = ref(true); // 是否使用树形视图
  const currentWorkingDirectory = ref(''); // 当前工作目录

  // 计算属性
  const currentFiles = computed(() => 
    files.value.filter(item => item.isFile && (item.name.endsWith('.md') || item.name.endsWith('.markdown')))
  );
  
  const currentDirectories = computed(() => 
    files.value.filter(item => item.isDirectory)
  );

  const parentPath = computed(() => {
    if (!currentPath.value || currentPath.value === settingsStore.workspaceDirectory) {
      return null;
    }
    return path.dirname(currentPath.value);
  });

  const breadcrumbs = computed(() => {
    if (!currentPath.value || !settingsStore.workspaceDirectory) return [];
    
    const relativePath = path.relative(settingsStore.workspaceDirectory, currentPath.value);
    if (!relativePath || relativePath === '.') {
      return [{ name: 'Warehouse', path: settingsStore.workspaceDirectory }];
    }
    
    const parts = relativePath.split(path.sep);
    const breadcrumbs = [{ name: 'Warehouse', path: settingsStore.workspaceDirectory }];
    
    let currentBreadcrumbPath = settingsStore.workspaceDirectory;
    for (const part of parts) {
      currentBreadcrumbPath = path.join(currentBreadcrumbPath, part);
      breadcrumbs.push({ name: part, path: currentBreadcrumbPath });
    }
    
    return breadcrumbs;
  });

  // 展平的树形节点（用于渲染）
  const flattenedTree = computed(() => {
    const result: TreeNode[] = [];
    
    function flatten(nodes: TreeNode[], level = 0) {
      for (const node of nodes) {
        // 直接设置level属性而不是创建新对象
        node.level = level;
        result.push(node);
        
        if (node.isDirectory && node.isExpanded && node.children) {
          flatten(node.children, level + 1);
        }
      }
    }
    
    flatten(treeData.value);
    return result;
  });

  // 方法
  async function loadDirectory(dirPath?: string) {
    try {
      loading.value = true;
      error.value = '';
      
      const targetPath = dirPath || settingsStore.workspaceDirectory || await window.electronAPI.fs.getWarehouseDir();
      
      // 确保目录存在
      const exists = await window.electronAPI.fs.exists(targetPath);
      if (!exists) {
        await window.electronAPI.fs.createDir(targetPath);
      }
      
      currentPath.value = targetPath;
      const items = await window.electronAPI.fs.readDir(targetPath);
      
      files.value = items.map((item: any) => ({
        ...item,
        modified: new Date(item.modified),
        created: new Date(item.created),
      }));
      
    } catch (err) {
      console.error('Failed to load directory:', err);
      error.value = '读取目录失败';
    } finally {
      loading.value = false;
    }
  }

  async function navigateToParent() {
    if (parentPath.value) {
      await loadDirectory(parentPath.value);
    }
  }

  async function navigateToPath(targetPath: string) {
    await loadDirectory(targetPath);
  }

  async function createDirectory(name: string, targetDir?: string) {
    try {
      let targetPath: string;
      
      if (targetDir) {
        // 使用指定的目录
        targetPath = targetDir;
      } else if (currentWorkingDirectory.value) {
        // 使用当前工作目录
        targetPath = currentWorkingDirectory.value;
      } else if (useTreeView.value) {
        // 使用根目录
        targetPath = settingsStore.workspaceDirectory || await window.electronAPI.fs.getWarehouseDir();
      } else {
        // 使用当前路径
        targetPath = currentPath.value;
      }
        
      const newDirPath = path.join(targetPath, name);
      await window.electronAPI.fs.createDir(newDirPath);
      
      if (useTreeView.value) {
        await refreshTree();
      } else {
        await loadDirectory(currentPath.value);
      }
      
      return newDirPath;
    } catch (err) {
      console.error('Failed to create directory:', err);
      throw new Error('创建目录失败');
    }
  }

  async function createFile(name: string, content: string = '', targetDir?: string) {
    try {
      let targetPath: string;
      
      if (targetDir) {
        // 使用指定的目录
        targetPath = targetDir;
      } else if (currentWorkingDirectory.value) {
        // 使用当前工作目录
        targetPath = currentWorkingDirectory.value;
      } else if (useTreeView.value) {
        // 使用根目录
        targetPath = settingsStore.workspaceDirectory || await window.electronAPI.fs.getWarehouseDir();
      } else {
        // 使用当前路径
        targetPath = currentPath.value;
      }
      
      const newFilePath = path.join(targetPath, name);
      await window.electronAPI.fs.writeFile(newFilePath, content);
      
      if (useTreeView.value) {
        await refreshTree();
      } else {
        await loadDirectory(currentPath.value);
      }
      
      return newFilePath;
    } catch (err) {
      console.error('Failed to create file:', err);
      throw new Error('创建文件失败');
    }
  }

  async function deleteItem(item: FileItem) {
    try {
      await window.electronAPI.fs.delete(item.path);
      
      if (useTreeView.value) {
        await refreshTree();
      } else {
        await loadDirectory(currentPath.value);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      throw new Error('删除失败');
    }
  }

  async function renameItem(item: FileItem, newName: string) {
    try {
      const newPath = path.join(path.dirname(item.path), newName);
      await window.electronAPI.fs.rename(item.path, newPath);
      
      if (useTreeView.value) {
        await refreshTree();
      } else {
        await loadDirectory(currentPath.value);
      }
      
      return newPath;
    } catch (err) {
      console.error('Failed to rename item:', err);
      throw new Error('重命名失败');
    }
  }

  async function readFile(filePath: string) {
    try {
      return await window.electronAPI.fs.readFile(filePath);
    } catch (err) {
      console.error('Failed to read file:', err);
      throw new Error('读取文件失败');
    }
  }

  async function writeFile(filePath: string, content: string) {
    try {
      await window.electronAPI.fs.writeFile(filePath, content);
    } catch (err) {
      console.error('Failed to write file:', err);
      throw new Error('保存文件失败');
    }
  }

  function selectFile(file: FileItem | null) {
    selectedFile.value = file;
  }

  function setCurrentWorkingDirectory(dirPath: string) {
    currentWorkingDirectory.value = dirPath;
  }

  // 树形结构方法
  async function buildTreeData(rootPath?: string): Promise<TreeNode[]> {
    const targetPath = rootPath || settingsStore.workspaceDirectory || await window.electronAPI.fs.getWarehouseDir();
    
    try {
      const items = await window.electronAPI.fs.readDir(targetPath);
      const treeNodes: TreeNode[] = [];
      
      for (const item of items) {
        const treeNode: TreeNode = {
          ...item,
          modified: new Date(item.modified),
          created: new Date(item.created),
          children: item.isDirectory ? [] : undefined,
          isExpanded: expandedNodes.value.has(item.path),
          level: 0
        };
        
        treeNodes.push(treeNode);
      }
      
      return treeNodes.sort((a, b) => {
        // 目录优先，然后按名称排序
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('构建树形数据失败:', error);
      return [];
    }
  }

  async function loadNodeChildren(node: TreeNode): Promise<void> {
    if (!node.isDirectory || node.children === undefined) return;
    
    try {
      const children = await buildTreeData(node.path);
      // 为子节点设置父节点引用
      children.forEach(child => {
        child.parent = node;
        child.level = (node.level || 0) + 1;
      });
      
      node.children = children;
    } catch (error) {
      console.error('加载子节点失败:', error);
      node.children = [];
    }
  }

  async function toggleNode(node: TreeNode): Promise<void> {
    if (!node.isDirectory) return;
    
    const wasExpanded = node.isExpanded;
    node.isExpanded = !wasExpanded;
    
    if (node.isExpanded) {
      expandedNodes.value.add(node.path);
      
      // 如果是第一次展开，加载子节点
      if (!node.children || node.children.length === 0) {
        await loadNodeChildren(node);
      }
    } else {
      expandedNodes.value.delete(node.path);
    }
    
    // 强制触发响应式更新
    const currentTree = [...treeData.value];
    treeData.value = currentTree;
  }

  function findNodeByPath(path: string, nodes: TreeNode[] = treeData.value): TreeNode | null {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(path, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  async function refreshTree(): Promise<void> {
    try {
      loading.value = true;
      error.value = '';
      
      const rootPath = settingsStore.workspaceDirectory || await window.electronAPI.fs.getWarehouseDir();
      treeData.value = await buildTreeData(rootPath);
      
      // 重新展开之前展开的节点
      for (const expandedPath of expandedNodes.value) {
        const node = findNodeByPath(expandedPath);
        if (node) {
          node.isExpanded = true;
          await loadNodeChildren(node);
        }
      }
    } catch (err) {
      console.error('刷新树形结构失败:', err);
      error.value = '刷新树形结构失败';
    } finally {
      loading.value = false;
    }
  }

  // 初始化
  async function initialize() {
    await settingsStore.loadSettings();
    if (useTreeView.value) {
      await refreshTree();
    } else {
      await loadDirectory();
    }
  }

  return {
    // 状态
    currentPath,
    files,
    selectedFile,
    loading,
    error,
    
    // 树形结构状态
    treeData,
    expandedNodes,
    useTreeView,
    currentWorkingDirectory,
    
    // 计算属性
    currentFiles,
    currentDirectories,
    parentPath,
    breadcrumbs,
    flattenedTree,
    
    // 方法
    loadDirectory,
    navigateToParent,
    navigateToPath,
    createDirectory,
    createFile,
    deleteItem,
    renameItem,
    readFile,
    writeFile,
    selectFile,
    setCurrentWorkingDirectory,
    initialize,
    
    // 树形结构方法
    buildTreeData,
    loadNodeChildren,
    toggleNode,
    findNodeByPath,
    refreshTree,
  };
});
