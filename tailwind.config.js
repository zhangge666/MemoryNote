/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色
        primary: {
          DEFAULT: 'var(--theme-primary)',
          hover: 'var(--theme-primary-hover)',
        },
        secondary: 'var(--theme-secondary)',
        accent: 'var(--theme-accent)',

        // 背景色
        background: {
          DEFAULT: 'var(--theme-background)',
          secondary: 'var(--theme-background-secondary)',
          tertiary: 'var(--theme-background-tertiary)',
          hover: 'var(--theme-background-hover)',
        },

        // 侧边栏
        sidebar: {
          background: 'var(--theme-sidebar-background)',
          text: 'var(--theme-sidebar-text)',
          hover: 'var(--theme-sidebar-hover)',
          active: 'var(--theme-sidebar-active)',
        },

        // 文本色
        text: {
          DEFAULT: 'var(--theme-text)',
          secondary: 'var(--theme-text-secondary)',
          muted: 'var(--theme-text-muted)',
          inverse: 'var(--theme-text-inverse)',
        },

        // 边框色
        border: {
          DEFAULT: 'var(--theme-border)',
          light: 'var(--theme-border-light)',
          active: 'var(--theme-border-active)',
        },

        // 状态色
        success: 'var(--theme-success)',
        warning: 'var(--theme-warning)',
        error: 'var(--theme-error)',
        info: 'var(--theme-info)',
      },
      // 阴影
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      // 圆角
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
      }
    },
  },
  plugins: [],
}

