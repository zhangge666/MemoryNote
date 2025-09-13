import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

// 支持的语言列表
export const supportedLocales = [
  {
    code: 'zh-CN',
    name: '简体中文',
    flag: '🇨🇳'
  },
  {
    code: 'en-US', 
    name: 'English',
    flag: '🇺🇸'
  }
];

// 获取默认语言
function getDefaultLocale(): string {
  // 首先检查本地存储
  const stored = localStorage.getItem('app-language');
  if (stored && supportedLocales.some(locale => locale.code === stored)) {
    return stored;
  }

  // 然后检查浏览器语言
  const browserLang = navigator.language;
  
  // 精确匹配
  if (supportedLocales.some(locale => locale.code === browserLang)) {
    return browserLang;
  }
  
  // 模糊匹配（只匹配语言代码，忽略地区）
  const langCode = browserLang.split('-')[0];
  const matchedLocale = supportedLocales.find(locale => 
    locale.code.startsWith(langCode)
  );
  
  if (matchedLocale) {
    return matchedLocale.code;
  }
  
  // 默认返回中文
  return 'zh-CN';
}

// 创建 i18n 实例
export const i18n = createI18n({
  locale: getDefaultLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  },
  legacy: false, // 使用 Composition API
  globalInjection: true // 全局注入 $t
});

// 切换语言的工具函数
export function setLocale(locale: string) {
  if (supportedLocales.some(l => l.code === locale)) {
    i18n.global.locale.value = locale as any;
    localStorage.setItem('app-language', locale);
    
    // 更新 HTML lang 属性
    document.documentElement.lang = locale;
    
    return true;
  }
  return false;
}

// 获取当前语言
export function getCurrentLocale(): string {
  return i18n.global.locale.value;
}

// 获取语言显示名称
export function getLocaleDisplayName(code: string): string {
  const locale = supportedLocales.find(l => l.code === code);
  return locale ? locale.name : code;
}

// 检查是否为RTL语言
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.some(rtl => locale.startsWith(rtl));
}

export default i18n;
