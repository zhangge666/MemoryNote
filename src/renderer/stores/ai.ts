/**
 * AI 状态管理
 * 阶段 12: NLP 与 LLM 系统
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ChatMessage,
  ChatSession,
  LLMConfig,
  VectorSearchResult,
  VectorIndexStatus,
  AIAnswerResult,
} from '@shared/types/ai';

// 生成唯一 ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const useAIStore = defineStore('ai', () => {
  // ==================== 状态 ====================
  
  // 当前会话
  const currentSession = ref<ChatSession | null>(null);
  
  // 历史会话列表
  const sessions = ref<ChatSession[]>([]);
  
  // 消息列表（当前会话）
  const messages = computed(() => currentSession.value?.messages || []);
  
  // 是否正在加载
  const isLoading = ref(false);
  
  // 是否正在流式输出
  const isStreaming = ref(false);
  
  // 当前流 ID
  const currentStreamId = ref<string | null>(null);
  
  // 流式输出的临时内容
  const streamingContent = ref('');
  
  // 错误信息
  const error = ref<string | null>(null);
  
  // LLM 配置
  const llmConfig = ref<LLMConfig | null>(null);
  
  // 索引状态
  const indexStatus = ref<VectorIndexStatus | null>(null);
  
  // AI 是否启用
  const isEnabled = computed(() => !!llmConfig.value?.apiKey);
  
  // ==================== 会话管理 ====================
  
  /**
   * 创建新会话
   */
  function createSession(title = '新对话'): ChatSession {
    const session: ChatSession = {
      id: generateId(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    sessions.value.unshift(session);
    currentSession.value = session;
    
    return session;
  }
  
  /**
   * 切换会话
   */
  function switchSession(sessionId: string): void {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      currentSession.value = session;
    }
  }
  
  /**
   * 删除会话
   */
  function deleteSession(sessionId: string): void {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions.value.splice(index, 1);
      
      // 如果删除的是当前会话，切换到第一个或创建新会话
      if (currentSession.value?.id === sessionId) {
        if (sessions.value.length > 0) {
          currentSession.value = sessions.value[0];
        } else {
          createSession();
        }
      }
    }
  }
  
  /**
   * 清空所有会话
   */
  function clearAllSessions(): void {
    sessions.value = [];
    createSession();
  }
  
  // ==================== 消息管理 ====================
  
  /**
   * 添加消息
   */
  function addMessage(role: 'user' | 'assistant' | 'system', content: string): ChatMessage {
    if (!currentSession.value) {
      createSession();
    }
    
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    };
    
    currentSession.value!.messages.push(message);
    currentSession.value!.updatedAt = Date.now();
    
    // 更新会话标题（使用第一条用户消息）
    if (role === 'user' && currentSession.value!.messages.filter(m => m.role === 'user').length === 1) {
      currentSession.value!.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }
    
    return message;
  }
  
  /**
   * 更新消息内容（用于流式输出）
   */
  function updateLastMessage(content: string): void {
    if (currentSession.value && currentSession.value.messages.length > 0) {
      const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.content = content;
      }
    }
  }
  
  // ==================== API 调用 ====================
  
  /**
   * 加载 LLM 配置
   */
  async function loadConfig(): Promise<void> {
    try {
      const response = await window.ipc.ai.getLLMConfig();
      if (response.success && response.data) {
        llmConfig.value = response.data;
      }
    } catch (e) {
      console.error('Failed to load LLM config:', e);
    }
  }
  
  /**
   * 保存 LLM 配置
   */
  async function saveConfig(config: LLMConfig): Promise<boolean> {
    try {
      const response = await window.ipc.ai.setLLMConfig(config);
      if (response.success) {
        llmConfig.value = config;
        return true;
      }
      error.value = response.error || 'Failed to save config';
      return false;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      return false;
    }
  }
  
  /**
   * 验证 API 密钥
   */
  async function validateApiKey(): Promise<boolean> {
    try {
      const response = await window.ipc.ai.validateApiKey();
      return response.success && response.data === true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * 发送消息
   */
  async function sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;
    
    // 添加用户消息
    addMessage('user', content);
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // 构建消息列表
      const chatMessages = currentSession.value!.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
      
      const response = await window.ipc.ai.chat(chatMessages);
      
      if (response.success && response.data) {
        addMessage('assistant', response.data);
      } else {
        error.value = response.error || 'Failed to get response';
        addMessage('assistant', `抱歉，发生了错误：${error.value}`);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      addMessage('assistant', `抱歉，发生了错误：${error.value}`);
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 发送消息（流式）
   */
  async function sendMessageStream(content: string): Promise<void> {
    if (!content.trim()) return;
    
    // 添加用户消息
    addMessage('user', content);
    
    // 添加空的助手消息
    addMessage('assistant', '');
    
    isStreaming.value = true;
    streamingContent.value = '';
    error.value = null;
    
    const streamId = generateId();
    currentStreamId.value = streamId;
    
    try {
      // 构建消息列表（不包括最后一个空的助手消息）
      const chatMessages = currentSession.value!.messages.slice(0, -1).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
      
      // 设置流监听器
      const onChunk = (sid: string, chunk: string) => {
        if (sid === streamId) {
          streamingContent.value += chunk;
          updateLastMessage(streamingContent.value);
        }
      };
      
      const onEnd = (sid: string) => {
        if (sid === streamId) {
          isStreaming.value = false;
          currentStreamId.value = null;
          cleanup();
        }
      };
      
      const onError = (sid: string, err: string) => {
        if (sid === streamId) {
          error.value = err;
          updateLastMessage(streamingContent.value + `\n\n[错误: ${err}]`);
          isStreaming.value = false;
          currentStreamId.value = null;
          cleanup();
        }
      };
      
      const cleanup = () => {
        window.ipc.ai.offStreamChunk(onChunk);
        window.ipc.ai.offStreamEnd(onEnd);
        window.ipc.ai.offStreamError(onError);
      };
      
      window.ipc.ai.onStreamChunk(onChunk);
      window.ipc.ai.onStreamEnd(onEnd);
      window.ipc.ai.onStreamError(onError);
      
      // 开始流式对话
      const response = await window.ipc.ai.chatStreamStart(chatMessages, streamId);
      
      if (!response.success) {
        error.value = response.error || 'Failed to start stream';
        updateLastMessage(`抱歉，发生了错误：${error.value}`);
        isStreaming.value = false;
        currentStreamId.value = null;
        cleanup();
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      updateLastMessage(`抱歉，发生了错误：${error.value}`);
      isStreaming.value = false;
      currentStreamId.value = null;
    }
  }
  
  /**
   * 取消流式输出
   */
  async function cancelStream(): Promise<void> {
    if (currentStreamId.value) {
      await window.ipc.ai.chatStreamCancel(currentStreamId.value);
      isStreaming.value = false;
      currentStreamId.value = null;
    }
  }
  
  /**
   * 知识库问答
   */
  async function askWithContext(question: string): Promise<AIAnswerResult | null> {
    if (!question.trim()) return null;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await window.ipc.ai.askWithContext(question);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        error.value = response.error || 'Failed to get answer';
        return null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 语义搜索
   */
  async function semanticSearch(query: string, limit = 10): Promise<VectorSearchResult[]> {
    try {
      const response = await window.ipc.ai.semanticSearch(query, limit);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error('Semantic search failed:', e);
      return [];
    }
  }
  
  /**
   * 获取索引状态
   */
  async function loadIndexStatus(): Promise<void> {
    try {
      const response = await window.ipc.ai.getIndexStatus();
      if (response.success && response.data) {
        indexStatus.value = response.data;
      }
    } catch (e) {
      console.error('Failed to load index status:', e);
    }
  }
  
  /**
   * 重建索引
   */
  async function rebuildIndex(): Promise<boolean> {
    isLoading.value = true;
    try {
      const response = await window.ipc.ai.rebuildIndex();
      if (response.success) {
        await loadIndexStatus();
        return true;
      }
      error.value = response.error || 'Failed to rebuild index';
      return false;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  // ==================== 初始化 ====================
  
  /**
   * 初始化
   */
  async function initialize(): Promise<void> {
    await loadConfig();
    await loadIndexStatus();
    
    // 如果没有会话，创建一个
    if (sessions.value.length === 0) {
      createSession();
    }
  }
  
  return {
    // 状态
    currentSession,
    sessions,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    llmConfig,
    indexStatus,
    isEnabled,
    
    // 会话管理
    createSession,
    switchSession,
    deleteSession,
    clearAllSessions,
    
    // 消息管理
    addMessage,
    
    // API 调用
    loadConfig,
    saveConfig,
    validateApiKey,
    sendMessage,
    sendMessageStream,
    cancelStream,
    askWithContext,
    semanticSearch,
    loadIndexStatus,
    rebuildIndex,
    initialize,
  };
});
