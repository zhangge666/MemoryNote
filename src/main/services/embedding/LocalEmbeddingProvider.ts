/**
 * 本地 Embedding 提供商
 * 使用 @xenova/transformers 在本地运行模型
 */

import { app } from 'electron';
import * as path from 'path';
import type {
  EmbeddingConfig,
  EmbeddingResult,
  BatchEmbeddingResult,
  IEmbeddingProvider,
} from '../../../shared/types/ai';
import { EMBEDDING_PROVIDER_DEFAULTS } from '../../../shared/types/ai';

// 动态导入 transformers，因为它是 ESM 模块
let pipeline: any = null;
let env: any = null;
let transformersLoaded = false;
let loadError: Error | null = null;

async function loadTransformers() {
  if (loadError) {
    throw loadError;
  }
  
  if (!transformersLoaded) {
    try {
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;
      
      // 配置模型缓存目录 - 使用 Electron 的 userData 路径
      const cacheDir = path.join(app.getPath('userData'), 'models', 'transformers');
      env.cacheDir = cacheDir;
      env.allowLocalModels = true;
      env.useBrowserCache = false;
      
      // 禁用远程模型检查（使用本地缓存）
      env.allowRemoteModels = true;
      
      transformersLoaded = true;
      console.log(`[LocalEmbeddingProvider] Transformers cache dir: ${cacheDir}`);
    } catch (error) {
      loadError = error as Error;
      console.error('[LocalEmbeddingProvider] Failed to load transformers:', error);
      throw error;
    }
  }
  return { pipeline, env };
}

export class LocalEmbeddingProvider implements IEmbeddingProvider {
  private config: EmbeddingConfig;
  private extractor: any = null;
  private ready = false;
  private initializing = false;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      ...EMBEDDING_PROVIDER_DEFAULTS.local,
      ...config,
    };
  }

  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    if (this.ready || this.initializing) {
      return;
    }

    this.initializing = true;
    console.log(`[LocalEmbeddingProvider] Initializing model: ${this.config.model}`);

    try {
      const { pipeline } = await loadTransformers();
      
      // 创建 feature-extraction pipeline
      this.extractor = await pipeline('feature-extraction', this.config.model, {
        quantized: true, // 使用量化模型以减少内存
      });

      this.ready = true;
      console.log('[LocalEmbeddingProvider] Model loaded successfully');
    } catch (error) {
      console.error('[LocalEmbeddingProvider] Failed to initialize:', error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.ready) {
      await this.initialize();
    }

    try {
      // 执行向量化
      const output = await this.extractor(text, {
        pooling: 'mean',
        normalize: true,
      });

      // 转换为普通数组
      const embedding = Array.from(output.data) as number[];

      return {
        embedding,
        model: this.config.model,
      };
    } catch (error) {
      console.error('[LocalEmbeddingProvider] Embed failed:', error);
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    if (!this.ready) {
      await this.initialize();
    }

    const batchSize = this.config.batchSize || 32;
    const embeddings: number[][] = [];

    try {
      // 分批处理
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        // 对每个文本进行向量化
        for (const text of batch) {
          const output = await this.extractor(text, {
            pooling: 'mean',
            normalize: true,
          });
          embeddings.push(Array.from(output.data) as number[]);
        }
      }

      return {
        embeddings,
        model: this.config.model,
      };
    } catch (error) {
      console.error('[LocalEmbeddingProvider] Batch embed failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async dispose(): Promise<void> {
    if (this.extractor) {
      // transformers.js 不需要显式释放
      this.extractor = null;
    }
    this.ready = false;
    console.log('[LocalEmbeddingProvider] Disposed');
  }
}
