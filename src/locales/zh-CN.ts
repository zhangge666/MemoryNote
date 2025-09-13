export default {
  // 通用
  common: {
    ok: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    search: '搜索',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    confirm: '确认',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    refresh: '刷新',
    reset: '重置',
    clear: '清空',
    export: '导出',
    import: '导入',
    settings: '设置'
  },

  // 应用标题
  app: {
    title: 'MemoryNote - 个人知识库',
    subtitle: '智能笔记与记忆管理系统'
  },

  // 导航栏
  nav: {
    dashboard: '仪表盘',
    documents: '文档',
    notes: '笔记',
    review: '复习计划',
    diary: '日记',
    subscriptions: '订阅',
    settings: '设置',
    personalSpace: '个人空间',
    studyReminder: '学习提醒'
  },

  // 标题栏
  titleBar: {
    toggleFilePanel: '切换文件列表',
    search: '搜索',
    minimize: '最小化',
    maximize: '最大化',
    close: '关闭',
    userMenu: '用户菜单'
  },

  // 侧边栏
  sidebar: {
    newNote: '新建笔记',
    importFiles: '导入文件',
    quickActions: '快速操作'
  },

  // 文件面板
  filePanel: {
    title: '文件列表',
    searchPlaceholder: '搜索笔记...',
    sortBy: '排序方式',
    sortByName: '按名称',
    sortByDate: '按日期',
    sortBySize: '按大小',
    filterBy: '筛选',
    allNotes: '所有笔记',
    favorites: '收藏夹',
    recentlyModified: '最近修改',
    createNewNote: '创建新笔记',
    noNotesFound: '未找到笔记',
    noteCount: '{count} 个笔记'
  },

  // 标签栏
  tabBar: {
    closeTab: '关闭标签',
    closeOtherTabs: '关闭其他标签',
    closeAllTabs: '关闭所有标签',
    newTab: '新建标签'
  },

  // 状态栏
  statusBar: {
    ready: '就绪',
    saving: '保存中...',
    saved: '已保存',
    wordCount: '字数',
    characterCount: '字符数',
    lineCount: '行数',
    language: '语言',
    encoding: '编码',
    position: '位置'
  },

  // 笔记编辑器
  editor: {
    title: '笔记标题',
    content: '笔记内容',
    tags: '标签',
    addTag: '添加标签',
    removeTag: '移除标签',
    lastModified: '最后修改',
    wordCount: '字数统计',
    readingTime: '阅读时间',
    saveNote: '保存笔记',
    deleteNote: '删除笔记',
    exportNote: '导出笔记',
    printNote: '打印笔记',
    shareNote: '分享笔记'
  },

  // 复习中心
  review: {
    title: '复习中心',
    dueToday: '今日待复习',
    reviewQueue: '复习队列',
    completedToday: '今日已完成',
    totalReviews: '总复习次数',
    accuracy: '准确率',
    startReview: '开始复习',
    markAsEasy: '简单',
    markAsGood: '良好',
    markAsHard: '困难',
    markAsAgain: '重来',
    reviewComplete: '复习完成',
    noReviewsToday: '今日无需复习',
    nextReview: '下次复习',
    reviewHistory: '复习历史'
  },

  // 设置页面
  settings: {
    title: '设置',
    subtitle: '个性化你的知识库体验',
    tabs: {
      general: '通用',
      editor: '编辑器',
      review: '复习',
      about: '关于'
    },
    
    // 外观设置
    appearance: {
      title: '外观',
      theme: '主题',
      fontSize: '字体大小'
    },
    
    // 主题选项
    theme: {
      light: '浅色',
      dark: '深色',
      auto: '跟随系统'
    },
    
    // 语言设置
    language: {
      title: '语言',
      interface: '界面语言',
      chinese: '简体中文',
      english: 'English'
    },
    
    // 用户信息
    user: {
      title: '用户信息',
      username: '用户名',
      email: '邮箱'
    },
    
    // 编辑器设置
    editor: {
      title: '编辑器',
      autoSave: '自动保存',
      autoSaveDesc: '编辑时自动保存笔记',
      autoSaveInterval: '自动保存间隔（秒）',
      showLineNumbers: '显示行号',
      showLineNumbersDesc: '在编辑器中显示行号',
      wordWrap: '自动换行',
      wordWrapDesc: '长行自动换行显示'
    },
    
    // 复习设置
    review: {
      title: '复习提醒',
      notifications: '桌面通知',
      notificationsDesc: '有复习任务时显示桌面通知',
      sound: '提示音',
      soundDesc: '复习提醒时播放提示音',
      dailyGoal: '每日复习目标',
      notes: '个笔记'
    },
    
    // 关于页面
    about: {
      title: '关于 MemoryNote',
      version: '版本 1.0.0',
      description: '基于艾宾浩斯遗忘曲线的个人知识库系统，帮助你更高效地学习和记忆。',
      techStack: '技术栈'
    },
    
    // 重置设置
    reset: {
      title: '重置设置',
      description: '将所有设置恢复为默认值。此操作不会删除你的笔记数据。',
      button: '重置所有设置',
      confirm: '确定要重置所有设置吗？此操作不可撤销。'
    }
  },

  // 用户相关
  user: {
    profile: '个人资料',
    name: '姓名',
    email: '邮箱',
    avatar: '头像',
    changePassword: '修改密码',
    logout: '退出登录',
    notSetEmail: '未设置邮箱'
  },

  // 消息提示
  messages: {
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    importSuccess: '导入成功',
    importFailed: '导入失败',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    networkError: '网络错误',
    serverError: '服务器错误',
    unknownError: '未知错误',
    operationCanceled: '操作已取消',
    confirmDelete: '确定要删除吗？此操作无法撤销。',
    confirmReset: '确定要重置设置吗？此操作无法撤销。'
  },

  // 文档首页
  dashboard: {
    welcome: '欢迎回来，{name}！',
    today: '今天是 {date}，让我们开始学习吧',
    totalNotes: '笔记总数',
    todayReview: '今日复习',
    studyStreak: '连续学习',
    days: '天',
    weeklyNew: '本周新增',
    recentNotes: '最近笔记',
    viewAll: '查看全部',
    noNotes: '还没有笔记，创建第一篇笔记吧！',
    createNote: '创建笔记',
    noReviewToday: '今天没有需要复习的内容',
    interval: '间隔: {days} 天',
    moreReviews: '还有 {count} 个待复习',
    quickActions: '快速操作',
    newNote: '新建笔记',
    importFiles: '导入文件',
    startReview: '开始复习'
  },

  // 时间相关
  time: {
    now: '刚刚',
    minutesAgo: '{n} 分钟前',
    hoursAgo: '{n} 小时前',
    daysAgo: '{n} 天前',
    weeksAgo: '{n} 周前',
    monthsAgo: '{n} 个月前',
    yearsAgo: '{n} 年前',
    today: '今天',
    yesterday: '昨天',
    tomorrow: '明天'
  }
};
