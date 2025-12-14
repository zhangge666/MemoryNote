/**
 * AI 系统类型定义
 * 阶段 12: NLP 与 LLM 系统
 */

import type { Note } from './note';

// ==================== Embedding 系统 ====================

/**
 * Embedding 提供商类型
 */
export type EmbeddingProvider = 'local' | 'openai' | 'qwen' | 'custom';

/**
 * Embedding 提供商配置
 */
export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey?: string;
  apiEndpoint?: string;
  model: string;
  dimensions?: number;  // 向量维度
  batchSize?: number;   // 批处理大小
}

/**
 * 各提供商默认模型配置
 */
export const EMBEDDING_PROVIDER_DEFAULTS: Record<EmbeddingProvider, Omit<EmbeddingConfig, 'apiKey'>> = {
  local: {
    provider: 'local',
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    batchSize: 32,
  },
  openai: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    apiEndpoint: 'https://api.openai.com/v1/embeddings',
    dimensions: 1536,
    batchSize: 100,
  },
  qwen: {
    provider: 'qwen',
    model: 'text-embedding-v3',
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
    dimensions: 1024,
    batchSize: 25,
  },
  custom: {
    provider: 'custom',
    model: 'custom-model',
    dimensions: 768,
    batchSize: 32,
  },
};

/**
 * Embedding 结果
 */
export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * 批量 Embedding 结果
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

// ==================== NLP 系统 ====================

/**
 * 向量搜索结果
 */
export interface VectorSearchResult {
  note: Note;
  similarity: number;
  excerpt: string;
}

/**
 * 向量索引状态
 */
export interface VectorIndexStatus {
  totalDocuments: number;
  indexedDocuments: number;
  lastUpdated: number;
  isBuilding: boolean;
  embeddingProvider: EmbeddingProvider;
  model: string;
  dimensions: number;
}

// ==================== LLM 系统 ====================

/**
 * LLM 提供商类型
 */
export type LLMProvider = 'openai' | 'anthropic' | 'local' | 'custom';

/**
 * LLM 配置
 */
export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  apiEndpoint?: string; // 自定义 API 端点
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * 聊天消息角色
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 对话会话
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * AI 问答结果
 */
export interface AIAnswerResult {
  answer: string;
  sources: Note[];
  confidence: number;
}

/**
 * 内容检查结果
 */
export interface ContentCheckResult {
  hasErrors: boolean;
  suggestions: ContentSuggestion[];
}

/**
 * 内容建议
 */
export interface ContentSuggestion {
  type: 'error' | 'warning' | 'info';
  message: string;
  lineStart?: number;
  lineEnd?: number;
  originalText?: string;
  suggestedText?: string;
}

/**
 * 流式响应事件
 */
export interface StreamChunkEvent {
  chunk: string;
  done: boolean;
  error?: string;
}

// ==================== AI 配置 ====================

/**
 * AI 全局配置
 */
export interface AIConfig {
  enabled: boolean;
  llm: LLMConfig;
  nlp: NLPConfig;
  assistant: AssistantConfig;
}

/**
 * NLP 配置
 */
export interface NLPConfig {
  enabled: boolean;
  embedding: EmbeddingConfig;
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
}

/**
 * AI 助手配置
 */
export interface AssistantConfig {
  systemPrompt: string;
  useKnowledgeBase: boolean;
  maxContextNotes: number;
  streamResponses: boolean;
}

/**
 * 默认 AI 配置
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  llm: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
  },
  nlp: {
    enabled: true,
    embedding: {
      provider: 'local',
      model: 'Xenova/all-MiniLM-L6-v2',
      dimensions: 384,
      batchSize: 32,
    },
    chunkSize: 500,
    chunkOverlap: 50,
    similarityThreshold: 0.3,
  },
  assistant: {
    systemPrompt: 'You are a helpful AI assistant for the MemoryNote application. Help users with their notes, answer questions about their knowledge base, and provide suggestions for better note-taking.',
    useKnowledgeBase: true,
    maxContextNotes: 5,
    streamResponses: true,
  },
};

// ==================== AI 服务接口 ====================

/**
 * Embedding 提供商接口
 */
export interface IEmbeddingProvider {
  // 获取配置
  getConfig(): EmbeddingConfig;
  
  // 初始化（加载模型等）
  initialize(): Promise<void>;
  
  // 单文本向量化
  embed(text: string): Promise<EmbeddingResult>;
  
  // 批量向量化
  embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;
  
  // 是否已初始化
  isReady(): boolean;
  
  // 释放资源
  dispose(): Promise<void>;
}

/**
 * NLP 服务接口
 */
export interface INLPService {
  // 向量化
  vectorize(text: string): Promise<number[]>;
  
  // 语义检索
  semanticSearch(query: string, limit?: number): Promise<VectorSearchResult[]>;
  
  // 索引管理
  addToIndex(noteId: string, content: string): Promise<void>;
  removeFromIndex(noteId: string): Promise<void>;
  rebuildIndex(): Promise<void>;
  
  // 索引状态
  getIndexStatus(): Promise<VectorIndexStatus>;
  
  // 配置管理
  setEmbeddingConfig(config: EmbeddingConfig): Promise<void>;
  getEmbeddingConfig(): EmbeddingConfig;
}

/**
 * LLM 服务接口
 */
export interface ILLMService {
  // 配置
  setConfig(config: LLMConfig): void;
  getConfig(): LLMConfig;
  
  // 对话
  chat(messages: ChatMessage[], context?: string): Promise<string>;
  
  // 知识库问答
  askWithContext(question: string, limit?: number): Promise<AIAnswerResult>;
  
  // 内容检查
  checkContent(content: string, knowledgeBase: string[]): Promise<ContentCheckResult>;
  
  // 流式输出
  chatStream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void>;
  
  // 验证 API 密钥
  validateApiKey(): Promise<boolean>;
}
