#!/usr/bin/env node

/**
 * 创建示例插件ZIP包的脚本
 * 运行: node create-example-plugin.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function createExamplePlugin() {
  try {
    console.log('🚀 开始创建示例插件ZIP包...');
    
    const pluginDir = path.join(__dirname, 'plugins', 'example-themes');
    
    // 检查示例插件目录是否存在
    if (!fs.existsSync(pluginDir)) {
      console.error('❌ 找不到示例插件目录:', pluginDir);
      console.log('请确保项目中存在 plugins/example-themes/ 目录');
      return;
    }
    
    // 检查必需文件
    const requiredFiles = ['manifest.json', 'index.js'];
    for (const file of requiredFiles) {
      const filePath = path.join(pluginDir, file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ 缺少必需文件: ${file}`);
        return;
      }
    }
    
    console.log('✅ 示例插件文件检查通过');
    
    // 创建ZIP文件
    const zipPath = path.join(__dirname, 'example-themes-plugin.zip');
    
    // 删除旧的ZIP文件（如果存在）
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      console.log('🗑️  删除旧的ZIP文件');
    }
    
    // 尝试使用不同的方法创建ZIP
    try {
      // 方法1: 使用系统的zip命令（如果可用）
      process.chdir(pluginDir);
      execSync('zip -r "../../example-themes-plugin.zip" .', { stdio: 'inherit' });
      console.log('✅ 使用系统zip命令创建ZIP包成功');
    } catch (error) {
      try {
        // 方法2: 使用PowerShell（Windows）
        const powershellCmd = `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`;
        execSync(`powershell -Command "${powershellCmd}"`, { stdio: 'inherit' });
        console.log('✅ 使用PowerShell创建ZIP包成功');
      } catch (error2) {
        console.error('❌ 无法创建ZIP文件，请手动创建：');
        console.log('\n手动创建步骤：');
        console.log('1. 打开文件资源管理器');
        console.log('2. 进入目录:', pluginDir);
        console.log('3. 选择所有文件（Ctrl+A）');
        console.log('4. 右键点击 → 发送到 → 压缩(zipped)文件夹');
        console.log('5. 重命名为: example-themes-plugin.zip');
        return;
      }
    }
    
    // 验证创建的ZIP文件
    if (fs.existsSync(zipPath)) {
      const stat = fs.statSync(zipPath);
      console.log('📦 ZIP文件创建成功!');
      console.log(`   路径: ${zipPath}`);
      console.log(`   大小: ${(stat.size / 1024).toFixed(2)} KB`);
      
      console.log('\n🎯 测试步骤：');
      console.log('1. 启动MemoryNote应用');
      console.log('2. 点击侧边栏的插件图标');
      console.log('3. 点击"安装插件"按钮');
      console.log('4. 选择"ZIP文件"方式');
      console.log('5. 选择刚创建的ZIP文件');
      console.log('6. 点击"安装"按钮');
      console.log('7. 启用插件后使用 Ctrl+Shift+T 切换主题');
    } else {
      console.error('❌ ZIP文件创建失败');
    }
    
  } catch (error) {
    console.error('❌ 创建过程出错:', error.message);
  }
}

// 运行脚本
createExamplePlugin();

