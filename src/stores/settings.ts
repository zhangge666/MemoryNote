import { defineStore } from 'pinia';
import { ref } from 'vue';
import { setLocale, getCurrentLocale } from '../locales';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'zh-CN' | 'en-US';

export const useSettingsStore = defineStore('settings', () => {
  // 设置状态
  const theme = ref<Theme>('light');
  const language = ref<Language>('zh-CN');
  const fontSize = ref(14);
  const fontFamily = ref('system');
  const autoSave = ref(true);
  const autoSaveInterval = ref(30); // 秒
  const showLineNumbers = ref(false);
  const wordWrap = ref(true);
  const spellCheck = ref(true);
  
  // 文件系统设置
  const workspaceDirectory = ref(''); // 工作目录路径

  // 复习设置
  const reviewNotifications = ref(true);
  const reviewSound = ref(false);
  const dailyReviewGoal = ref(20);

  // 用户信息
  const userName = ref('用户');
  const userAvatar = ref('');
  const userEmail = ref('');

  // 方法
  async function loadSettings() {
    try {
      // 从Electron存储加载设置
      const savedTheme = await window.electronAPI.settings.get('theme');
      const savedLanguage = await window.electronAPI.settings.get('language');
      const savedFontSize = await window.electronAPI.settings.get('fontSize');
      const savedUserName = await window.electronAPI.settings.get('userName');
      const savedWorkspaceDir = await window.electronAPI.settings.get('workspaceDirectory');
      
      if (savedTheme) theme.value = savedTheme as Theme;
      if (savedLanguage) {
        language.value = savedLanguage as Language;
        // 同步更新i18n语言
        setLocale(savedLanguage);
      } else {
        // 如果没有保存的语言设置，使用i18n的当前语言
        language.value = getCurrentLocale() as Language;
      }
      if (savedFontSize) fontSize.value = parseInt(savedFontSize);
      if (savedUserName) userName.value = savedUserName;
      
      // 设置工作目录，如果没有设置则使用默认的Warehouse目录
      if (savedWorkspaceDir) {
        workspaceDirectory.value = savedWorkspaceDir;
      } else {
        const defaultDir = await window.electronAPI.fs.getWarehouseDir();
        workspaceDirectory.value = defaultDir;
        await window.electronAPI.settings.set('workspaceDirectory', defaultDir);
      }
      
      console.log('设置已加载');
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  async function saveSettings() {
    try {
      await window.electronAPI.settings.set('theme', theme.value);
      await window.electronAPI.settings.set('language', language.value);
      await window.electronAPI.settings.set('fontSize', fontSize.value.toString());
      await window.electronAPI.settings.set('userName', userName.value);
      await window.electronAPI.settings.set('workspaceDirectory', workspaceDirectory.value);
      
      console.log('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    saveSettings();
  }

  function setLanguage(newLanguage: Language) {
    language.value = newLanguage;
    // 同步更新i18n语言
    setLocale(newLanguage);
    saveSettings();
  }

  function setFontSize(size: number) {
    fontSize.value = Math.max(12, Math.min(24, size));
    saveSettings();
  }

  function setUserName(name: string) {
    userName.value = name;
    saveSettings();
  }

  function setUserAvatar(avatar: string) {
    userAvatar.value = avatar;
    saveSettings();
  }

  function setWorkspaceDirectory(dir: string) {
    workspaceDirectory.value = dir;
    saveSettings();
  }

  // 重置设置
  function resetSettings() {
    theme.value = 'light';
    language.value = 'zh-CN';
    fontSize.value = 14;
    fontFamily.value = 'system';
    autoSave.value = true;
    autoSaveInterval.value = 30;
    showLineNumbers.value = false;
    wordWrap.value = true;
    spellCheck.value = true;
    reviewNotifications.value = true;
    reviewSound.value = false;
    dailyReviewGoal.value = 20;
    userName.value = '用户';
    userAvatar.value = '';
    userEmail.value = '';
    
    saveSettings();
  }

  return {
    // 状态
    theme,
    language,
    fontSize,
    fontFamily,
    autoSave,
    autoSaveInterval,
    showLineNumbers,
    wordWrap,
    spellCheck,
    reviewNotifications,
    reviewSound,
    dailyReviewGoal,
    userName,
    userAvatar,
    userEmail,
    workspaceDirectory,
    
    // 方法
    loadSettings,
    saveSettings,
    setTheme,
    setLanguage,
    setFontSize,
    setUserName,
    setUserAvatar,
    setWorkspaceDirectory,
    resetSettings,
  };
});
