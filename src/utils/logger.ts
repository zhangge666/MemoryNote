/**
 * 全局日志工具
 * 根据开发者模式设置控制日志输出
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface DeveloperMode {
  enabled: boolean;
  consoleLogging: boolean;
  pluginDebugging: boolean;
  performanceMonitoring: boolean;
  logLevel: LogLevel;
}

// 日志级别优先级
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4
};

class Logger {
  private getDevMode(): DeveloperMode {
    return (window as any).__DEVELOPER_MODE__ || {
      enabled: false,
      consoleLogging: true,
      pluginDebugging: false,
      performanceMonitoring: false,
      logLevel: 'info'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const devMode = this.getDevMode();
    
    // 如果开发者模式未启用，只输出错误和警告
    if (!devMode.enabled && level !== 'error' && level !== 'warn') {
      return false;
    }
    
    // 如果控制台日志被禁用，不输出
    if (!devMode.consoleLogging) {
      return false;
    }
    
    // 检查日志级别
    return LOG_LEVELS[level] <= LOG_LEVELS[devMode.logLevel];
  }

  private formatMessage(level: LogLevel, category: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toLocaleTimeString();
    const emoji = this.getLevelEmoji(level);
    const prefix = `${emoji} [${timestamp}] [${category.toUpperCase()}]`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'verbose':
        console.log(prefix, message, ...args);
        break;
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      case 'verbose': return '📝';
      default: return '💬';
    }
  }

  // 系统日志
  system = {
    error: (message: string, ...args: any[]) => this.formatMessage('error', 'system', message, ...args),
    warn: (message: string, ...args: any[]) => this.formatMessage('warn', 'system', message, ...args),
    info: (message: string, ...args: any[]) => this.formatMessage('info', 'system', message, ...args),
    debug: (message: string, ...args: any[]) => this.formatMessage('debug', 'system', message, ...args),
    verbose: (message: string, ...args: any[]) => this.formatMessage('verbose', 'system', message, ...args)
  };

  // 插件日志
  plugin = {
    error: (pluginId: string, message: string, ...args: any[]) => {
      this.formatMessage('error', `plugin:${pluginId}`, message, ...args);
    },
    warn: (pluginId: string, message: string, ...args: any[]) => {
      this.formatMessage('warn', `plugin:${pluginId}`, message, ...args);
    },
    info: (pluginId: string, message: string, ...args: any[]) => {
      const devMode = this.getDevMode();
      if (devMode.pluginDebugging || devMode.logLevel === 'verbose') {
        this.formatMessage('info', `plugin:${pluginId}`, message, ...args);
      }
    },
    debug: (pluginId: string, message: string, ...args: any[]) => {
      const devMode = this.getDevMode();
      if (devMode.pluginDebugging) {
        this.formatMessage('debug', `plugin:${pluginId}`, message, ...args);
      }
    },
    verbose: (pluginId: string, message: string, ...args: any[]) => {
      const devMode = this.getDevMode();
      if (devMode.pluginDebugging) {
        this.formatMessage('verbose', `plugin:${pluginId}`, message, ...args);
      }
    }
  };

  // 性能日志
  performance = {
    mark: (name: string) => {
      const devMode = this.getDevMode();
      if (devMode.performanceMonitoring) {
        performance.mark(name);
        this.formatMessage('debug', 'perf', `Mark: ${name}`);
      }
    },
    measure: (name: string, startMark: string, endMark?: string) => {
      const devMode = this.getDevMode();
      if (devMode.performanceMonitoring) {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        this.formatMessage('info', 'perf', `Measure: ${name} - ${measure.duration.toFixed(2)}ms`);
      }
    },
    time: (label: string) => {
      const devMode = this.getDevMode();
      if (devMode.performanceMonitoring) {
        console.time(`⚡ [PERF] ${label}`);
      }
    },
    timeEnd: (label: string) => {
      const devMode = this.getDevMode();
      if (devMode.performanceMonitoring) {
        console.timeEnd(`⚡ [PERF] ${label}`);
      }
    }
  };

  // 数据库日志
  database = {
    error: (message: string, ...args: any[]) => this.formatMessage('error', 'database', message, ...args),
    warn: (message: string, ...args: any[]) => this.formatMessage('warn', 'database', message, ...args),
    info: (message: string, ...args: any[]) => this.formatMessage('info', 'database', message, ...args),
    debug: (message: string, ...args: any[]) => this.formatMessage('debug', 'database', message, ...args),
    query: (sql: string, params?: any[]) => {
      const devMode = this.getDevMode();
      if (devMode.logLevel === 'verbose') {
        this.formatMessage('verbose', 'database', `SQL: ${sql}`, params);
      }
    }
  };

  // IPC日志
  ipc = {
    error: (channel: string, message: string, ...args: any[]) => {
      this.formatMessage('error', `ipc:${channel}`, message, ...args);
    },
    warn: (channel: string, message: string, ...args: any[]) => {
      this.formatMessage('warn', `ipc:${channel}`, message, ...args);
    },
    info: (channel: string, message: string, ...args: any[]) => {
      this.formatMessage('info', `ipc:${channel}`, message, ...args);
    },
    debug: (channel: string, message: string, ...args: any[]) => {
      this.formatMessage('debug', `ipc:${channel}`, message, ...args);
    },
    call: (channel: string, data?: any) => {
      const devMode = this.getDevMode();
      if (devMode.logLevel === 'verbose') {
        this.formatMessage('verbose', `ipc:${channel}`, 'Call', data);
      }
    },
    response: (channel: string, data?: any) => {
      const devMode = this.getDevMode();
      if (devMode.logLevel === 'verbose') {
        this.formatMessage('verbose', `ipc:${channel}`, 'Response', data);
      }
    }
  };
}

// 创建全局日志实例
export const logger = new Logger();

// 将日志工具添加到全局对象（仅在开发模式下）
if (process.env.NODE_ENV === 'development') {
  (window as any).__LOGGER__ = logger;
}

export default logger;


