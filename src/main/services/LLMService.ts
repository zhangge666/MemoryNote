/**
 * LLM 服务
 * 阶段 12: NLP 与 LLM 系统
 * 
 * 提供大语言模型 API 集成，支持 OpenAI、Anthropic 和本地模型
 */

import type {
  LLMConfig,
  ChatMessage,
  AIAnswerResult,
  ContentCheckResult,
  ContentSuggestion,
  ILLMService,
  VectorSearchResult,
} from '../../shared/types/ai';
import type { Note } from '../../shared/types/note';
import { NLPService } from './NLPService';

/**
 * OpenAI API 响应类型
 */
interface OpenAIChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * LLM 服务实现
 */
export class LLMService implements ILLMService {
  private static instance: LLMService | null = null;
  
  private config: LLMConfig;
  private nlpService: NLPService | null = null;

  constructor(config?: LLMConfig) {
    this.config = config || {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2048,
    };
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: LLMConfig): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService(config);
    }
    return LLMService.instance;
  }

  /**
   * 重置实例
   */
  static resetInstance(): void {
    LLMService.instance = null;
  }

  /**
   * 设置 NLP 服务（用于知识库问答）
   */
  setNLPService(nlpService: NLPService): void {
    this.nlpService = nlpService;
  }

  /**
   * 设置配置
   */
  setConfig(config: LLMConfig): void {
    this.config = { ...this.config, ...config };
    console.log('[LLMService] Config updated:', { 
      provider: this.config.provider,
      model: this.config.model,
      hasApiKey: !!this.config.apiKey 
    });
  }

  /**
   * 获取配置
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  /**
   * 对话
   */
  async chat(messages: ChatMessage[], context?: string): Promise<string> {
    console.log('[LLMService] Chat request:', { messageCount: messages.length, hasContext: !!context });
    
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    // 构建完整的消息列表
    const fullMessages = this.buildMessages(messages, context);

    try {
      const response = await this.callAPI(fullMessages);
      return response;
    } catch (error: any) {
      console.error('[LLMService] Chat failed:', error);
      throw error;
    }
  }

  /**
   * 知识库问答
   */
  async askWithContext(question: string, limit = 5): Promise<AIAnswerResult> {
    console.log('[LLMService] Ask with context:', question);
    
    if (!this.nlpService) {
      throw new Error('NLP service not configured');
    }

    // 语义搜索相关文档
    const searchResults = await this.nlpService.semanticSearch(question, limit);
    
    if (searchResults.length === 0) {
      return {
        answer: '抱歉，我没有找到与您问题相关的笔记内容。',
        sources: [],
        confidence: 0,
      };
    }

    // 构建上下文
    const context = this.buildContextFromNotes(searchResults);
    
    // 构建问答消息
    const messages: ChatMessage[] = [
      {
        id: 'system',
        role: 'system',
        content: `你是一个智能笔记助手。请根据以下知识库内容回答用户的问题。
如果知识库中没有相关信息，请明确告知用户。
请用中文回答，并尽可能引用具体的笔记内容。`,
        timestamp: Date.now(),
      },
      {
        id: 'user',
        role: 'user',
        content: question,
        timestamp: Date.now(),
      },
    ];

    try {
      const answer = await this.chat(messages, context);
      
      // 计算置信度（基于相似度）
      const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;
      
      return {
        answer,
        sources: searchResults.map(r => r.note),
        confidence: avgSimilarity,
      };
    } catch (error: any) {
      console.error('[LLMService] Ask with context failed:', error);
      return {
        answer: `抱歉，处理您的问题时出现错误：${error.message}`,
        sources: searchResults.map(r => r.note),
        confidence: 0,
      };
    }
  }

  /**
   * 内容检查
   */
  async checkContent(content: string, knowledgeBase: string[]): Promise<ContentCheckResult> {
    console.log('[LLMService] Check content');
    
    if (!this.config.apiKey) {
      return { hasErrors: false, suggestions: [] };
    }

    const messages: ChatMessage[] = [
      {
        id: 'system',
        role: 'system',
        content: `你是一个专业的内容审核助手。请检查用户提供的内容是否存在以下问题：
1. 与知识库内容矛盾
2. 事实性错误
3. 逻辑不一致
4. 表述不清

请以 JSON 格式返回检查结果，格式如下：
{
  "hasErrors": boolean,
  "suggestions": [
    {
      "type": "error" | "warning" | "info",
      "message": "问题描述",
      "originalText": "原文内容（可选）",
      "suggestedText": "建议修改（可选）"
    }
  ]
}`,
        timestamp: Date.now(),
      },
      {
        id: 'user',
        role: 'user',
        content: `请检查以下内容：

${content}

知识库参考：
${knowledgeBase.slice(0, 3).join('\n\n---\n\n')}`,
        timestamp: Date.now(),
      },
    ];

    try {
      const response = await this.chat(messages);
      
      // 解析 JSON 响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          hasErrors: result.hasErrors || false,
          suggestions: result.suggestions || [],
        };
      }
      
      return { hasErrors: false, suggestions: [] };
    } catch (error) {
      console.error('[LLMService] Content check failed:', error);
      return { hasErrors: false, suggestions: [] };
    }
  }

  /**
   * 流式对话
   */
  async chatStream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    console.log('[LLMService] Chat stream request');
    
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const fullMessages = this.buildMessages(messages);

    try {
      await this.streamAPI(fullMessages, onChunk, signal);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[LLMService] Stream aborted');
        return;
      }
      console.error('[LLMService] Stream failed:', error);
      throw error;
    }
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      // 发送简单请求测试
      const messages: ChatMessage[] = [
        {
          id: 'test',
          role: 'user',
          content: 'Hi',
          timestamp: Date.now(),
        },
      ];
      
      await this.chat(messages);
      return true;
    } catch (error) {
      console.error('[LLMService] API key validation failed:', error);
      return false;
    }
  }

  /**
   * 构建消息列表
   */
  private buildMessages(messages: ChatMessage[], context?: string): Array<{ role: string; content: string }> {
    const result: Array<{ role: string; content: string }> = [];
    
    // 添加系统消息（如果有上下文）
    if (context) {
      result.push({
        role: 'system',
        content: `以下是相关的知识库内容，请参考这些信息回答用户的问题：\n\n${context}`,
      });
    }
    
    // 添加对话消息
    for (const msg of messages) {
      result.push({
        role: msg.role,
        content: msg.content,
      });
    }
    
    return result;
  }

  /**
   * 从笔记构建上下文
   */
  private buildContextFromNotes(results: VectorSearchResult[]): string {
    return results
      .map((r, i) => `[笔记 ${i + 1}: ${r.note.title}]\n${r.excerpt}`)
      .join('\n\n---\n\n');
  }

  /**
   * 调用 API
   */
  private async callAPI(messages: Array<{ role: string; content: string }>): Promise<string> {
    const { provider, apiKey, apiEndpoint, model, temperature, maxTokens } = this.config;
    
    let url: string;
    let headers: Record<string, string>;
    let body: Record<string, any>;
    
    switch (provider) {
      case 'openai':
        url = apiEndpoint || 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        body = {
          model,
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 2048,
        };
        break;
        
      case 'anthropic':
        url = apiEndpoint || 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        };
        // Anthropic 格式转换
        const systemMessage = messages.find(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system');
        body = {
          model,
          max_tokens: maxTokens ?? 2048,
          messages: otherMessages,
          ...(systemMessage && { system: systemMessage.content }),
        };
        break;
        
      case 'local':
        // 本地模型（Ollama 格式）
        url = apiEndpoint || 'http://localhost:11434/api/chat';
        headers = {
          'Content-Type': 'application/json',
        };
        body = {
          model,
          messages,
          stream: false,
        };
        break;
        
      case 'custom':
        // 自定义端点（OpenAI 兼容格式）
        url = apiEndpoint!;
        headers = {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        };
        body = {
          model,
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 2048,
        };
        break;
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // 解析响应
    switch (provider) {
      case 'openai':
      case 'custom':
        return (data as OpenAIChatResponse).choices[0]?.message?.content || '';
        
      case 'anthropic':
        return data.content?.[0]?.text || '';
        
      case 'local':
        return data.message?.content || data.response || '';
        
      default:
        return '';
    }
  }

  /**
   * 流式 API 调用
   */
  private async streamAPI(
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const { provider, apiKey, apiEndpoint, model, temperature, maxTokens } = this.config;
    
    let url: string;
    let headers: Record<string, string>;
    let body: Record<string, any>;
    
    switch (provider) {
      case 'openai':
      case 'custom':
        url = apiEndpoint || 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        body = {
          model,
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 2048,
          stream: true,
        };
        break;
        
      case 'local':
        url = apiEndpoint || 'http://localhost:11434/api/chat';
        headers = {
          'Content-Type': 'application/json',
        };
        body = {
          model,
          messages,
          stream: true,
        };
        break;
        
      default:
        // 不支持流式的 fallback 到普通调用
        const response = await this.callAPI(messages);
        onChunk(response);
        return;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            // OpenAI 格式
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
            
            // Ollama 格式
            const ollamaContent = parsed.message?.content;
            if (ollamaContent) {
              onChunk(ollamaContent);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}
