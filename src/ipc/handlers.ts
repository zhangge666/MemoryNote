import { ipcMain, app } from 'electron';
import { DatabaseManager, Note, ReviewRecord, Tag } from '../database/DatabaseManager';
import { SpacedRepetitionService } from '../services/SpacedRepetitionService';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yauzl from 'yauzl';

export function setupIpcHandlers(dbManager: DatabaseManager) {
  const srService = new SpacedRepetitionService(dbManager);

  // 笔记相关IPC处理器
  ipcMain.handle('notes:create', async (_, note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      return dbManager.createNote(note);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getAll', async () => {
    try {
      return dbManager.getAllNotes();
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getById', async (_, id: number) => {
    try {
      return dbManager.getNoteById(id);
    } catch (error) {
      console.error('Error getting note by id:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:update', async (_, id: number, updates: Partial<Note>) => {
    try {
      return dbManager.updateNote(id, updates);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:delete', async (_, id: number) => {
    try {
      return dbManager.deleteNote(id);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:search', async (_, query: string) => {
    try {
      return dbManager.searchNotes(query);
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:createFolder', async (_, title: string, parentId?: number) => {
    try {
      return dbManager.createFolder(title, parentId);
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getTree', async () => {
    try {
      return dbManager.getNotesTree();
    } catch (error) {
      console.error('Error getting notes tree:', error);
      throw error;
    }
  });

  ipcMain.handle('notes:getByParentId', async (_, parentId?: number) => {
    try {
      return dbManager.getItemsByParentId(parentId);
    } catch (error) {
      console.error('Error getting notes by parent id:', error);
      throw error;
    }
  });

  // 标签相关IPC处理器
  ipcMain.handle('tags:create', async (_, tag: Omit<Tag, 'id' | 'created_at'>) => {
    try {
      return dbManager.createTag(tag);
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  });

  ipcMain.handle('tags:getAll', async () => {
    try {
      return dbManager.getAllTags();
    } catch (error) {
      console.error('Error getting all tags:', error);
      throw error;
    }
  });

  // 复习相关IPC处理器
  ipcMain.handle('reviews:getDue', async () => {
    try {
      return dbManager.getDueReviews();
    } catch (error) {
      console.error('Error getting due reviews:', error);
      throw error;
    }
  });

  ipcMain.handle('reviews:submit', async (_, noteId: number, quality: number) => {
    try {
      return await srService.submitReview(noteId, quality);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  });

  ipcMain.handle('reviews:getByNoteId', async (_, noteId: number) => {
    try {
      return dbManager.getReviewRecordsByNoteId(noteId);
    } catch (error) {
      console.error('Error getting review records:', error);
      throw error;
    }
  });

  // 设置相关IPC处理器
  ipcMain.handle('settings:get', async (_, key: string) => {
    try {
      return dbManager.getSetting(key);
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    try {
      dbManager.setSetting(key, value);
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  });

  // 文件系统相关IPC处理器
  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      const fs = require('fs').promises;
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  ipcMain.handle('fs:showOpenDialog', async () => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Markdown Files', extensions: ['md', 'markdown'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('fs:showSaveDialog', async (_, defaultPath?: string) => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showSaveDialog({
        defaultPath,
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  });

  // 获取默认Warehouse目录
  ipcMain.handle('fs:getWarehouseDir', async () => {
    try {
      const appDataPath = app.getPath('userData');
      const warehouseDir = path.join(appDataPath, 'Warehouse');
      
      // 确保目录存在
      try {
        await fs.access(warehouseDir);
      } catch {
        await fs.mkdir(warehouseDir, { recursive: true });
      }
      
      return warehouseDir;
    } catch (error) {
      console.error('Error getting warehouse directory:', error);
      throw error;
    }
  });

  // 获取附件目录
  ipcMain.handle('fs:getAttachmentsDir', async () => {
    try {
      const appDataPath = app.getPath('userData');
      const attachmentsDir = path.join(appDataPath, 'Warehouse', 'attachments');
      
      // 确保附件目录存在
      try {
        await fs.access(attachmentsDir);
      } catch {
        await fs.mkdir(attachmentsDir, { recursive: true });
      }
      
      return attachmentsDir;
    } catch (error) {
      console.error('Error getting attachments directory:', error);
      throw error;
    }
  });

  // 保存图片文件到附件目录
  ipcMain.handle('fs:saveImage', async (_, imageData: string, fileName: string) => {
    try {
      const appDataPath = app.getPath('userData');
      const attachmentsDir = path.join(appDataPath, 'Warehouse', 'attachments');
      
      // 确保附件目录存在
      await fs.mkdir(attachmentsDir, { recursive: true });
      
      // 从base64数据中提取真实的图片数据
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filePath = path.join(attachmentsDir, fileName);
      await fs.writeFile(filePath, buffer);
      
      return filePath;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw error;
    }
  });

  // 读取目录内容
  ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const result = [];
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const stats = await fs.stat(itemPath);
        
        result.push({
          name: item.name,
          path: itemPath,
          isDirectory: item.isDirectory(),
          isFile: item.isFile(),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
        });
      }
      
      return result.sort((a, b) => {
        // 目录优先，然后按名称排序
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  });

  // 创建目录
  ipcMain.handle('fs:createDir', async (_, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  });

  // 删除文件或目录
  ipcMain.handle('fs:delete', async (_, itemPath: string) => {
    try {
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        await fs.rmdir(itemPath, { recursive: true });
      } else {
        await fs.unlink(itemPath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  });

  // 重命名文件或目录
  ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  });

  // 检查路径是否存在
  ipcMain.handle('fs:exists', async (_, itemPath: string) => {
    try {
      await fs.access(itemPath);
      return true;
    } catch {
      return false;
    }
  });

  // 选择目录对话框
  ipcMain.handle('fs:showOpenDirectoryDialog', async () => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      return result;
    } catch (error) {
      console.error('Error showing open directory dialog:', error);
      throw error;
    }
  });

  // ====== 插件系统相关IPC处理器 ======

  // 获取插件目录路径
  ipcMain.handle('plugins:getPluginsDir', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const pluginsDir = path.join(userDataPath, 'plugins');
      
      // 确保插件目录存在
      try {
        await fs.access(pluginsDir);
      } catch {
        await fs.mkdir(pluginsDir, { recursive: true });
      }
      
      return pluginsDir;
    } catch (error) {
      console.error('Error getting plugins directory:', error);
      throw error;
    }
  });

  // 扫描插件目录
  ipcMain.handle('plugins:scanDirectory', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const pluginsDir = path.join(userDataPath, 'plugins');
      
      // 确保目录存在
      try {
        await fs.access(pluginsDir);
      } catch {
        await fs.mkdir(pluginsDir, { recursive: true });
        return [];
      }
      
      const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
      const plugins = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // 跳过备份目录和临时目录
          if (entry.name.includes('.backup-') || entry.name.startsWith('.temp-')) {
            console.log(`跳过备份/临时目录: ${entry.name}`);
            continue;
          }
          
          const pluginPath = path.join(pluginsDir, entry.name);
          const manifestPath = path.join(pluginPath, 'manifest.json');
          
          try {
            await fs.access(manifestPath);
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            
            plugins.push({
              path: pluginPath,
              manifest
            });
          } catch (error) {
            console.warn(`无效的插件目录: ${entry.name}`, error);
          }
        }
      }
      
      return plugins;
    } catch (error) {
      console.error('Error scanning plugins directory:', error);
      throw error;
    }
  });

  // 读取插件文件
  ipcMain.handle('plugins:readFile', async (_, pluginId: string, filePath: string) => {
    try {
      const userDataPath = app.getPath('userData');
      const pluginsDir = path.join(userDataPath, 'plugins');
      const fullPath = path.join(pluginsDir, pluginId, filePath);
      
      // 安全检查：确保路径在插件目录内
      const normalizedPluginDir = path.normalize(path.join(pluginsDir, pluginId));
      const normalizedFullPath = path.normalize(fullPath);
      
      if (!normalizedFullPath.startsWith(normalizedPluginDir)) {
        throw new Error('访问被拒绝：路径超出插件目录范围');
      }
      
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error('Error reading plugin file:', error);
      throw error;
    }
  });

  // 写入插件文件
  ipcMain.handle('plugins:writeFile', async (_, pluginId: string, filePath: string, content: string) => {
    try {
      const userDataPath = app.getPath('userData');
      const pluginsDir = path.join(userDataPath, 'plugins');
      const fullPath = path.join(pluginsDir, pluginId, filePath);
      
      // 安全检查
      const normalizedPluginDir = path.normalize(path.join(pluginsDir, pluginId));
      const normalizedFullPath = path.normalize(fullPath);
      
      if (!normalizedFullPath.startsWith(normalizedPluginDir)) {
        throw new Error('访问被拒绝：路径超出插件目录范围');
      }
      
      // 确保目录存在
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing plugin file:', error);
      throw error;
    }
  });

  // 安装插件（从ZIP文件）
  ipcMain.handle('plugins:installFromZip', async (_, zipPath: string) => {
    try {
      console.log('开始安装插件:', zipPath);
      
      // 1. 验证文件是否存在和可读
      try {
        await fs.access(zipPath, fs.constants.F_OK | fs.constants.R_OK);
      } catch {
        throw new Error(`文件不存在或无法读取: ${zipPath}`);
      }

      // 2. 检查文件大小和扩展名
      const stat = await fs.stat(zipPath);
      if (stat.size === 0) {
        throw new Error('ZIP文件为空，请检查文件是否损坏');
      }
      
      if (stat.size > 50 * 1024 * 1024) { // 50MB限制
        throw new Error('插件包过大，请检查文件大小（最大50MB）');
      }

      const fileExt = path.extname(zipPath).toLowerCase();
      if (fileExt !== '.zip') {
        throw new Error(`文件格式不正确，需要ZIP文件，当前为: ${fileExt || '无扩展名'}`);
      }

      // 3. 验证ZIP文件魔数（前几个字节）
      const buffer = Buffer.alloc(4);
      const fileHandle = await fs.open(zipPath, 'r');
      try {
        await fileHandle.read(buffer, 0, 4, 0);
        // ZIP文件应该以 50 4B 03 04 (PK..) 或 50 4B 05 06 开头
        const magicNumber = buffer.readUInt32LE(0);
        if (magicNumber !== 0x04034b50 && magicNumber !== 0x06054b50) {
          throw new Error('文件不是有效的ZIP格式，请检查文件是否损坏或格式是否正确');
        }
      } finally {
        await fileHandle.close();
      }

      // 4. 获取插件目录
      const userDataPath = app.getPath('userData');
      const pluginsDir = path.join(userDataPath, 'plugins');
      
      // 确保插件目录存在
      await fs.mkdir(pluginsDir, { recursive: true });

      // 5. 创建临时解压目录
      const tempDir = path.join(pluginsDir, '.temp-' + Date.now());
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // 6. 解压ZIP文件
        console.log('解压插件到临时目录:', tempDir);
        await extractZipFile(zipPath, tempDir);

        // 7. 查找和验证manifest.json
        const manifest = await findAndValidateManifest(tempDir);
        console.log('找到插件manifest:', manifest.name, 'v' + manifest.version);

        // 8. 检查插件是否已存在
        const targetPluginDir = path.join(pluginsDir, manifest.id);
        const pluginExists = await fs.access(targetPluginDir).then(() => true).catch(() => false);
        
        if (pluginExists) {
          // 备份现有插件
          const backupDir = path.join(pluginsDir, manifest.id + '.backup-' + Date.now());
          await fs.rename(targetPluginDir, backupDir);
          console.log('备份现有插件到:', backupDir);
        }

        // 9. 移动插件到最终位置
        await fs.rename(tempDir, targetPluginDir);
        console.log('插件安装完成:', targetPluginDir);

        return { 
          success: true, 
          message: `插件 "${manifest.name}" v${manifest.version} 安装成功`,
          pluginId: manifest.id,
          manifest: manifest
        };

      } catch (error) {
        // 清理临时目录
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        throw error;
      }

    } catch (error) {
      console.error('插件安装失败:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '安装失败' 
      };
    }
  });

  // 卸载插件
  ipcMain.handle('plugins:uninstall', async (_, pluginId: string) => {
    try {
      const userDataPath = app.getPath('userData');
      const pluginsDir = path.join(userDataPath, 'plugins');
      const pluginPath = path.join(pluginsDir, pluginId);
      
      // 安全检查
      const normalizedPluginDir = path.normalize(pluginPath);
      if (!normalizedPluginDir.startsWith(path.normalize(pluginsDir))) {
        throw new Error('访问被拒绝：无效的插件ID');
      }
      
      // 递归删除插件目录
      await fs.rm(pluginPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error('Error uninstalling plugin:', error);
      throw error;
    }
  });

  // 获取插件设置
  ipcMain.handle('plugins:getSettings', async (_, pluginId: string) => {
    try {
      const settingsKey = `plugin:${pluginId}:settings`;
      // 这里应该从数据库或配置文件读取设置
      // 暂时返回空对象
      return {};
    } catch (error) {
      console.error('Error getting plugin settings:', error);
      throw error;
    }
  });

  // 保存插件设置
  ipcMain.handle('plugins:saveSettings', async (_, pluginId: string, settings: any) => {
    try {
      const settingsKey = `plugin:${pluginId}:settings`;
      // 这里应该保存设置到数据库或配置文件
      console.log('保存插件设置:', pluginId, settings);
      return true;
    } catch (error) {
      console.error('Error saving plugin settings:', error);
      throw error;
    }
  });

  // 执行系统命令（受限权限）
  ipcMain.handle('plugins:executeCommand', async (_, pluginId: string, command: string, args: string[]) => {
    try {
      // 这里应该实现安全的命令执行
      // 包括权限检查、命令白名单等
      console.log('插件执行命令:', pluginId, command, args);
      
      // 暂时拒绝所有命令执行
      throw new Error('命令执行功能暂未启用');
    } catch (error) {
      console.error('Error executing plugin command:', error);
      throw error;
    }
  });

  // 显示系统通知
  ipcMain.handle('plugins:showNotification', async (_, title: string, body: string, options?: any) => {
    try {
      const { Notification } = require('electron');
      
      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          ...options
        });
        
        notification.show();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  });
}

// ====== 插件安装辅助函数 ======

/**
 * 解压ZIP文件到指定目录
 */
function extractZipFile(zipPath: string, extractDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        console.error('ZIP文件打开失败:', err);
        
        // 提供更具体的错误信息
        let errorMessage = '无法打开ZIP文件';
        
        if (err.message.includes('End of central directory record signature not found')) {
          errorMessage = 'ZIP文件损坏或格式不正确。请检查：\n\n' +
                        '• 文件是否完整下载\n' +
                        '• 文件是否是有效的ZIP格式\n' +
                        '• 文件是否被意外修改\n' +
                        '• 尝试重新下载或创建ZIP文件';
        } else if (err.message.includes('truncated')) {
          errorMessage = 'ZIP文件不完整或被截断。请重新下载或创建完整的ZIP文件';
        } else if (err.message.includes('ENOENT')) {
          errorMessage = '找不到指定的ZIP文件。请检查文件路径是否正确';
        } else if (err.message.includes('EACCES')) {
          errorMessage = '没有权限访问ZIP文件。请检查文件权限';
        } else {
          errorMessage = `ZIP文件错误: ${err.message}`;
        }
        
        return reject(new Error(errorMessage));
      }

      if (!zipfile) {
        return reject(new Error('ZIP文件无效'));
      }

      zipfile.readEntry();

      zipfile.on('entry', async (entry) => {
        // 安全检查：防止路径遍历攻击
        if (entry.fileName.includes('..') || path.isAbsolute(entry.fileName)) {
          console.warn('跳过不安全的文件路径:', entry.fileName);
          zipfile.readEntry();
          return;
        }

        const fullPath = path.join(extractDir, entry.fileName);

        // 确保目标目录存在
        const dir = path.dirname(fullPath);
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch (error) {
          console.error('创建目录失败:', dir, error);
          zipfile.readEntry();
          return;
        }

        if (/\/$/.test(entry.fileName)) {
          // 目录条目
          zipfile.readEntry();
        } else {
          // 文件条目
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              console.error('读取ZIP条目失败:', entry.fileName, err);
              zipfile.readEntry();
              return;
            }

            if (!readStream) {
              console.error('无法获取文件流:', entry.fileName);
              zipfile.readEntry();
              return;
            }

            // 写入文件
            const writeStream = require('fs').createWriteStream(fullPath);
            readStream.pipe(writeStream);

            writeStream.on('close', () => {
              console.log('解压文件:', entry.fileName);
              zipfile.readEntry();
            });

            writeStream.on('error', (error: Error) => {
              console.error('写入文件失败:', fullPath, error);
              zipfile.readEntry();
            });
          });
        }
      });

      zipfile.on('end', () => {
        console.log('ZIP文件解压完成');
        resolve();
      });

      zipfile.on('error', (error) => {
        reject(new Error(`解压失败: ${error.message}`));
      });
    });
  });
}

/**
 * 查找并验证插件manifest文件
 */
async function findAndValidateManifest(pluginDir: string): Promise<any> {
  // 查找manifest.json文件
  const manifestPath = path.join(pluginDir, 'manifest.json');
  
  try {
    await fs.access(manifestPath);
  } catch {
    // 如果根目录没有manifest.json，尝试在子目录中查找
    const entries = await fs.readdir(pluginDir, { withFileTypes: true });
    const subDirs = entries.filter(entry => entry.isDirectory());
    
    if (subDirs.length === 1) {
      // 如果只有一个子目录，可能插件被打包在子目录中
      const subManifestPath = path.join(pluginDir, subDirs[0].name, 'manifest.json');
      try {
        await fs.access(subManifestPath);
        // 将子目录的内容移动到根目录
        const subDir = path.join(pluginDir, subDirs[0].name);
        const tempDir = path.join(pluginDir, '.temp-move');
        await fs.rename(subDir, tempDir);
        
        const subEntries = await fs.readdir(tempDir);
        for (const subEntry of subEntries) {
          await fs.rename(
            path.join(tempDir, subEntry),
            path.join(pluginDir, subEntry)
          );
        }
        await fs.rmdir(tempDir);
        
        console.log('插件从子目录移动到根目录');
      } catch {
        throw new Error('插件包中找不到 manifest.json 文件');
      }
    } else {
      throw new Error('插件包中找不到 manifest.json 文件');
    }
  }

  // 读取和验证manifest
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // 验证必需字段
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'type', 'main'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`manifest.json 缺少必需字段: ${field}`);
      }
    }

    // 验证插件ID格式
    if (!/^[a-z0-9\-]+$/.test(manifest.id)) {
      throw new Error('插件ID只能包含小写字母、数字和连字符');
    }

    // 验证版本格式
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('版本号格式无效，应为 x.y.z 格式');
    }

    // 验证主文件是否存在
    const mainFilePath = path.join(pluginDir, manifest.main);
    try {
      await fs.access(mainFilePath);
    } catch {
      throw new Error(`插件主文件不存在: ${manifest.main}`);
    }

    // 验证插件类型
    const validTypes = ['theme', 'command', 'ui', 'editor', 'utility', 'page'];
    if (!validTypes.includes(manifest.type)) {
      throw new Error(`无效的插件类型: ${manifest.type}`);
    }

    console.log('✅ 插件manifest验证通过');
    return manifest;

  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('manifest.json 格式无效，不是有效的JSON文件');
    }
    throw error;
  }
}
