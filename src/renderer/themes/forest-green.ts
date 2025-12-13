/**
 * Forest Green 主题 - 自然森林绿
 * 阶段 8: 主题系统
 */

import type { Theme } from '@shared/types/theme';

export const forestGreenTheme: Theme = {
  id: 'forest-green',
  name: 'Forest Green',
  version: '1.0.0',
  author: 'MemoryNote',
  description: '自然森林绿色调的暗色主题',
  type: 'dark',
  colors: {
    // 基础颜色 - 森林绿调
    primary: '#10b981',
    primaryHover: '#059669',
    secondary: '#94a3b8',
    accent: '#14b8a6',
    
    // 背景颜色 - 深绿灰
    background: '#0c1713',
    backgroundSecondary: '#1a2e24',
    backgroundTertiary: '#2d4436',
    backgroundHover: '#1a2e24',
    
    // 文本颜色
    text: '#e2e8f0',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    textInverse: '#0c1713',
    
    // 边框颜色
    border: '#2d4436',
    borderLight: '#1a2e24',
    borderActive: '#10b981',
    
    // 状态颜色
    success: '#10b981',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#14b8a6',
    
    // 侧边栏
    sidebarBackground: '#1a2e24',
    sidebarText: '#cbd5e1',
    sidebarHover: '#2d4436',
    sidebarActive: '#064e3b',
    
    // 标题栏
    titlebarBackground: '#0c1713',
    titlebarText: '#e2e8f0',
    
    // 标签页
    tabBackground: '#1a2e24',
    tabActive: '#0c1713',
    tabHover: '#2d4436',
    tabText: '#94a3b8',
    tabActiveText: '#e2e8f0',
    
    // 编辑器颜色
    editorBackground: '#0c1713',
    editorText: '#e2e8f0',
    editorSelection: '#064e3b',
    editorCursor: '#10b981',
    editorLineNumber: '#64748b',
    editorGutter: '#1a2e24',
    
    // 语法高亮 - 自然绿调
    syntaxKeyword: '#6ee7b7',
    syntaxString: '#34d399',
    syntaxComment: '#64748b',
    syntaxFunction: '#14b8a6',
    syntaxVariable: '#fca5a5',
    syntaxNumber: '#fbbf24',
    syntaxOperator: '#94a3b8',
    syntaxTag: '#a78bfa',
    syntaxAttribute: '#14b8a6',
    
    // Markdown 高亮
    markdownHeading: '#e2e8f0',
    markdownBold: '#e2e8f0',
    markdownItalic: '#cbd5e1',
    markdownCode: '#fca5a5',
    markdownCodeBlock: '#1a2e24',
    markdownLink: '#10b981',
    markdownQuote: '#94a3b8',
    
    // 滚动条
    scrollbarTrack: '#1a2e24',
    scrollbarThumb: '#2d4436',
    scrollbarThumbHover: '#475569',
    
    // 输入框
    inputBackground: '#1a2e24',
    inputBorder: '#2d4436',
    inputFocus: '#10b981',
    inputText: '#e2e8f0',
    inputPlaceholder: '#64748b',
    
    // 按钮
    buttonBackground: '#059669',
    buttonHover: '#10b981',
    buttonActive: '#34d399',
    buttonText: '#ffffff',
    buttonDisabled: '#2d4436',
    
    // 通知
    notificationBackground: '#1a2e24',
    notificationBorder: '#2d4436',
    notificationText: '#e2e8f0',
    
    // 工具提示
    tooltipBackground: '#e2e8f0',
    tooltipText: '#0c1713',
    
    // 分隔线
    divider: '#2d4436',
    
    // 阴影
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(0, 0, 0, 0.3)',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Consolas", "Monaco", "Courier New", monospace',
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
};
