/**
 * OpenAI Embedding 提供商
 * 支持 OpenAI API 和兼容 API
 */

import type {
  EmbeddingConfig,
  EmbeddingResult,
  BatchEmbeddingResult,
  IEmbeddingProvider,
} from '../../../shared/types/ai';
import { EMBEDDING_PROVIDER_DEFAULTS } from '../../../shared/types/ai';

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private config: EmbeddingConfig;
  private ready = false;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      ...EMBEDDING_PROVIDER_DEFAULTS.openai,
      ...config,
    };
  }

  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    // 验证 API 密钥
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.ready = true;
    console.log('[OpenAIEmbeddingProvider] Initialized');
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
      throw new Error('OpenAI API key is required');
    }

    const batchSize = this.config.batchSize || 100;
    const allEmbeddings: number[][] = [];
    let totalPromptTokens = 0;
    let totalTokens = 0;

    try {
      // 分批处理
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const response = await fetch(this.config.apiEndpoint || 'https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            input: batch,
            model: this.config.model,
            encoding_format: 'float',
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
          throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // 按 index 排序确保顺序正确
        const sortedData = data.data.sort((a: any, b: any) => a.index - b.index);
        
        for (const item of sortedData) {
          allEmbeddings.push(item.embedding);
        }

        if (data.usage) {
          totalPromptTokens += data.usage.prompt_tokens || 0;
          totalTokens += data.usage.total_tokens || 0;
        }
      }

      return {
        embeddings: allEmbeddings,
        model: this.config.model,
        usage: {
          promptTokens: totalPromptTokens,
          totalTokens,
        },
      };
    } catch (error) {
      console.error('[OpenAIEmbeddingProvider] Embed failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async dispose(): Promise<void> {
    this.ready = false;
    console.log('[OpenAIEmbeddingProvider] Disposed');
  }
}
