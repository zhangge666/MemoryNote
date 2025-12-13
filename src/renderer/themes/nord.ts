/**
 * Ocean Breeze 主题 - 清新海洋风
 * 阶段 8: 主题系统
 */

import type { Theme } from '@shared/types/theme';

export const nordTheme: Theme = {
  id: 'ocean-breeze',
  name: 'Ocean Breeze',
  version: '1.0.0',
  author: 'MemoryNote',
  description: '清新海洋风格的亮色主题',
  type: 'light',
  colors: {
    // 基础颜色 - 海洋蓝绿色系
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    secondary: '#64748b',
    accent: '#14b8a6',
    
    // 背景颜色 - 海洋清新
    background: '#f0fdfa',
    backgroundSecondary: '#ccfbf1',
    backgroundTertiary: '#99f6e4',
    backgroundHover: '#e0f2fe',
    
    // 文本颜色
    text: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    textInverse: '#ffffff',
    
    // 边框颜色
    border: '#a5f3fc',
    borderLight: '#cffafe',
    borderActive: '#06b6d4',
    
    // 状态颜色
    success: '#14b8a6',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    // 侧边栏
    sidebarBackground: '#ecfeff',
    sidebarText: '#0f172a',
    sidebarHover: '#cffafe',
    sidebarActive: '#a5f3fc',
    
    // 标题栏
    titlebarBackground: '#f0fdfa',
    titlebarText: '#0f172a',
    
    // 标签页
    tabBackground: '#cffafe',
    tabActive: '#f0fdfa',
    tabHover: '#a5f3fc',
    tabText: '#475569',
    tabActiveText: '#0f172a',
    
    // 编辑器颜色
    editorBackground: '#f0fdfa',
    editorText: '#0f172a',
    editorSelection: '#cffafe',
    editorCursor: '#06b6d4',
    editorLineNumber: '#64748b',
    editorGutter: '#ecfeff',
    
    // 语法高亮
    syntaxKeyword: '#7c3aed',
    syntaxString: '#14b8a6',
    syntaxComment: '#94a3b8',
    syntaxFunction: '#0891b2',
    syntaxVariable: '#f97316',
    syntaxNumber: '#8b5cf6',
    syntaxOperator: '#64748b',
    syntaxTag: '#ec4899',
    syntaxAttribute: '#0891b2',
    
    // Markdown 高亮
    markdownHeading: '#0f172a',
    markdownBold: '#0f172a',
    markdownItalic: '#334155',
    markdownCode: '#f97316',
    markdownCodeBlock: '#ecfeff',
    markdownLink: '#06b6d4',
    markdownQuote: '#64748b',
    
    // 滚动条
    scrollbarTrack: '#ecfeff',
    scrollbarThumb: '#a5f3fc',
    scrollbarThumbHover: '#67e8f9',
    
    // 输入框
    inputBackground: '#ffffff',
    inputBorder: '#a5f3fc',
    inputFocus: '#06b6d4',
    inputText: '#0f172a',
    inputPlaceholder: '#94a3b8',
    
    // 按钮
    buttonBackground: '#06b6d4',
    buttonHover: '#0891b2',
    buttonActive: '#0e7490',
    buttonText: '#ffffff',
    buttonDisabled: '#cbd5e1',
    
    // 通知
    notificationBackground: '#ffffff',
    notificationBorder: '#a5f3fc',
    notificationText: '#0f172a',
    
    // 工具提示
    tooltipBackground: '#0f172a',
    tooltipText: '#ffffff',
    
    // 分隔线
    divider: '#a5f3fc',
    
    // 阴影
    shadow: 'rgba(6, 182, 212, 0.15)',
    shadowLight: 'rgba(6, 182, 212, 0.08)',
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
