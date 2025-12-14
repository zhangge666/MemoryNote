/**
 * 通义千问 (Qwen) Embedding 提供商
 * 阿里云 DashScope API
 */

import type {
  EmbeddingConfig,
  EmbeddingResult,
  BatchEmbeddingResult,
  IEmbeddingProvider,
} from '../../../shared/types/ai';
import { EMBEDDING_PROVIDER_DEFAULTS } from '../../../shared/types/ai';

export class QwenEmbeddingProvider implements IEmbeddingProvider {
  private config: EmbeddingConfig;
  private ready = false;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      ...EMBEDDING_PROVIDER_DEFAULTS.qwen,
      ...config,
    };
  }

  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    // 验证 API 密钥
    if (!this.config.apiKey) {
      throw new Error('Qwen (DashScope) API key is required');
    }
    this.ready = true;
    console.log('[QwenEmbeddingProvider] Initialized');
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.ready) {
      await this.initialize();
    }

    const result = await this.embedBatch([text]);
    return {
      embedding: result.embeddings[0],
      model: result.model,
      usage: result.usage,
    };
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    if (!this.ready) {
      await this.initialize();
    }

    if (!this.config.apiKey) {
      throw new Error('Qwen (DashScope) API key is required');
    }

    const batchSize = this.config.batchSize || 25; // DashScope 限制
    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    try {
      // 分批处理
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        // DashScope 通义千问 API 格式
        const response = await fetch(
          this.config.apiEndpoint || 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
              model: this.config.model || 'text-embedding-v3',
              input: {
                texts: batch,
              },
              parameters: {
                text_type: 'document',
              },
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Qwen API error: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        
        // 检查 DashScope 响应格式
        if (data.output && data.output.embeddings) {
          for (const item of data.output.embeddings) {
            allEmbeddings.push(item.embedding);
          }
        } else if (data.embeddings) {
          // 兼容其他格式
          for (const item of data.embeddings) {
            allEmbeddings.push(item.embedding || item);
          }
        }

        if (data.usage) {
          totalTokens += data.usage.total_tokens || 0;
        }
      }

      return {
        embeddings: allEmbeddings,
        model: this.config.model,
        usage: {
          promptTokens: totalTokens,
          totalTokens,
        },
      };
    } catch (error) {
      console.error('[QwenEmbeddingProvider] Embed failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async dispose(): Promise<void> {
    this.ready = false;
    console.log('[QwenEmbeddingProvider] Disposed');
  }
}
