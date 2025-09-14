#!/usr/bin/env node

/**
 * 清理插件备份目录的工具脚本
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

async function cleanupPluginBackups() {
  try {
    console.log('🧹 开始清理插件备份目录...');
    
    // 获取用户数据目录中的插件目录
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'memorynote');
    const pluginsDir = path.join(userDataPath, 'plugins');
    
    console.log('📂 插件目录:', pluginsDir);
    
    if (!fs.existsSync(pluginsDir)) {
      console.log('ℹ️  插件目录不存在，无需清理');
      return;
    }
    
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    const backupDirs = entries.filter(entry => 
      entry.isDirectory() && 
      (entry.name.includes('.backup-') || entry.name.startsWith('.temp-'))
    );
    
    if (backupDirs.length === 0) {
      console.log('✅ 没有找到备份目录，无需清理');
      return;
    }
    
    console.log(`🗂️  找到 ${backupDirs.length} 个备份/临时目录:`);
    backupDirs.forEach(dir => console.log(`   - ${dir.name}`));
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const dir of backupDirs) {
      const dirPath = path.join(pluginsDir, dir.name);
      try {
        // 递归删除目录
        await fs.promises.rm(dirPath, { recursive: true, force: true });
        console.log(`🗑️  已删除: ${dir.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ 删除失败 [${dir.name}]:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 清理完成:`);
    console.log(`   ✅ 成功删除: ${deletedCount} 个目录`);
    console.log(`   ❌ 删除失败: ${errorCount} 个目录`);
    
    if (errorCount === 0) {
      console.log('🎉 所有备份目录已成功清理！');
    }
    
  } catch (error) {
    console.error('❌ 清理过程出错:', error.message);
  }
}

// 运行清理脚本
cleanupPluginBackups();

