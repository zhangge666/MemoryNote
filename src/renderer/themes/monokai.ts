/**
 * Purple Haze 主题 - 神秘紫色
 * 阶段 8: 主题系统
 */

import type { Theme } from '@shared/types/theme';

export const monokaiTheme: Theme = {
  id: 'purple-haze',
  name: 'Purple Haze',
  version: '1.0.0',
  author: 'MemoryNote',
  description: '神秘紫色调的暗色主题',
  type: 'dark',
  colors: {
    // 基础颜色 - 紫色主调
    primary: '#a78bfa',
    primaryHover: '#8b5cf6',
    secondary: '#94a3b8',
    accent: '#c084fc',
    
    // 背景颜色 - 深紫灰
    background: '#1e1b2e',
    backgroundSecondary: '#2d2a3e',
    backgroundTertiary: '#3d3a4e',
    backgroundHover: '#2d2a3e',
    
    // 文本颜色
    text: '#e2e8f0',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    textInverse: '#1e1b2e',
    
    // 边框颜色
    border: '#3d3a4e',
    borderLight: '#2d2a3e',
    borderActive: '#a78bfa',
    
    // 状态颜色
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#a78bfa',
    
    // 侧边栏
    sidebarBackground: '#2d2a3e',
    sidebarText: '#cbd5e1',
    sidebarHover: '#3d3a4e',
    sidebarActive: '#4c1d95',
    
    // 标题栏
    titlebarBackground: '#1e1b2e',
    titlebarText: '#e2e8f0',
    
    // 标签页
    tabBackground: '#2d2a3e',
    tabActive: '#1e1b2e',
    tabHover: '#3d3a4e',
    tabText: '#94a3b8',
    tabActiveText: '#e2e8f0',
    
    // 编辑器颜色
    editorBackground: '#1e1b2e',
    editorText: '#e2e8f0',
    editorSelection: '#4c1d95',
    editorCursor: '#a78bfa',
    editorLineNumber: '#64748b',
    editorGutter: '#2d2a3e',
    
    // 语法高亮 - 紫色主调
    syntaxKeyword: '#c084fc',
    syntaxString: '#6ee7b7',
    syntaxComment: '#64748b',
    syntaxFunction: '#a78bfa',
    syntaxVariable: '#fca5a5',
    syntaxNumber: '#fbbf24',
    syntaxOperator: '#94a3b8',
    syntaxTag: '#f9a8d4',
    syntaxAttribute: '#a78bfa',
    
    // Markdown 高亮
    markdownHeading: '#e2e8f0',
    markdownBold: '#e2e8f0',
    markdownItalic: '#cbd5e1',
    markdownCode: '#fca5a5',
    markdownCodeBlock: '#2d2a3e',
    markdownLink: '#a78bfa',
    markdownQuote: '#94a3b8',
    
    // 滚动条
    scrollbarTrack: '#2d2a3e',
    scrollbarThumb: '#4c566a',
    scrollbarThumbHover: '#64748b',
    
    // 输入框
    inputBackground: '#2d2a3e',
    inputBorder: '#3d3a4e',
    inputFocus: '#a78bfa',
    inputText: '#e2e8f0',
    inputPlaceholder: '#64748b',
    
    // 按钮
    buttonBackground: '#8b5cf6',
    buttonHover: '#a78bfa',
    buttonActive: '#c084fc',
    buttonText: '#ffffff',
    buttonDisabled: '#3d3a4e',
    
    // 通知
    notificationBackground: '#2d2a3e',
    notificationBorder: '#3d3a4e',
    notificationText: '#e2e8f0',
    
    // 工具提示
    tooltipBackground: '#e2e8f0',
    tooltipText: '#1e1b2e',
    
    // 分隔线
    divider: '#3d3a4e',
    
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
