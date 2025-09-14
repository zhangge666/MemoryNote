/**
 * 简单的事件发射器实现
 * 用于插件系统的事件通信
 */
export class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  /**
   * 监听事件
   */
  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: string, handler: Function): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`事件处理器执行失败: ${event}`, error);
        }
      });
    }
  }

  /**
   * 监听一次性事件
   */
  once(event: string, handler: Function): void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * 移除所有事件监听
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}


