export default {
  // Common
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    refresh: 'Refresh',
    reset: 'Reset',
    clear: 'Clear',
    export: 'Export',
    import: 'Import',
    settings: 'Settings'
  },

  // App title
  app: {
    title: 'MemoryNote - Personal Knowledge Base',
    subtitle: 'Smart Note Taking & Memory Management System'
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    documents: 'Documents',
    notes: 'Notes',
    review: 'Review',
    diary: 'Diary',
    subscriptions: 'Subscriptions',
    settings: 'Settings',
    personalSpace: 'Personal Space',
    studyReminder: 'Study Reminder'
  },

  // Title bar
  titleBar: {
    toggleFilePanel: 'Toggle File Panel',
    search: 'Search',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close',
    userMenu: 'User Menu'
  },

  // Sidebar
  sidebar: {
    newNote: 'New Note',
    importFiles: 'Import Files',
    quickActions: 'Quick Actions'
  },

  // File panel
  filePanel: {
    title: 'File List',
    searchPlaceholder: 'Search notes...',
    sortBy: 'Sort by',
    sortByName: 'Name',
    sortByDate: 'Date',
    sortBySize: 'Size',
    filterBy: 'Filter',
    allNotes: 'All Notes',
    favorites: 'Favorites',
    recentlyModified: 'Recently Modified',
    createNewNote: 'Create New Note',
    noNotesFound: 'No notes found',
    noteCount: '{count} notes'
  },

  // Tab bar
  tabBar: {
    closeTab: 'Close Tab',
    closeOtherTabs: 'Close Other Tabs',
    closeAllTabs: 'Close All Tabs',
    newTab: 'New Tab'
  },

  // Status bar
  statusBar: {
    ready: 'Ready',
    saving: 'Saving...',
    saved: 'Saved',
    wordCount: 'Words',
    characterCount: 'Characters',
    lineCount: 'Lines',
    language: 'Language',
    encoding: 'Encoding',
    position: 'Position'
  },

  // Note editor
  editor: {
    title: 'Note Title',
    content: 'Note Content',
    tags: 'Tags',
    addTag: 'Add Tag',
    removeTag: 'Remove Tag',
    lastModified: 'Last Modified',
    wordCount: 'Word Count',
    readingTime: 'Reading Time',
    saveNote: 'Save Note',
    deleteNote: 'Delete Note',
    exportNote: 'Export Note',
    printNote: 'Print Note',
    shareNote: 'Share Note'
  },

  // Review center
  review: {
    title: 'Review Center',
    dueToday: 'Due Today',
    reviewQueue: 'Review Queue',
    completedToday: 'Completed Today',
    totalReviews: 'Total Reviews',
    accuracy: 'Accuracy',
    startReview: 'Start Review',
    markAsEasy: 'Easy',
    markAsGood: 'Good',
    markAsHard: 'Hard',
    markAsAgain: 'Again',
    reviewComplete: 'Review Complete',
    noReviewsToday: 'No reviews due today',
    nextReview: 'Next Review',
    reviewHistory: 'Review History'
  },

  // Settings page
  settings: {
    title: 'Settings',
    subtitle: 'Personalize your knowledge base experience',
    tabs: {
      general: 'General',
      editor: 'Editor',
      review: 'Review',
      about: 'About'
    },
    
    // Appearance settings
    appearance: {
      title: 'Appearance',
      theme: 'Theme',
      fontSize: 'Font Size'
    },
    
    // Theme options
    theme: {
      light: 'Light',
      dark: 'Dark',
      auto: 'Follow System'
    },
    
    // Language settings
    language: {
      title: 'Language',
      interface: 'Interface Language',
      chinese: '简体中文',
      english: 'English'
    },
    
    // User information
    user: {
      title: 'User Information',
      username: 'Username',
      email: 'Email'
    },
    
    // Editor settings
    editor: {
      title: 'Editor',
      autoSave: 'Auto Save',
      autoSaveDesc: 'Automatically save notes while editing',
      autoSaveInterval: 'Auto Save Interval (seconds)',
      showLineNumbers: 'Show Line Numbers',
      showLineNumbersDesc: 'Display line numbers in editor',
      wordWrap: 'Word Wrap',
      wordWrapDesc: 'Wrap long lines automatically'
    },
    
    // Review settings
    review: {
      title: 'Review Reminders',
      notifications: 'Desktop Notifications',
      notificationsDesc: 'Show desktop notifications for review tasks',
      sound: 'Sound Alerts',
      soundDesc: 'Play sound alerts for review reminders',
      dailyGoal: 'Daily Review Goal',
      notes: 'notes'
    },
    
    // About page
    about: {
      title: 'About MemoryNote',
      version: 'Version 1.0.0',
      description: 'A personal knowledge base system based on Ebbinghaus forgetting curve to help you learn and memorize more efficiently.',
      techStack: 'Tech Stack'
    },
    
    // Reset settings
    reset: {
      title: 'Reset Settings',
      description: 'Restore all settings to default values. This will not delete your note data.',
      button: 'Reset All Settings',
      confirm: 'Are you sure you want to reset all settings? This action cannot be undone.'
    }
  },

  // User related
  user: {
    profile: 'Profile',
    name: 'Name',
    email: 'Email',
    avatar: 'Avatar',
    changePassword: 'Change Password',
    logout: 'Logout',
    notSetEmail: 'Email not set'
  },

  // Messages
  messages: {
    saveSuccess: 'Save successful',
    saveFailed: 'Save failed',
    deleteSuccess: 'Delete successful',
    deleteFailed: 'Delete failed',
    importSuccess: 'Import successful',
    importFailed: 'Import failed',
    exportSuccess: 'Export successful',
    exportFailed: 'Export failed',
    networkError: 'Network error',
    serverError: 'Server error',
    unknownError: 'Unknown error',
    operationCanceled: 'Operation canceled',
    confirmDelete: 'Are you sure you want to delete? This action cannot be undone.',
    confirmReset: 'Are you sure you want to reset settings? This action cannot be undone.'
  },

  // Dashboard page
  dashboard: {
    welcome: 'Welcome back, {name}!',
    today: 'Today is {date}, let\'s start learning',
    totalNotes: 'Total Notes',
    todayReview: 'Today\'s Review',
    studyStreak: 'Study Streak',
    days: 'days',
    weeklyNew: 'Weekly New',
    recentNotes: 'Recent Notes',
    viewAll: 'View All',
    noNotes: 'No notes yet, create your first note!',
    createNote: 'Create Note',
    noReviewToday: 'No reviews needed today',
    interval: 'Interval: {days} days',
    moreReviews: '{count} more reviews pending',
    quickActions: 'Quick Actions',
    newNote: 'New Note',
    importFiles: 'Import Files',
    startReview: 'Start Review'
  },

  // Time related
  time: {
    now: 'Just now',
    minutesAgo: '{n} minutes ago',
    hoursAgo: '{n} hours ago',
    daysAgo: '{n} days ago',
    weeksAgo: '{n} weeks ago',
    monthsAgo: '{n} months ago',
    yearsAgo: '{n} years ago',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow'
  }
};
