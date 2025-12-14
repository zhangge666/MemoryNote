/**
 * AI 相关 IPC 处理器
 * 阶段 12: NLP 与 LLM 系统
 */

import { ipcMain, BrowserWindow } from 'electron';
import { NLPService } from '../services/NLPService';
import { LLMService } from '../services/LLMService';
import { DatabaseManager } from '../database/DatabaseManager';
import { FileSystemService } from '../services/FileSystemService';
import type {
  LLMConfig,
  ChatMessage,
  AIConfig,
  VectorSearchResult,
  VectorIndexStatus,
  AIAnswerResult,
  ContentCheckResult,
} from '../../shared/types/ai';

let nlpService: NLPService;
let llmService: LLMService;
let isRegistered = false;

/**
 * 获取 NLP 服务实例
 */
export function getNLPService(): NLPService | null {
  return nlpService;
}

/**
 * 获取 LLM 服务实例
 */
export function getLLMService(): LLMService | null {
  return llmService;
}

/**
 * 更新服务实例（用于工作区切换）
 */
export function updateAIServices(
  dbManager: DatabaseManager,
  fsService: FileSystemService
): void {
  NLPService.resetInstance();
  LLMService.resetInstance();
  
  nlpService = NLPService.getInstance(dbManager, fsService);
  llmService = LLMService.getInstance();
  llmService.setNLPService(nlpService);
  
  console.log('✅ AI services updated');
}

/**
 * 注册 AI IPC 处理器
 */
export function registerAIHandlers(
  dbManager: DatabaseManager,
  fsService: FileSystemService
): void {
  // 初始化服务
  nlpService = NLPService.getInstance(dbManager, fsService);
  llmService = LLMService.getInstance();
  llmService.setNLPService(nlpService);

  // 如果已经注册过，直接返回
  if (isRegistered) {
    console.log('⚠️ AI handlers already registered, skipping...');
    return;
  }

  // ==================== NLP 相关 ====================

  // 语义搜索
  ipcMain.handle(
    'ai:semantic-search',
    async (
      _event,
      query: string,
      limit?: number
    ): Promise<{ success: boolean; data?: VectorSearchResult[]; error?: string }> => {
      try {
        const results = await nlpService.semanticSearch(query, limit);
        return { success: true, data: results };
      } catch (error: any) {
        console.error('[AIHandlers] Semantic search failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 获取索引状态
  ipcMain.handle(
    'ai:get-index-status',
    async (): Promise<{ success: boolean; data?: VectorIndexStatus; error?: string }> => {
      try {
        const status = await nlpService.getIndexStatus();
        return { success: true, data: status };
      } catch (error: any) {
        console.error('[AIHandlers] Get index status failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 重建索引
  ipcMain.handle(
    'ai:rebuild-index',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        await nlpService.rebuildIndex();
        return { success: true };
      } catch (error: any) {
        console.error('[AIHandlers] Rebuild index failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 添加文档到索引
  ipcMain.handle(
    'ai:add-to-index',
    async (
      _event,
      noteId: string,
      content: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await nlpService.addToIndex(noteId, content);
        return { success: true };
      } catch (error: any) {
        console.error('[AIHandlers] Add to index failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 从索引中移除文档
  ipcMain.handle(
    'ai:remove-from-index',
    async (
      _event,
      noteId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await nlpService.removeFromIndex(noteId);
        return { success: true };
      } catch (error: any) {
        console.error('[AIHandlers] Remove from index failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ==================== LLM 相关 ====================

  // 获取 LLM 配置
  ipcMain.handle(
    'ai:get-llm-config',
    async (): Promise<{ success: boolean; data?: LLMConfig; error?: string }> => {
      try {
        const config = llmService.getConfig();
        // 隐藏 API 密钥
        const safeConfig = {
          ...config,
          apiKey: config.apiKey ? '***' : undefined,
        };
        return { success: true, data: safeConfig };
      } catch (error: any) {
        console.error('[AIHandlers] Get LLM config failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 设置 LLM 配置
  ipcMain.handle(
    'ai:set-llm-config',
    async (
      _event,
      config: LLMConfig
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        llmService.setConfig(config);
        return { success: true };
      } catch (error: any) {
        console.error('[AIHandlers] Set LLM config failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 验证 API 密钥
  ipcMain.handle(
    'ai:validate-api-key',
    async (): Promise<{ success: boolean; data?: boolean; error?: string }> => {
      try {
        const isValid = await llmService.validateApiKey();
        return { success: true, data: isValid };
      } catch (error: any) {
        console.error('[AIHandlers] Validate API key failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 对话
  ipcMain.handle(
    'ai:chat',
    async (
      _event,
      messages: ChatMessage[],
      context?: string
    ): Promise<{ success: boolean; data?: string; error?: string }> => {
      try {
        const response = await llmService.chat(messages, context);
        return { success: true, data: response };
      } catch (error: any) {
        console.error('[AIHandlers] Chat failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 知识库问答
  ipcMain.handle(
    'ai:ask-with-context',
    async (
      _event,
      question: string,
      limit?: number
    ): Promise<{ success: boolean; data?: AIAnswerResult; error?: string }> => {
      try {
        const result = await llmService.askWithContext(question, limit);
        return { success: true, data: result };
      } catch (error: any) {
        console.error('[AIHandlers] Ask with context failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 内容检查
  ipcMain.handle(
    'ai:check-content',
    async (
      _event,
      content: string,
      knowledgeBase: string[]
    ): Promise<{ success: boolean; data?: ContentCheckResult; error?: string }> => {
      try {
        const result = await llmService.checkContent(content, knowledgeBase);
        return { success: true, data: result };
      } catch (error: any) {
        console.error('[AIHandlers] Check content failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 流式对话
  ipcMain.handle(
    'ai:chat-stream-start',
    async (
      event,
      messages: ChatMessage[],
      streamId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          throw new Error('Window not found');
        }

        // 创建 AbortController 用于取消流
        const controller = new AbortController();
        
        // 存储 controller 以便后续取消
        streamControllers.set(streamId, controller);

        // 开始流式对话
        llmService.chatStream(
          messages,
          (chunk) => {
            // 发送 chunk 到渲染进程
            if (!window.isDestroyed()) {
              window.webContents.send('ai:chat-stream-chunk', streamId, chunk);
            }
          },
          controller.signal
        ).then(() => {
          // 流结束
          if (!window.isDestroyed()) {
            window.webContents.send('ai:chat-stream-end', streamId);
          }
          streamControllers.delete(streamId);
        }).catch((error) => {
          // 流出错
          if (!window.isDestroyed()) {
            window.webContents.send('ai:chat-stream-error', streamId, error.message);
          }
          streamControllers.delete(streamId);
        });

        return { success: true };
      } catch (error: any) {
        console.error('[AIHandlers] Chat stream start failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // 取消流式对话
  ipcMain.handle(
    'ai:chat-stream-cancel',
    async (
      _event,
      streamId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const controller = streamControllers.get(streamId);
        if (controller) {
          controller.abort();
          streamControllers.delete(streamId);
        }
        return { success: true };
      } catch (error: any) {
        console.error('[AIHandlers] Chat stream cancel failed:', error);
        return { success: false, error: error.message };
      }
    }
  );

  isRegistered = true;
  console.log('✅ AI IPC handlers registered');
}

// 存储活跃的流控制器
const streamControllers = new Map<string, AbortController>();
